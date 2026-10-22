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
opencode run --format json -m <provider/model> [--auto] [--session …]
```

OpenCode is invoked directly via the slash command (`/opencode`) or the `opencode-worker` agent.
No MCP server, no stdio transport, no bun bundler.

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

You can use exact ids (`opencode-go/grok-4.7`) or loose names (`grok 4.7`, `kimi k3`,
`deepseek v4 flash`).

- If the same model is offered by several providers, the model maker's own provider wins over
  resellers such as `opencode-go`, `opencode`, and `openrouter`. So `grok 4.7` resolves to
  `xai/grok-4.7`.
- A provider word in the name overrides that, so "opencode-go grok 4.7" resolves to
  `opencode-go/grok-4.7`. To set your own order, use `OPENCODE_DELEGATE_PREFERRED_PROVIDERS`.
- A version you name must match exactly, so `grok 4.7` never silently becomes 4.6.
- If a name matches several different models, you get a list of candidates instead of a guess. For
  example, `mimo` matches several MiMo models.
- Add `#variant` for a reasoning variant: `xai/grok-4.7#high`.
- If you don't name a model, tasks that edit files use `opencode-go/muse-spark-1.3-contributor`.
  Read-only tasks (`auto: false`) use the free `opencode/muse-spark-1.3-contributor-free`. You can
  change both with the env vars below.

### Slash command

`/opencode <model> -- <task>` — delegate to an OpenCode model. The slash command expands the
brief, spawns an `opencode-worker` subagent, and waits for the result.

### Agent

The `opencode-worker` agent is a ready-made supervisor. Give it a model and task — it gathers
context, writes the brief, delegates, verifies, iterates, and reports.

### Permissions

By default the delegated model runs with `--auto`. It can edit files and run commands without
asking, but any rule you set to `deny` in your OpenCode config is still enforced. Pass
`auto: false`, or set `OPENCODE_DELEGATE_AUTO=false`, for read-only runs. Claude is told to review
every change it gets back.

### Using it from workflows

Workflow `agent()` calls and subagents can use the `opencode-worker` agent directly. If you fan out
tasks that edit files, give each one its own `git worktree` so they don't conflict.

## Configuration (env vars)

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
