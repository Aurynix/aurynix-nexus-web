/**
 * A write action the agent has paused on, waiting for the user to approve it.
 *
 * The backend pauses via a LangGraph `interrupt` and sends the action alongside
 * the human-readable question. Shapes here are the *normalised* form the UI
 * renders — see `parsePendingAction` for the tolerant mapping from the wire.
 */

export type ApprovalKind = "email" | "calendar" | "generic";

/** What the user did with a pending action. */
export type ApprovalChoice = "approved" | "cancelled" | "replied";

export interface EmailApproval {
  kind: "email";
  operation: "send" | "reply";
  to: string[];
  cc: string[];
  bcc: string[];
  subject: string | null;
  /** Plain text. Line breaks are significant and must be preserved. */
  body: string;
  /** The original question text, kept as a fallback and for copy/debugging. */
  raw: string;
}

export interface CalendarApproval {
  kind: "calendar";
  operation: "create" | "update" | "delete";
  title: string | null;
  /** ISO timestamp, or a plain `YYYY-MM-DD` when `allDay`. */
  start: string | null;
  end: string | null;
  allDay: boolean;
  durationMinutes: number | null;
  /** The timezone the backend resolved relative phrasing against, if it says. */
  timezone: string | null;
  location: string | null;
  attendees: string[];
  description: string | null;
  raw: string;
}

export interface GenericApproval {
  kind: "generic";
  question: string;
  /** Best guess at the subject matter, used only to pick an icon/caption. */
  hint: ApprovalKind | null;
  raw: string;
}

export type PendingAction = EmailApproval | CalendarApproval | GenericApproval;

/** A pending action the user has already decided on, kept as a status line. */
export interface ResolvedAction {
  id: string;
  action: PendingAction;
  choice: ApprovalChoice;
  /** Id of the message this decision came after, so it renders in order. */
  afterMessageId: string | null;
}
