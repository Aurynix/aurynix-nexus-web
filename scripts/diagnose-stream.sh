#!/usr/bin/env bash
# Diagnose why /chat/stream returns no tokens.
#
# Usage:
#   1. In the browser (logged in), open DevTools → Application → Local Storage
#      → copy the value of "nexus_refresh_token".
#   2. ./scripts/diagnose-stream.sh '<that value>'
#
# Prints the RAW SSE bytes from the backend, bypassing the browser entirely.

set -uo pipefail

REFRESH_TOKEN="${1:-}"
API="${NEXT_PUBLIC_API_URL:-https://aurynix.duckdns.org/api/v1}"
MESSAGE="${2:-hello}"

if [ -z "$REFRESH_TOKEN" ]; then
  echo "usage: $0 '<nexus_refresh_token>' [message]" >&2
  exit 2
fi

echo "── 1. Exchanging refresh token for an access token ──"
REFRESH_RESPONSE=$(curl -s -w '\n%{http_code}' --max-time 15 \
  -X POST "$API/auth/refresh" \
  -H 'Content-Type: application/json' \
  -d "{\"refresh_token\":\"$REFRESH_TOKEN\"}")

REFRESH_STATUS=$(tail -n1 <<<"$REFRESH_RESPONSE")
REFRESH_BODY=$(sed '$d' <<<"$REFRESH_RESPONSE")
echo "HTTP $REFRESH_STATUS"

if [ "$REFRESH_STATUS" != "200" ]; then
  echo "$REFRESH_BODY"
  echo
  echo "→ Refresh failed. Your session is stale: sign out and back in, then retry."
  exit 1
fi

ACCESS_TOKEN=$(sed -n 's/.*"access_token":"\([^"]*\)".*/\1/p' <<<"$REFRESH_BODY")
echo "Got an access token (${#ACCESS_TOKEN} chars)"
echo

echo "── 2. Streaming POST $API/chat/stream ──"
echo "(raw bytes, unbuffered, timestamped)"
echo
curl -sS --no-buffer --max-time 120 \
  -X POST "$API/chat/stream" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H 'Content-Type: application/json' \
  -H 'Accept: text/event-stream' \
  -d "{\"message\":\"$MESSAGE\",\"conversation_id\":null}" \
  | while IFS= read -r line; do
      printf '[%s] %s\n' "$(date +%H:%M:%S.%3N)" "$line"
    done

echo
echo "── How to read this ──"
echo "  token events present  → backend is fine, the bug is in the frontend"
echo "  only metadata + done  → backend is producing nothing (agent/LLM side)"
echo "  an error event        → backend is reporting the failure; read its detail"
echo "  nothing at all / hang → connection or nginx buffering issue"
