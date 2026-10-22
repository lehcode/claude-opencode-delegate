import { describe, expect, test } from "bun:test";

const SCRIPT = new URL("../scripts/guard-main-thread-mcp.sh", import.meta.url).pathname;

const run = (stdin: string, env: Record<string, string> = {}) => {
  const base: Record<string, string | undefined> = { ...process.env };
  delete base.OPENCODE_DELEGATE_ROUTE;
  const r = Bun.spawnSync(["bash", SCRIPT], {
    stdin: new TextEncoder().encode(stdin),
    env: { ...base, ...env },
  });
  return { code: r.exitCode, out: r.stdout.toString(), err: r.stderr.toString() };
};

const call = (toolName: string, extra: Record<string, unknown> = {}) =>
  JSON.stringify({
    hook_event_name: "PreToolUse",
    tool_name: toolName,
    tool_input: { prompt: "x" },
    ...extra,
  });

const PLUGIN = "mcp__plugin_claudelegate_opencode__";
const MANUAL = "mcp__opencode__";

const expectDeny = (r: ReturnType<typeof run>) => {
  expect(r.code).toBe(0);
  const o = JSON.parse(r.out).hookSpecificOutput;
  expect(o.hookEventName).toBe("PreToolUse");
  expect(o.permissionDecision).toBe("deny");
  expect(o.permissionDecisionReason).toContain("claudelegate:opencode-worker");
};

const expectPassThrough = (r: ReturnType<typeof run>) => {
  expect(r.code).toBe(0);
  expect(r.out).toBe("");
};

describe("guard-main-thread-mcp hook: denies on the main thread", () => {
  test.each([
    `${PLUGIN}delegate`,
    `${PLUGIN}delegate_async`,
    `${MANUAL}delegate`,
    `${MANUAL}delegate_async`,
  ])("%s is denied", (tool) => {
    expectDeny(run(call(tool)));
  });
  test("empty agent_id counts as the main thread", () => {
    expectDeny(run(call(`${PLUGIN}delegate`, { agent_id: "" })));
  });
  test("OPENCODE_DELEGATE_ROUTE=on keeps guarding", () => {
    expectDeny(run(call(`${PLUGIN}delegate`), { OPENCODE_DELEGATE_ROUTE: "on" }));
  });
});

describe("guard-main-thread-mcp hook: passes through", () => {
  test.each([`${PLUGIN}delegate`, `${MANUAL}delegate_async`])(
    "%s with agent_id is allowed",
    (tool) => {
      expectPassThrough(run(call(tool, { agent_id: "a1", agent_type: "opencode-worker" })));
    },
  );
  test.each([`${PLUGIN}list_models`, `${PLUGIN}task_result`, "mcp__other__delegate", "Bash"])(
    "other tool %s is allowed",
    (tool) => {
      expectPassThrough(run(call(tool)));
    },
  );
  test.each(["0", "false", "no", "off", "OFF", "False"])(
    "OPENCODE_DELEGATE_ROUTE=%s disables the guard",
    (v) => {
      expectPassThrough(run(call(`${PLUGIN}delegate`), { OPENCODE_DELEGATE_ROUTE: v }));
    },
  );
  test("garbage input is allowed", () => {
    expectPassThrough(run("not json {"));
  });
  test("non-object JSON is allowed", () => {
    expectPassThrough(run("[1,2]"));
  });
  test("empty input is allowed", () => {
    expectPassThrough(run(""));
  });
});

describe("guard-main-thread-mcp hook: matcher is wired in hooks.json", () => {
  test("matcher entry exists in hooks.json", async () => {
    const url = new URL("../plugin-hooks/hooks.json", import.meta.url);
    const data = JSON.parse(await Bun.file(url).text()) as {
      hooks: { PreToolUse: Array<{ matcher: string; hooks: Array<{ command?: string }> }> };
    };
    const entry = data.hooks.PreToolUse.find((e) =>
      e.hooks.some((h) => h.command?.includes("scripts/guard-main-thread-mcp.sh")),
    )!;
    expect(entry.matcher).toBeDefined();
  });

  test.each([
    `${PLUGIN}delegate`,
    `${PLUGIN}delegate_async`,
    `${MANUAL}delegate`,
    `${MANUAL}delegate_async`,
  ])("matcher regex matches %s", async (name) => {
    const url = new URL("../plugin-hooks/hooks.json", import.meta.url);
    const data = JSON.parse(await Bun.file(url).text()) as {
      hooks: { PreToolUse: Array<{ matcher: string; hooks: Array<{ command?: string }> }> };
    };
    const entry = data.hooks.PreToolUse.find((e) =>
      e.hooks.some((h) => h.command?.includes("scripts/guard-main-thread-mcp.sh")),
    )!;
    const re = new RegExp(`^(?:${entry.matcher})$`);
    expect(re.test(name)).toBe(true);
  });

  test("matcher regex rejects non-delegate tools", async () => {
    const url = new URL("../plugin-hooks/hooks.json", import.meta.url);
    const data = JSON.parse(await Bun.file(url).text()) as {
      hooks: { PreToolUse: Array<{ matcher: string; hooks: Array<{ command?: string }> }> };
    };
    const entry = data.hooks.PreToolUse.find((e) =>
      e.hooks.some((h) => h.command?.includes("scripts/guard-main-thread-mcp.sh")),
    )!;
    const re = new RegExp(`^(?:${entry.matcher})$`);
    const nonMatches = [`${PLUGIN}list_models`, "Agent"];
    for (const name of nonMatches) {
      expect(re.test(name)).toBe(false);
    }
  });
});
