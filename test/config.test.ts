import { describe, expect, test } from "bun:test";
import { join } from "node:path";

const root = join(import.meta.dir, "..");

// config is evaluated at import time, so each case loads it in a fresh process.
function loadModels(env: Record<string, string>): { d: string | null; r: string | null } {
  const base = { ...process.env };
  delete base.OPENCODE_DELEGATE_DEFAULT_MODEL;
  delete base.OPENCODE_DELEGATE_READ_MODEL;
  const proc = Bun.spawnSync(
    [
      "bun",
      "-e",
      `const { config } = await import(${JSON.stringify(join(root, "src/config.ts"))});
       console.log(JSON.stringify({ d: config.defaultModel ?? null, r: config.readModel ?? null }));`,
    ],
    { env: { ...base, ...env } },
  );
  return JSON.parse(proc.stdout.toString());
}

describe("default models", () => {
  test("unset env leaves both undefined so opencode's configured default is used", () => {
    expect(loadModels({})).toEqual({ d: null, r: null });
  });

  test("env vars still override", () => {
    expect(
      loadModels({
        OPENCODE_DELEGATE_DEFAULT_MODEL: "xai/grok-4.7",
        OPENCODE_DELEGATE_READ_MODEL: "opencode/beam-free",
      }),
    ).toEqual({ d: "xai/grok-4.7", r: "opencode/beam-free" });
  });

  test("empty env means opencode's default", () => {
    expect(
      loadModels({ OPENCODE_DELEGATE_DEFAULT_MODEL: "", OPENCODE_DELEGATE_READ_MODEL: " " }),
    ).toEqual({ d: null, r: null });
  });
});
