# Changelog

## [0.2.1](https://github.com/lehcode/claudelegate/compare/v0.2.0...v0.2.1) (2026-10-23)


### Documentation

* **changelog:** point 0.2.0 commit links at the rewritten history ([e5e1923](https://github.com/lehcode/claudelegate/commit/e5e1923937c311c0fab5a33a538c6d411a7db6d5))

## [0.2.0](https://github.com/lehcode/claudelegate/compare/v0.1.0...v0.2.0) (2026-10-22)


### ⚠ BREAKING CHANGES

* the plugin installs as claudelegate@claudelegate (was opencode-delegate@claude-opencode-delegate); MCP tools are mcp__plugin_claudelegate_opencode__* (was mcp__plugin_opencode-delegate_opencode__*); the worker is claudelegate:opencode-worker; the npm package and bin are @lehcode/claudelegate and claudelegate. Update permission allowlists.
* the skill is now delegate, invoked as claudelegate:delegate (was opencode-delegate); the slash command keeps its name and is invoked as /claudelegate:opencode.
* **config:** drop OPENCODE_DELEGATE_READ_MODEL in favour of OPENCODE_DELEGATE_DEFAULT_MODEL

### Features

* **hooks:** route all Claude Code built-in subagents to opencode-worker ([71de745](https://github.com/lehcode/claudelegate/commit/71de74558402d049810890a9c133ec5ecff99347))
* **hooks:** route general-purpose subagents to opencode-worker ([cff6cae](https://github.com/lehcode/claudelegate/commit/cff6cae4038e833334656976db9ed1d08b63e06f))
* **mcp:** delegate through background opencode-worker agents by default ([6d92f78](https://github.com/lehcode/claudelegate/commit/6d92f782b6ab18b84f4bc0c82b64395074ad2b84))
* **mcp:** read server version from package.json at runtime ([a7d80cd](https://github.com/lehcode/claudelegate/commit/a7d80cdb248b8d35c84f41715eaf659759066719))
* **mcp:** restore opencode MCP server ([38599c2](https://github.com/lehcode/claudelegate/commit/38599c2f256126d809db84ef66566ae626bc900a))
* **mcp:** send server instructions that make delegation the default for implementation ([fb45ea5](https://github.com/lehcode/claudelegate/commit/fb45ea5ecdd73d21c66d35b99a8f6e985c276f17))


### Bug Fixes

* **agent:** drop the worker's edit tools so OpenCode always writes the solution ([91fbf42](https://github.com/lehcode/claudelegate/commit/91fbf42aab8b2228988c05bc75918a32d343f005))
* **agent:** make opencode-worker the only caller of MCP delegate ([cead138](https://github.com/lehcode/claudelegate/commit/cead138b173e2bcd74e8baba1cca60d37966f67c))
* **agent:** run opencode directly from a thin opencode-worker ([ab592eb](https://github.com/lehcode/claudelegate/commit/ab592ebe8b1d6ca83a2e575fdd4b3b1ffe433ea1))
* **ci:** fail the dist check on missing or untracked bundle files ([350efce](https://github.com/lehcode/claudelegate/commit/350efcebd5af63a72ed3fb1295a42565e5bb27c8))
* **ci:** remove build step — no longer bundles to dist/ ([30dc8db](https://github.com/lehcode/claudelegate/commit/30dc8db4be684b998e2c9f160721256f792b85b0))
* **config:** use opencode's configured default model when none is given ([d684493](https://github.com/lehcode/claudelegate/commit/d684493069c4a0918ce873cd6aa3b39503dab2cc))
* **plugin:** declare the MCP server in plugin.json instead of a root .mcp.json ([2fa146c](https://github.com/lehcode/claudelegate/commit/2fa146c8a6798f635dd974bd0801ea94e6bab8bf))
* point plugin homepage/repository to lehcode (not aashahin) ([b7a9837](https://github.com/lehcode/claudelegate/commit/b7a98374b154f216125c3906bf1c03e161a1e2fc))


### Code Refactoring

* **config:** drop OPENCODE_DELEGATE_READ_MODEL in favour of OPENCODE_DELEGATE_DEFAULT_MODEL ([9252ec8](https://github.com/lehcode/claudelegate/commit/9252ec8c6dccd21412a3f5b2f263bb3cb84b4152))
* rename /claudelegate back to /opencode ([283bba2](https://github.com/lehcode/claudelegate/commit/283bba29eb015bee3157e297fbe16edd10f24f06))
* rename /opencode to /claudelegate and the skill to delegate ([5bbf9df](https://github.com/lehcode/claudelegate/commit/5bbf9df1abe61fc3fc723f736bb03cef463ae2d2))
* rename package and plugin to claudelegate ([6d3b1e0](https://github.com/lehcode/claudelegate/commit/6d3b1e011c1c98e0f3a5d95d3d0dde4a128dba5e))
* rename the opencode-delegate skill to claudelegate ([a30ace1](https://github.com/lehcode/claudelegate/commit/a30ace182d1f8ed1c5f7baaeba2fc188290f1c36))
* strip MCP server, use agent activation instead ([f3cc6fe](https://github.com/lehcode/claudelegate/commit/f3cc6fe22354cdc7fd91d3c56db24ae46326ef55))


### Documentation

* add CLAUDE.md with runtime model and opencode invocation gotchas ([b36da73](https://github.com/lehcode/claudelegate/commit/b36da7346470de952c6350fd120d23c3e846830b))
* **agent:** stop retrying timed-out runs; name delegate as the model resolver ([ffefb96](https://github.com/lehcode/claudelegate/commit/ffefb96e48da2efe5e87a81eea157836f35d1183))
* document npm install and release flow ([16ca9ba](https://github.com/lehcode/claudelegate/commit/16ca9ba42cbe2cd1c08c5acc9b59c7c07df94a31))
* document restored MCP server tools ([816e080](https://github.com/lehcode/claudelegate/commit/816e080b09e500dd4f885ccebfadab798ecd397d))
* left-align the README configuration table ([4ce16bf](https://github.com/lehcode/claudelegate/commit/4ce16bf52bcb39f9482bd8841e658491547d234c))
* point README and CLAUDE.md at the claudelegate skill ([4fd7d61](https://github.com/lehcode/claudelegate/commit/4fd7d61bf489b19da4ac4eb2c0644d5ada3c2f77))
* **readme:** document thin opencode-worker and drop MCP-era claims ([81bd604](https://github.com/lehcode/claudelegate/commit/81bd604825559fcdd8bb7179adddac62aa4d3e20))
* rename project references to claudelegate ([f11aeda](https://github.com/lehcode/claudelegate/commit/f11aeda28d7a224b1173960609bc46efa2847401))
* rephrase README to clear Vale warnings ([04139db](https://github.com/lehcode/claudelegate/commit/04139db166e535fd12aec04aa39ea3cd2533838e))
* rewrite README ([e0bcd5a](https://github.com/lehcode/claudelegate/commit/e0bcd5a89feaa40d141eb25d94dfdd1c1cd5ed7d))
