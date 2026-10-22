# Agent Instructions

## Commands

```
bun install          # install deps (uses bun.lock)
bun test             # run unit tests (fixture-based, no services needed)
bun run typecheck    # TypeScript strict check (bun check)
bun run lint         # lint (eslint)
bun run fmt          # format check (prettier)
bun run fmt:fix      # auto-fix formatting (prettier)
bun run verify       # typecheck + test + lint + format (all-in-one)
```

CI (`.github/workflows/ci.yml`) runs these in order: `install → verify`.

## Hooks

Tracked hooks live in `hooks/`. They run automatically on commit/push:

- **pre-commit**: Prettier check + ESLint on staged files only (fast). Skips docs-only changes.
- **pre-push**: Full `npm run verify` (typecheck, test, lint, format). Runs once per push.

Configure after clone: `git config core.hooksPath hooks/`

## Architecture

Claude Code plugin with a bundled MCP server (`.claude-plugin/plugin.json` `mcpServers` → `dist/index.js`, built from `src/index.ts` with `bun run build`; commit the bundle, CI checks it is current). Core modules:

| File          | Role                                                                                                                        |
| ------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `index.ts`    | MCP server (stdio): `delegate`, `delegate_async`, `task_result`, `task_list`, `task_cancel`, `list_models`, `list_sessions` |
| `config.ts`   | Resolve `opencode` binary path, env-based defaults, bool/int helpers                                                        |
| `models.ts`   | Model listing (cached 5 min), loose-name → provider/model resolution, aggregator priority                                   |
| `opencode.ts` | Spawn `opencode run --format json`, fold JSON event stream into `EventCollector`                                            |
| `delegate.ts` | Build args, git-diff changed-files detection, format outcome                                                                |
| `tasks.ts`    | In-memory async task store (UUID keys, max 100 finished), prune oldest                                                      |

Tests mirror this structure: `test/models.test.ts` (resolution logic), `test/opencode.test.ts`
(EventCollector + buildArgs), `test/mcp-server.test.ts` (spawns the server, checks `tools/list`). Fixtures are JSONL captured from real `opencode run` sessions.

## Gotchas

- **Model resolution rejects ambiguity.** `resolveModel("mimo", ...)` returns an error (not a
  guess) when multiple models tie. Tests assert this with `toStartWith("ERR:")`.
- **`EventCollector` handles non-JSON.** If the stream emits non-JSON lines they fall through to
  `raw[]` and `text` falls back to `raw.join("\n")`.
- **`buildArgs` drops `--fork`** if there is no `session_id` and `continueLast` is false. The
  test asserts the `--fork` flag is absent when neither is set.
- **Config bools** are case-insensitive: `"0"`, `"false"`, `"no"`, `"off"` → `false`; everything
  else (including `""`) → `true`.
- **Tests use Bun's built-in `bun:test`** — do not switch to vitest or jest; `package.json` has
  no test framework deps.

## CLI & Plugin

- Slash command (`commands/opencode.md`) wraps the skill: `/opencode <model> -- <task>`
- Claude Code plugin: install via `/plugin marketplace add lehcode/claudelegate`
