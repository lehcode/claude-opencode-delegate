---
name: opencode-delegate
description: Delegate coding or analysis work to another model through OpenCode (Grok, Kimi, GLM, Qwen, DeepSeek, MiMo, MiniMax, GPT… anything `opencode models` lists) while Claude stays the orchestrator. Use when the user says things like "use grok 4.7 via opencode to implement X", "ask kimi via opencode", "delegate this to glm", "get a second opinion from deepseek", "have opencode do it", or asks to run/compare several OpenCode models.
---

# Delegating to OpenCode models

From the main thread, delegate through the `opencode-worker` agent (spawned in the background) or the `opencode` slash command (`/opencode <model> -- <task>`), which spawns it. The worker is the only caller of the `opencode` MCP tools. The delegated model has its own tools (read, edit, shell), so it can implement code, not just answer. **You stay the orchestrator**: you hand over the task, and you review what comes back.

## Mechanism

The `opencode` MCP server runs `opencode run` in the project and returns the reply, session id, token usage and git changes. The `opencode-worker` agent calls its `delegate` tool, verifies the git changes and tests, iterates at most twice with the same `session_id`, and reports. The main thread never calls `delegate` or `delegate_async`: `delegate` blocks it, async tasks are lost when the MCP server restarts, and a PreToolUse hook denies the call.

| Method                        | When to use                                                |
| ----------------------------- | ---------------------------------------------------------- |
| `opencode-worker` agent       | Implementation, read-only exploration, parallel fan-out    |
| `/opencode <model> -- <task>` | Simple delegation: spawns `opencode-worker`                |
| MCP tools                     | Called by `opencode-worker` only, never by the main thread |

## Tools (used by the worker)

| Tool                                        | Use                                                                         |
| ------------------------------------------- | --------------------------------------------------------------------------- |
| `list_models` (`filter?`)                   | Find the exact `provider/model` id.                                         |
| `delegate`                                  | Run a task and wait for the result.                                         |
| `delegate_async` → `task_result` (`wait_s`) | Long tasks, or several models in parallel. Also `task_list`, `task_cancel`. |
| `list_sessions`                             | Find a `session_id` to continue.                                            |

In a plugin install the tools are named like `mcp__plugin_claudelegate_opencode__delegate`. With a manual install they are `mcp__opencode__delegate`. The worker's `prompt` must be a self-contained brief (the model cannot see this conversation); pass `auto: false` for read-only work, `session_id` to continue.

## Modes

| Mode            | When                                      | OpenCode flags               |
| --------------- | ----------------------------------------- | ---------------------------- |
| write (default) | Implement, fix, refactor                  | `--agent build --auto`       |
| read-only       | Review, question, summary, second opinion | `--agent plan` (no `--auto`) |

Write mode passes `--agent build` because the project default agent may be `plan`. `--auto` approves permissions not explicitly denied; opencode rules set to "deny" are still enforced. In read-only mode, permission requests are rejected rather than approved.

## Picking the model

- Pass what the user said: `grok 4.7`, `kimi k3`, `xai/grok-4.7`. The `delegate` tool resolves a loose name against `opencode models` and requires an exact version match. If several models match, it returns an ambiguous error with the candidates and the worker picks the best candidate that fits the instructions (a named provider wins); name the exact `provider/model` when the choice matters.
- For a reasoning variant, add `#variant`, e.g. `xai/grok-4.7#high`.
- If the user names no model, omit it. OpenCode then uses its configured default model.

## Writing the task

OpenCode restores its own context from engram (persistent memory), Graphiti and codegraph, so the brief can be short. Give:

1. **Goal**: what to build or fix.
2. **Constraints**: what not to touch. The agent already tells the model not to commit unless the task says so.
3. **Done when**: acceptance criteria, e.g. "`bun test` passes".

Skip pasting file contents and long background; the model looks them up. Run from the project root.

## Continuing a session

The agent reports a session id. To give feedback or continue after a timeout, invoke `opencode-worker` again with that session id and precise feedback.

## After it returns: review, don't trust blindly

The worker has already checked the git changes and run the tests; it reports the model used, session id, changed files, its verification and a verdict. Still read the diff.

1. Read the diff (`git diff`) for the files it lists.
2. Run the tests or build yourself.
3. To fix something, either continue the **same session** with feedback, or fix it yourself if that's quicker.
4. Tell the user which model did what, and your verdict on it.

## Parallel and multi-model patterns

- **Fan out**: spawn separate `opencode-worker` agents for each model or subtask. Parallel tasks that edit files must use **separate git worktrees** (`git worktree add`) or non-overlapping files, because they share the directory.
- **Compare**: give the same task to 2–3 models in separate worktrees, then diff the results and pick or merge the best one.
- **Second opinion**: read-only mode with a prompt like "review this diff for bugs: …".
- **Subagents / workflows**: spawn `opencode-worker` with the model and task in its prompt, e.g. "Use opencode model kimi k3 to add tests for src/foo.ts".
