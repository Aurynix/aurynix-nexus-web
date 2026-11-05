# Aurynix Nexus Web

The web client for Aurynix Nexus, an AI business assistant. It streams conversations with an agent that can search your documents, remember facts about you, and work with your Gmail and Google Calendar. Before the agent sends an email or changes your calendar, it stops and asks for your approval.

This repository contains only the frontend. The API and agents live in [`Aurynix/aurynix-nexus`](https://github.com/Aurynix/aurynix-nexus).

**Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, Radix UI, TanStack Query 5, React Hook Form with Zod.

## Getting started

You need Node.js and a running Aurynix Nexus API.

```bash
npm install
```

Create `.env.local` in the project root:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

Then start the app at <http://localhost:3000>:

```bash
npm run dev
```

| Command | What it does |
|---|---|
| `npm run dev` | Starts the development server |
| `npm run build` | Creates a production build |
| `npm run start` | Serves the production build |
| `npm run lint` | Runs ESLint |

The repo has no frontend test runner. Use `npx tsc --noEmit`, `npm run lint` and `npm run build` to check a change.

> **Next.js 16 differs from older versions.** For example, the route guard lives in `src/proxy.ts`, not `middleware.ts`. Check the docs in `node_modules/next/dist/docs/` rather than relying on memory.

### Environment variable

`NEXT_PUBLIC_API_URL` is the only variable. It must be the backend's full API base: include `/api/v1` and leave off the trailing slash.

It's read in `next.config.ts` to build the proxy rewrite, and that rewrite is fixed at build time. **After changing the value you must rebuild or redeploy.** A restart isn't enough.

## How it works

### Requests go through a same-origin proxy

The browser never calls the API directly. Every request goes to `/api/proxy/*` on the app's own origin, and a Next.js rewrite forwards it to the backend:

```
Browser  ──>  /api/proxy/auth/me  ──>  {NEXT_PUBLIC_API_URL}/auth/me
              (same origin)            (rewrite in next.config.ts)
```

Normal app traffic therefore needs no CORS setup, and browser DevTools shows only `/api/proxy/...` URLs, never the real backend.

### Authentication

| Item | Where it's stored | Purpose |
|---|---|---|
| Access token | Memory only (`tokenStore` in `src/lib/api/client.ts`) | Sent as a Bearer token; lost on page reload by design |
| Refresh token | `localStorage` (`nexus_refresh_token`) | Gets a new access token on load or after a 401 |
| `nexus_session` cookie | Browser cookie | A flag that lets the route guard see that a session exists |

- **Refreshing:** on a 401, `apiClient` refreshes the token and retries the request once. Concurrent callers share a single refresh, and the rotated refresh token is saved each time.
- **Route guard:** `src/proxy.ts` sends signed-out visitors from `/app/*` to `/login`, and signed-in users from `/login` and `/register` to `/app`. It only checks that the cookie exists, so it controls navigation, not security. The API enforces access.
- **Google sign-in:** `GoogleButton` asks the backend for a Google URL, using `mode=signin` on the login page and `mode=signup` on the register page. Only `signup` creates a new account. The backend then sends the browser to `/auth/callback`, which exchanges a single-use code for tokens.

### Chat streaming

Chat is a server-sent event (SSE) stream from `POST /chat/stream`. `EventSource` can't send a POST body or an `Authorization` header, so `src/lib/chat/stream.ts` reads the `fetch` response body directly. It buffers across network chunks, because an event can be split between two chunks.

| Event | Meaning |
|---|---|
| `metadata` | Carries the conversation ID |
| `agent_start` | An agent began working (ignored by the UI) |
| `tool_start` / `tool_end` | Drives status text such as "Searching your documents" |
| `token` | The next piece of the reply |
| `interrupt` | The agent has paused and needs an answer |
| `error` | The turn failed; `detail` holds the message |
| `ping` | Keep-alive (ignored by the UI) |
| `done` | The stream is closing; also sent after `error` |

`ChatWindow` manages all of this with a reducer. Two behaviours are easy to break:

- **The URL changes during a stream.** A new chat only gets its ID from the first event. It uses `history.replaceState` to update the URL, because `router.replace` would unmount the component and cancel the stream.
- **An empty reply is reported as an error.** A stream that closes with no tokens, no error and no pending approval shows a message instead of an empty bubble.

### Approvals

The agent can't send email or change a calendar without you. A write action works like this:

1. The stream sends an `interrupt` and stops.
2. `parsePendingAction` (`src/lib/chat/pending-action.ts`) reads the payload. It accepts several payload shapes and falls back to the question text for anything it doesn't recognise, so a pause is never lost.
3. `ApprovalCard` shows the details inline in the conversation.
4. The buttons disable while the answer is being sent, so an email can't be approved twice. If sending the answer fails, the card stays and offers a retry.
5. A status line such as "Sent to jane@example.com" replaces the card.

Typing a reply instead of clicking sends your words to the agent to interpret. Reloading a paused conversation shows the buttons again.

### Data fetching

All server data lives in TanStack Query and isn't copied into component state. Each area of the app uses the same three parts, and mutations invalidate queries instead of patching the cache:

```
src/types/<area>.ts  →  src/lib/api/<area>.ts  →  src/hooks/use<Area>.ts
```

| Area | Hook | Backend path |
|---|---|---|
| Auth and session | `useAuth` | `/auth/*` |
| Conversations | `useConversations` | `/chat/conversations` |
| Chat stream | `streamChat` (not a hook) | `/chat/stream` |
| Documents | `useDocuments` | `/documents` |
| Memory | `useMemory` | `/memory` |
| Contact groups | `useContactGroups` | `/contact-groups` |
| Timezone | `useTimezone` | `/memory` (saved as a fact) |
| Google connection | API module only | `/oauth/google/*` |

Memory queries are refreshed after every chat turn, because facts can change without any visible stream event.

The full API contract is in [`frontend-api-reference.md`](frontend-api-reference.md). It dates from the project's start, so check the backend's `/openapi.json` if the two disagree.

### Theming

Colours are CSS variables in `src/app/globals.css`, with overrides under `.dark`. `next-themes` sets the class on `<html>`. The default follows the device, and the header button switches between light and dark. A manual choice is saved in `localStorage`. Switching back to the theme the device is using clears that choice, so the app follows the device again.

## Pages

| Route | What it does | Access |
|---|---|---|
| `/` | Redirects to `/app` | Public |
| `/login` | Sign in with a password or Google | Signed out |
| `/register` | Create an account with a password or Google | Signed out |
| `/auth/callback` | Completes Google sign-in | Public |
| `/app` | Dashboard with recent activity and a quick-start box | Signed in |
| `/app/chat` | New conversation | Signed in |
| `/app/chat/[conversationId]` | Existing conversation | Signed in |
| `/app/conversations` | Conversation history, with paused threads flagged | Signed in |
| `/app/documents` | Upload PDF, DOCX or TXT files and track processing | Signed in |
| `/app/documents/[documentId]` | Document details and extracted chunks | Signed in |
| `/app/memory` | View, add, edit and delete remembered facts | Signed in |
| `/app/contact-groups` | Named email groups, up to 100 addresses each | Signed in |
| `/app/settings/profile` | Account details | Signed in |
| `/app/settings/security` | Session and password information | Signed in |
| `/app/settings/integrations` | Google connection, granted access and timezone | Signed in |

`/app/settings` redirects to the profile page.

The timezone setting decides how phrases like "tomorrow at 9 am" are understood. If no valid timezone is saved, the backend uses UTC, so check this first if a meeting lands at the wrong time.

## Project structure

```
src/
├── app/                 Routes (App Router)
│   ├── app/             Signed-in pages and shell
│   ├── auth/callback/   Google sign-in landing page
│   ├── login/, register/
│   ├── globals.css      Theme variables and global styles
│   └── layout.tsx       Root layout and providers
├── components/
│   ├── auth/            Google button and form divider
│   ├── chat/            Chat window, messages, composer, approval card
│   ├── layout/          Header, sidebar, mobile nav, theme provider
│   ├── settings/        Timezone card
│   └── ui/              Shared Radix-based components
├── context/             Auth and TanStack Query providers
├── hooks/               Data hooks for each area
├── lib/
│   ├── api/             API client and one module per area
│   ├── chat/            SSE stream, event parser, approval parser
│   ├── google-capabilities.ts   Reads granted Google access
│   ├── oauth-errors.ts  Turns OAuth error codes into readable text
│   └── timezone.ts
├── types/               TypeScript types for each area
└── proxy.ts             Route guard
```

## Deployment

The frontend runs on Vercel and the API on Render. A merge to `main` triggers a production deployment of each.

**Vercel** needs one variable:

```bash
NEXT_PUBLIC_API_URL=https://aurynix-nexus.onrender.com/api/v1
```

Google sign-in also depends on these **backend** settings in Render, using the frontend's real URL:

| Backend variable | Value |
|---|---|
| `FRONTEND_URL` | `https://aurynix-nexus-web.vercel.app` (no trailing slash) |
| `GOOGLE_SIGNIN_REDIRECT_URI` | `https://aurynix-nexus.onrender.com/api/v1/auth/google/callback` |
| `GOOGLE_REDIRECT_URI` | `https://aurynix-nexus.onrender.com/api/v1/oauth/google/callback` |
| `OAUTH_SUCCESS_REDIRECT` | `https://aurynix-nexus-web.vercel.app/app/settings/integrations?oauth=success` |

Both redirect URIs must also be listed under **Authorized redirect URIs** in Google Cloud Console. Sign-in and connecting Gmail and Calendar are separate flows, which is why there are two.

## Troubleshooting

| Symptom | Likely cause | What to do |
|---|---|---|
| All API calls return 502 and Vercel shows `ROUTER_EXTERNAL_TARGET_CONNECTION_ERROR` | The build points at an unreachable backend | Fix `NEXT_PUBLIC_API_URL` and redeploy |
| API calls return 404 | `NEXT_PUBLIC_API_URL` is missing `/api/v1` | Fix the value and redeploy |
| Changing the variable has no effect | The rewrite is fixed at build time | Redeploy |
| Google shows `redirect_uri_mismatch`, or sends you to `localhost` | A redirect setting above is missing or wrong | Check the backend variables and Google Cloud Console |
| 404 after connecting Google | `OAUTH_SUCCESS_REDIRECT` has the wrong path | Use `/app/settings/integrations?oauth=success` |
| "No Aurynix account is linked" | Login never creates accounts | Use **Sign up with Google** on `/register` |
| Meetings land at the wrong time | No valid timezone is saved, so the backend uses UTC | Set it in **Settings → Integrations** |
| The theme doesn't follow the device | A manual choice is saved | Click the header theme button until it matches the device, which clears the choice |

## Known limitations

| Limitation | Why |
|---|---|
| Conversation titles come from the first message | The backend doesn't generate titles |
| Pending actions can't be edited inline | By design: cancel and ask again |
| No profile or password editing, or password reset | The backend has no endpoints for them |
| No document pagination or file preview | The list returns everything, and files can't be served back |
| Document processing is tracked by polling | There's no push channel |
| No conversation search | The backend has no search parameter |
