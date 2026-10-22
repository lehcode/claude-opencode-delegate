# Changelog

## [0.2.0](https://github.com/lehcode/claudelegate/compare/v0.1.0...v0.2.0) (2026-10-22)


### ⚠ BREAKING CHANGES

* the plugin installs as claudelegate@claudelegate (was opencode-delegate@claude-opencode-delegate); MCP tools are mcp__plugin_claudelegate_opencode__* (was mcp__plugin_opencode-delegate_opencode__*); the worker is claudelegate:opencode-worker; the npm package and bin are @lehcode/claudelegate and claudelegate. Update permission allowlists.
* the skill is now delegate, invoked as claudelegate:delegate (was opencode-delegate); the slash command keeps its name and is invoked as /claudelegate:opencode.
* **config:** drop OPENCODE_DELEGATE_READ_MODEL in favour of OPENCODE_DELEGATE_DEFAULT_MODEL

### Features

* **hooks:** route all Claude Code built-in subagents to opencode-worker ([9cb6ed0](https://github.com/lehcode/claudelegate/commit/9cb6ed0deb2bbf41153cb626d7e925c34b172384))
* **hooks:** route general-purpose subagents to opencode-worker ([28df386](https://github.com/lehcode/claudelegate/commit/28df38680f83683f97608a3910709cad6223fc08))
* **mcp:** delegate through background opencode-worker agents by default ([6d27891](https://github.com/lehcode/claudelegate/commit/6d278919b44c15f59a3e9e11d525a91a149486e5))
* **mcp:** read server version from package.json at runtime ([5cf2713](https://github.com/lehcode/claudelegate/commit/5cf271323d6b84f895a9f424cb7bc9eb15e41fb0))
* **mcp:** restore opencode MCP server ([3766a13](https://github.com/lehcode/claudelegate/commit/3766a13dc37b191685cf3d1c75d517338f2a1919))
* **mcp:** send server instructions that make delegation the default for implementation ([9abf7e5](https://github.com/lehcode/claudelegate/commit/9abf7e58c373bf85c90f3e963e8ee2e56d4af9ee))


### Bug Fixes

* **agent:** drop the worker's edit tools so OpenCode always writes the solution ([488c27a](https://github.com/lehcode/claudelegate/commit/488c27a5138d98d7060b862de1be47e1b9153dc2))
* **agent:** make opencode-worker the only caller of MCP delegate ([8e099e2](https://github.com/lehcode/claudelegate/commit/8e099e263fce736728bc2f6631497a2aa2a55999))
* **agent:** run opencode directly from a thin opencode-worker ([4e4d3e4](https://github.com/lehcode/claudelegate/commit/4e4d3e4bf2a95d25f40afe8b738b52287b7d77d9))
* **ci:** fail the dist check on missing or untracked bundle files ([b2bfc16](https://github.com/lehcode/claudelegate/commit/b2bfc167309e8ea62045f3a8a702de5a96c1ed66))
* **ci:** remove build step — no longer bundles to dist/ ([8f83f45](https://github.com/lehcode/claudelegate/commit/8f83f45bfca39a47c2fd26cfa1357f9a9ce07ecd))
* **config:** use opencode's configured default model when none is given ([374b4a9](https://github.com/lehcode/claudelegate/commit/374b4a935e7954a2cd6d0aa9914598a5342706df))
* **plugin:** declare the MCP server in plugin.json instead of a root .mcp.json ([dbe0d44](https://github.com/lehcode/claudelegate/commit/dbe0d44d72e450e143200a99e9de2881bd3bd9f1))
* point plugin homepage/repository to lehcode (not aashahin) ([a3e4a9a](https://github.com/lehcode/claudelegate/commit/a3e4a9ad5d1e60acd0005ae652bc4b31d032363f))


### Code Refactoring

* **config:** drop OPENCODE_DELEGATE_READ_MODEL in favour of OPENCODE_DELEGATE_DEFAULT_MODEL ([ef6df4d](https://github.com/lehcode/claudelegate/commit/ef6df4d37ebe1cc4ec4ceedb1eb0fcbeed0ede2d))
* rename /claudelegate back to /opencode ([98a9aaa](https://github.com/lehcode/claudelegate/commit/98a9aaa3558d8fca1426c51f5d5087fdda299667))
* rename /opencode to /claudelegate and the skill to delegate ([beb7fc3](https://github.com/lehcode/claudelegate/commit/beb7fc3ffe3bf458f2cb679f0eb061e621cc7235))
* rename package and plugin to claudelegate ([cc2dfca](https://github.com/lehcode/claudelegate/commit/cc2dfca20444e593e5fd861b5ed6b65893cdede3))
* rename the opencode-delegate skill to claudelegate ([7af04c6](https://github.com/lehcode/claudelegate/commit/7af04c6e9f4a3a609f3f3aa93a434ee4260eb50f))
* strip MCP server, use agent activation instead ([ec26f15](https://github.com/lehcode/claudelegate/commit/ec26f151c9050cc22d4e1505c841ef57a75cb518))


### Documentation

* add CLAUDE.md with runtime model and opencode invocation gotchas ([14e3283](https://github.com/lehcode/claudelegate/commit/14e3283869a54675dc58267597d25d08df347636))
* **agent:** stop retrying timed-out runs; name delegate as the model resolver ([62f23a7](https://github.com/lehcode/claudelegate/commit/62f23a70635fecc0605f10fc12fedfb13c9c0c6c))
* document npm install and release flow ([b35ccdc](https://github.com/lehcode/claudelegate/commit/b35ccdc8c48a40a0c3a26b579ea2567b007799af))
* document restored MCP server tools ([093cabb](https://github.com/lehcode/claudelegate/commit/093cabb6f8345643fa6d35f8b7bd4fe0eab874bf))
* left-align the README configuration table ([33fb073](https://github.com/lehcode/claudelegate/commit/33fb0733ca2aabadd41fdc53b7998bd8cf3cad4b))
* point README and CLAUDE.md at the claudelegate skill ([9936bc9](https://github.com/lehcode/claudelegate/commit/9936bc9009fc00017c91b2210a477b78f8ca2ab7))
* **readme:** document thin opencode-worker and drop MCP-era claims ([4aff218](https://github.com/lehcode/claudelegate/commit/4aff218c788fffbce60b06fb4a7e71914f680b18))
* rename project references to claudelegate ([df56f64](https://github.com/lehcode/claudelegate/commit/df56f649d58a628557ab7d56fa3c1c0e280e4ddb))
* rephrase README to clear Vale warnings ([98999c4](https://github.com/lehcode/claudelegate/commit/98999c412cea5ec64cc7217644a8cacdc735b634))
* rewrite README ([d8d118b](https://github.com/lehcode/claudelegate/commit/d8d118b11342c38f1caf8951c194f59f086990aa))
