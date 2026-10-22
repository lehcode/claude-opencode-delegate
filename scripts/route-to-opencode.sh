#!/usr/bin/env bash
set -uo pipefail

# PreToolUse hook (matcher: Agent|Task): reroute Claude Code's built-in subagent calls
# to claudelegate:opencode-worker on Haiku. Explore/Plan/claude-code-guide prompts
# get a read-only prefix, statusline-setup a routed-from note; general-purpose, claude
# and untyped prompts are kept as is. Custom and plugin agents are never routed.
# Never blocks: every guard below passes the call through unchanged (exit 0, no stdout).

pass() { exit 0; }

# 1. jq is required to read and build JSON.
command -v jq >/dev/null 2>&1 || { echo "route-to-opencode: jq not found, not routing" >&2; pass; }

input=$(cat)

# 2. Input must be valid JSON with an object tool_input.
printf '%s' "$input" | jq -e '.tool_input | type == "object"' >/dev/null 2>&1 \
  || { echo "route-to-opencode: unparseable input or no tool_input, not routing" >&2; pass; }

# 3. Only Agent / Task calls.
tool=$(printf '%s' "$input" | jq -r '.tool_name // empty')
case "$tool" in Agent | Task) ;; *) pass ;; esac

# 4. Built-in agents only. Custom, project, user and plugin agents (including reviewers,
#    SDD agents and opencode-worker itself) stay on Claude. Empty counts as general-purpose.
subagent=$(printf '%s' "$input" | jq -r '.tool_input.subagent_type // empty')
case "$subagent" in
  "" | general-purpose | claude | Explore | Plan | claude-code-guide | statusline-setup) ;;
  *) pass ;;
esac

# 5. Global opt-out; same falsy values as src/config.ts bool(). Unset or empty means ON.
route="${OPENCODE_DELEGATE_ROUTE:-}"
shopt -s nocasematch
[[ "$route" =~ ^(0|false|no|off)$ ]] && pass
shopt -u nocasematch

# 6. opencode must be resolvable (a path via -x, a bare name via command -v).
bin="${OPENCODE_BIN:-opencode}"
case "$bin" in
  */*) [ -x "$bin" ] || pass ;;
  *) command -v "$bin" >/dev/null 2>&1 || pass ;;
esac

# 7. Per-task opt-out marker in the prompt.
prompt=$(printf '%s' "$input" | jq -r '.tool_input.prompt // empty')
case "$prompt" in *"[no-opencode]"*) pass ;; esac

# Rewrite. updatedInput replaces the whole input, so start from the original tool_input.
# Missing or empty subagent_type counts as general-purpose. All text is built by jq.
printf '%s' "$input" | jq -c '
  (.tool_input.subagent_type // "") as $t
  | (if $t == "" then "general-purpose" else $t end) as $name
  | (.tool_input.prompt // "") as $p
  | (if $name == "general-purpose" or $name == "claude" then $p
     elif $name == "Explore" or $name == "Plan" or $name == "claude-code-guide" then
       "Read-only task (routed from the `" + $name + "` subagent).\n\n" + $p
     else "Routed from the `" + $name + "` subagent.\n\n" + $p end) as $newp
  | {
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "allow",
      permissionDecisionReason: ("routed " + $name + " to claudelegate:opencode-worker"),
      updatedInput: (.tool_input + {subagent_type: "claudelegate:opencode-worker", model: "haiku"}
        + (if .tool_input | has("prompt") then {prompt: $newp} else {} end))
    }
  }'
