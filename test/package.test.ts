import { describe, expect, test } from "bun:test";
import { accessSync, constants, readFileSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dir, "..");
const readJson = (p: string) => JSON.parse(readFileSync(join(root, p), "utf8"));

describe("npm package", () => {
  test("npm pack ships the plugin surfaces and no dev files", () => {
    const r = Bun.spawnSync(["npm", "pack", "--dry-run", "--json", "--ignore-scripts"], {
      cwd: root,
    });
    expect(r.exitCode).toBe(0);
    // npm >= 11 keys the report by package name, older versions return an array.
    const out = JSON.parse(r.stdout.toString());
    const report = Array.isArray(out) ? out[0] : Object.values(out)[0];
    const files: string[] = (report as { files: { path: string }[] }).files.map((f) => f.path);
    for (const f of [
      "dist/index.js",
      ".claude-plugin/plugin.json",
      ".claude-plugin/marketplace.json",
      "agents/opencode-worker.md",
      "commands/opencode.md",
      "skills/opencode-delegate/SKILL.md",
      "scripts/route-to-opencode.sh",
      "plugin-hooks/hooks.json",
      "README.md",
      "LICENSE",
    ]) {
      expect(files).toContain(f);
    }
    for (const f of files) {
      expect(f).not.toMatch(/^(test|odd|openspec)\//);
      expect(f).not.toMatch(/\.bak\./);
    }
  }, 30000);

  test("bin points at an executable bun-shebang bundle", () => {
    const pkg = readJson("package.json");
    expect(pkg.name).toBe("@lehcode/claude-opencode-delegate");
    expect(pkg.bin["claude-opencode-delegate"]).toBe("dist/index.js");
    const p = join(root, pkg.bin["claude-opencode-delegate"]);
    accessSync(p, constants.X_OK);
    expect(readFileSync(p, "utf8").startsWith("#!/usr/bin/env bun\n")).toBe(true);
  });

  // A root .mcp.json doubles as this repo's project MCP config, where ${CLAUDE_PLUGIN_ROOT} is unset
  // (`claude doctor`: "Missing environment variables: CLAUDE_PLUGIN_ROOT"). Declare it in plugin.json.
  test("the MCP server is declared inline in plugin.json, not in a root .mcp.json", () => {
    expect(() => accessSync(join(root, ".mcp.json"))).toThrow();
    expect(readJson(".claude-plugin/plugin.json").mcpServers).toEqual({
      opencode: { command: "bun", args: ["${CLAUDE_PLUGIN_ROOT}/dist/index.js"] },
    });
  });

  test("versions are in sync across manifests", () => {
    const v = readJson("package.json").version;
    expect(readJson(".claude-plugin/plugin.json").version).toBe(v);
    expect(readJson(".claude-plugin/marketplace.json").plugins[0].version).toBe(v);
    expect(readJson(".release-please-manifest.json")["."]).toBe(v);
  });
});
