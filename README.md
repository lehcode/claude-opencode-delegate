# claude-opencode-delegate

Give Claude **every model in your [OpenCode](https://opencode.ai) install** as a delegate: Grok,
Kimi, GLM, Qwen, DeepSeek, MiMo, MiniMax, and any other provider you've connected. Claude stays
the orchestrator. It plans the work, briefs the other model, reviews the diff, and runs the tests.

```
you ▸ use grok 4.7 from xAI in opencode to implement the CSV export, you review it

claude ▸ spawn opencode-worker subagent with model "grok 4.7" and brief

opencode ▸ grok-4.7 edits src/export.ts, runs tests …

claude ▸ reviews git diff, runs `bun test`, and reports back
```

It works in:

- **Claude Code** (CLI, IDE, desktop): you can ask directly, use `/opencode`, use the
  `opencode-delegate` skill, or use the `opencode-worker` agent.
- **Claude Desktop** on Linux, macOS, or Windows: use the skill/agent files directly or run
  OpenCode from the terminal.

## How it works

```
Claude Code / Claude Desktop / subagent / workflow
        │  agent activation (skill, slash-command, subagent)
        ▼
opencode-delegate skill/agent files
        │  guide Claude
        ▼
opencode-worker agent (Bash only)
        │  runs one command
        ▼
opencode run --format json --agent build --auto [-m <provider/model>] [--session …] -- "<prompt>"
```

The `opencode-worker` agent is a thin forwarder: it resolves the model, prefixes the task with a short memory-restore preamble (OpenCode restores its own context from engram, Graphiti and codegraph), runs `opencode run` directly, and reports the session id, the reply and the changed files. Write tasks use `--agent build --auto`; read-only tasks use `--agent plan` without `--auto`. No MCP server, no stdio transport, no bun bundler.

The `opencode` CLI uses your existing OpenCode auth, config, agents, and permission rules. It
does not use a separate API.

## Requirements

- [OpenCode](https://opencode.ai) v2+ with at least one provider set up. Check that
  `opencode models` lists something.

## Install

### Claude Code: plugin (recommended)

```text
/plugin marketplace add aashahin/claude-opencode-delegate
/plugin install opencode-delegate@claude-opencode-delegate
```

This gives you the **opencode-delegate** skill, the **opencode-worker** agent, and the
**/opencode** command.

## Usage

Talk to Claude normally:

- _"Use grok 4.7 from xAI in opencode to implement pagination for /api/users. You review it."_
- _"Ask kimi k3 via opencode for a second opinion on this diff, read-only."_
- _"Have glm 5.3 and qwen 3.8 max both implement the parser in separate worktrees, then pick the better one."_
- `/opencode deepseek v4 flash -- write unit tests for src/date.ts`
- _"Spawn opencode-worker subagents: minimax m3 does the docs, kimi k3 does the tests."_

### Model names

You can use exact ids (`opencode-go/grok-4.7`) or loose names (`grok 4.7`, `kimi k3`, `deepseek v4 flash`).

- A loose name is resolved by the `opencode-worker` agent against the output of `opencode models`, to a single exact `provider/model`.
- A version you name must match exactly, so `grok 4.7` never silently becomes 4.6.
- If a name matches several different models, you get a list of candidates instead of a guess. For example, `mimo` matches several MiMo models.
- Add `#variant` for a reasoning variant: `xai/grok-4.7#high`.
- If you don't name a model, `-m` is omitted and OpenCode uses its own configured default model.

### Slash command

`/opencode <model> -- <task>` — delegate to an OpenCode model. The slash command passes the task to an `opencode-worker` subagent and waits for the result, then reviews the diff and runs the tests.

### Agent

The `opencode-worker` agent is a ready-made forwarder. Give it a model and task — it runs `opencode run` and reports the session id, the reply and the changed files. It does not review or retry; Claude reviews, and iterates by invoking the agent again with the session id and feedback.

### Permissions

Write tasks run with `--agent build --auto`. The delegated model can edit files and run commands without asking, but any rule you set to `deny` in your OpenCode config is still enforced. Read-only tasks (reviews, questions, second opinions) run with `--agent plan` and without `--auto`, so permission requests are rejected. Claude is told to review every change it gets back.

### Using it from workflows

Workflow `agent()` calls and subagents can use the `opencode-worker` agent directly. If you fan out
tasks that edit files, give each one its own `git worktree` so they don't conflict.

## Configuration (env vars)

The `opencode-worker` agent honors only `OPENCODE_BIN`. The other variables are read only by the `src/` library.

| Variable                                | Default                                    | Description                                                                                                  |
| --------------------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| `OPENCODE_BIN`                          | auto-detected                              | Path to the `opencode` executable.                                                                           |
| `OPENCODE_DELEGATE_DEFAULT_MODEL`       | `opencode-go/muse-spark-1.3-contributor`   | Model used when `model` is omitted. Set it to `""` to use opencode's own default.                            |
| `OPENCODE_DELEGATE_READ_MODEL`          | `opencode/muse-spark-1.3-contributor-free` | Model used when `model` is omitted and `auto` is false (reading files, reviews, questions). Free by default. |
| `OPENCODE_DELEGATE_AUTO`                | `true`                                     | Default for `auto`.                                                                                          |
| `OPENCODE_DELEGATE_TIMEOUT`             | `1800`                                     | Seconds before a run is killed.                                                                              |
| `OPENCODE_DELEGATE_MAX_OUTPUT`          | `40000`                                    | Maximum number of response characters returned to Claude.                                                    |
| `OPENCODE_DELEGATE_CWD`                 | the server's cwd                           | Base directory for `cwd`.                                                                                    |
| `OPENCODE_DELEGATE_PREFERRED_PROVIDERS` | _(none)_                                   | Comma-separated provider order used when a model is offered by several providers, e.g. `xai,opencode-go`.    |
| `OPENCODE_DELEGATE_THINKING`            | `true`                                     | Include `--thinking` so reasoning/thinking blocks appear in output.                                          |

## Development

```bash
bun install
bun test            # unit tests (fixtures captured from real `opencode run --format json`)
bun run typecheck
bun run lint
bun run fmt
```

## License

MIT
