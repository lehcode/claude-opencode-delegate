# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Running a single test

- `bun test test/models.test.ts` — one file
- `bun test -t "ambiguous"` — filter by test name (regex)

Bun runs `.ts` directly. Nothing is compiled or bundled (`tsconfig` sets `noEmit`); there is no `dist/`.

## What actually ships

The plugin's runtime behaviour lives in markdown, not in `src/`:

| Surface   | File                                             | Role                                                                             |
| --------- | ------------------------------------------------ | -------------------------------------------------------------------------------- |
| Skill     | `skills/opencode-delegate/SKILL.md`              | Model picking, brief template, review-after-return rules                         |
| Agent     | `agents/opencode-worker.md`                      | Thin forwarder: one `opencode run` (write: `build --auto`; read: `plan`), report |
| Command   | `commands/opencode.md`                           | `/opencode <model> -- <task>`: splits on `--`, spawns `opencode-worker`          |
| Manifests | `.claude-plugin/plugin.json`, `marketplace.json` | Plugin identity; `plugin.json` carries homepage/repository shown by Claude Code  |

`src/` is a library that no plugin surface imports since the MCP server was removed; only the tests exercise it. Its exports (`delegate`, `resolveModel`, `buildArgs`, `EventCollector`) are the reference for how `opencode run` must be invoked and how its JSON stream is parsed. Changing behaviour in `src/` does NOT change what the plugin does — the markdown files do. `opencode-worker` shells out to `opencode run` itself; keep its command consistent with `buildArgs`.

Invocation gotchas (observed on opencode 2.1.2):

- The command needs `</dev/null`. When stdin is an open pipe (as in Claude's Bash tool), `opencode run` waits for it to close and never creates a session.
- Write tasks must pass `--agent build`, because `default_agent` is `plan` both in this repo's `opencode.json` and in typical user configs.
- Without `--auto`, a headless run auto-rejects permission requests and continues; this is what makes `--agent plan` safe for read-only work.
- If no model is named, omit `-m` so opencode's configured default model is used.

Call chain inside `src/`: `delegate.ts` → `models.resolveModelOrThrow` (`listModels` → `opencode models`, cached 5 min) → `opencode.runOpencode` (spawns the process, folds stdout through `EventCollector`) → git-diff changed-files detection → `formatOutcome`.

## Model resolution rules (`src/models.ts`)

- An exact `provider/model` id wins first; `#variant` is split off and re-appended.
- Every token containing a digit must appear in the model name, so `grok 4.7` never matches 4.6.
- Ties prefer the candidate with fewer unrequested name tokens; a query without a version token is ambiguous whenever candidates tie.
- The same model from several providers goes to `OPENCODE_DELEGATE_PREFERRED_PROVIDERS` order first, then a direct provider over an `AGGREGATORS` reseller.

## Keeping docs and manifests in sync

- Defaults and env vars are defined in `src/config.ts` and documented in the README env table and the skill — update all three together.
- Version `0.1.0` appears in `package.json`, `plugin.json` and `marketplace.json` — bump all three.
