import { describe, expect, test } from "bun:test";
import { join } from "node:path";

const root = join(import.meta.dir, "..");

// config is evaluated at import time, so each case loads it in a fresh process.
function loadModels(env: Record<string, string>): { d: string | null; hasRead: boolean } {
  const base = { ...process.env };
  delete base.OPENCODE_DELEGATE_DEFAULT_MODEL;
  delete base.OPENCODE_DELEGATE_READ_MODEL;
  const proc = Bun.spawnSync(
    [
      "bun",
      "-e",
      `const { config } = await import(${JSON.stringify(join(root, "src/config.ts"))});
       console.log(JSON.stringify({ d: config.defaultModel ?? null, hasRead: "readModel" in config }));`,
    ],
    { env: { ...base, ...env } },
  );
  return JSON.parse(proc.stdout.toString());
}

describe("default model", () => {
  test("unset env leaves it undefined so opencode's configured default is used", () => {
    expect(loadModels({})).toEqual({ d: null, hasRead: false });
  });

  test("OPENCODE_DELEGATE_DEFAULT_MODEL overrides", () => {
    expect(loadModels({ OPENCODE_DELEGATE_DEFAULT_MODEL: "xai/grok-4.7" })).toEqual({
      d: "xai/grok-4.7",
      hasRead: false,
    });
  });

  test("empty env means opencode's default", () => {
    expect(loadModels({ OPENCODE_DELEGATE_DEFAULT_MODEL: " " })).toEqual({
      d: null,
      hasRead: false,
    });
  });

  test("OPENCODE_DELEGATE_READ_MODEL no longer exists", () => {
    expect(loadModels({ OPENCODE_DELEGATE_READ_MODEL: "opencode/beam-free" })).toEqual({
      d: null,
      hasRead: false,
    });
  });
});
