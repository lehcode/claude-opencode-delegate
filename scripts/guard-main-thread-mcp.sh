#!/usr/bin/env bash
set -uo pipefail

# PreToolUse hook (matcher: this plugin's MCP delegate tools): deny delegate / delegate_async
# calls made from the main thread. Only the opencode-worker subagent may call them; the main
# thread spawns the worker in the background instead. Hook input carries agent_id only when
# the hook fires inside a subagent.
# Never fails into a deny on errors: every guard below passes the call through (exit 0, no stdout).

pass() { exit 0; }

# 1. jq is required to read and build JSON.
command -v jq >/dev/null 2>&1 || { echo "guard-main-thread-mcp: jq not found, not guarding" >&2; pass; }

input=$(cat)

# 2. Input must be a JSON object.
printf '%s' "$input" | jq -e 'type == "object"' >/dev/null 2>&1 \
  || { echo "guard-main-thread-mcp: unparseable input, not guarding" >&2; pass; }

# 3. Global opt-out; same falsy values as the routing hook. Unset or empty means ON.
route="${OPENCODE_DELEGATE_ROUTE:-}"
shopt -s nocasematch
[[ "$route" =~ ^(0|false|no|off)$ ]] && pass
shopt -u nocasematch

# 4. Only this plugin's delegate / delegate_async tools.
tool=$(printf '%s' "$input" | jq -r '.tool_name // empty')
case "$tool" in
  mcp__plugin_claudelegate_opencode__delegate | mcp__plugin_claudelegate_opencode__delegate_async | \
    mcp__opencode__delegate | mcp__opencode__delegate_async) ;;
  *) pass ;;
esac

# 5. Inside a subagent (non-empty agent_id) the call is allowed.
agent_id=$(printf '%s' "$input" | jq -r '.agent_id // empty | tostring')
[ -n "$agent_id" ] && pass

jq -cn '{
  hookSpecificOutput: {
    hookEventName: "PreToolUse",
    permissionDecision: "deny",
    permissionDecisionReason: "The main thread must not call the opencode delegate tools: they block it, and async tasks are lost when the MCP server restarts. Spawn the `claudelegate:opencode-worker` subagent in the background (Agent tool, run_in_background: true) with the model, mode and task in its prompt; only the worker calls delegate."
  }
}'
