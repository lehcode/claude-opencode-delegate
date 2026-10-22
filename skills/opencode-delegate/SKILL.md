---
name: opencode-delegate
description: Delegate coding or analysis work to another model through OpenCode (Grok, Kimi, GLM, Qwen, DeepSeek, MiMo, MiniMax, GPT… anything `opencode models` lists) while Claude stays the orchestrator. Use when the user says things like "use grok 4.7 via opencode to implement X", "ask kimi via opencode", "delegate this to glm", "get a second opinion from deepseek", "have opencode do it", or asks to run/compare several OpenCode models.
---

# Delegating to OpenCode models

Use the `opencode` slash command (`/opencode <model> -- <task>`) or the `opencode-worker` agent to delegate tasks to an OpenCode model. The delegated model has its own tools (read, edit, shell), so it can implement code, not just answer. **You stay the orchestrator**: you hand over the task, and you review what comes back.

## Mechanism

The `opencode-worker` agent is the only mechanism. It is a thin forwarder that runs `opencode run --format json` directly and reports the session id, the reply and the changed files. It does not review, fix or retry.

| Method                        | When to use                                 |
| ----------------------------- | ------------------------------------------- |
| `/opencode <model> -- <task>` | Simple delegation: spawns `opencode-worker` |
| `opencode-worker` agent       | Workflows, parallel fan-out, iteration      |

## Modes

| Mode            | When                                      | OpenCode flags               |
| --------------- | ----------------------------------------- | ---------------------------- |
| write (default) | Implement, fix, refactor                  | `--agent build --auto`       |
| read-only       | Review, question, summary, second opinion | `--agent plan` (no `--auto`) |

Write mode passes `--agent build` because the project default agent may be `plan`. `--auto` approves permissions not explicitly denied; opencode rules set to "deny" are still enforced. In read-only mode, permission requests are rejected rather than approved.

## Picking the model

- Pass what the user said: `grok 4.7`, `kimi k3`, `xai/grok-4.7`. The agent resolves a loose name against `opencode models` and requires an exact version match. If several distinct models match, it returns the candidate list instead of guessing; choose one, and ask the user only if their intent is unclear.
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

The agent reports the model used, session id, exit status, changed files and OpenCode's own report.

1. Read the diff (`git diff`) for the files it lists.
2. Run the tests or build yourself.
3. To fix something, either continue the **same session** with feedback, or fix it yourself if that's quicker.
4. Tell the user which model did what, and your verdict on it.

## Parallel and multi-model patterns

- **Fan out**: spawn separate `opencode-worker` agents for each model or subtask. Parallel tasks that edit files must use **separate git worktrees** (`git worktree add`) or non-overlapping files, because they share the directory.
- **Compare**: give the same task to 2–3 models in separate worktrees, then diff the results and pick or merge the best one.
- **Second opinion**: read-only mode with a prompt like "review this diff for bugs: …".
- **Subagents / workflows**: spawn `opencode-worker` with the model and task in its prompt, e.g. "Use opencode model kimi k3 to add tests for src/foo.ts".
