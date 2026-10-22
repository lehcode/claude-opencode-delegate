import { describe, expect, test } from "bun:test";

const SCRIPT = new URL("../scripts/route-to-opencode.sh", import.meta.url).pathname;
const WORKER = "opencode-delegate:opencode-worker";

type ToolInput = Record<string, unknown>;

// Run the hook with a controlled env. OPENCODE_BIN defaults to an executable that always exists.
const run = (stdin: string, env: Record<string, string> = {}) => {
  const base: Record<string, string | undefined> = { ...process.env };
  delete base.OPENCODE_DELEGATE_ROUTE;
  base.OPENCODE_BIN = process.execPath;
  const r = Bun.spawnSync(["bash", SCRIPT], {
    stdin: new TextEncoder().encode(stdin),
    env: { ...base, ...env },
  });
  return { code: r.exitCode, out: r.stdout.toString(), err: r.stderr.toString() };
};

const call = (toolInput: ToolInput, toolName = "Agent") =>
  JSON.stringify({ hook_event_name: "PreToolUse", tool_name: toolName, tool_input: toolInput });

const base: ToolInput = { description: "do thing", prompt: "please do the thing" };

const expectRewritten = (r: ReturnType<typeof run>, original: ToolInput) => {
  expect(r.code).toBe(0);
  const o = JSON.parse(r.out).hookSpecificOutput;
  expect(o.hookEventName).toBe("PreToolUse");
  expect(o.permissionDecision).toBe("allow");
  expect(typeof o.permissionDecisionReason).toBe("string");
  expect(o.updatedInput.subagent_type).toBe(WORKER);
  expect(o.updatedInput.model).toBe("haiku");
  expect(o.updatedInput.prompt).toBe(original.prompt);
  expect(o.updatedInput.description).toBe(original.description);
  return o.updatedInput as ToolInput;
};

const expectPassThrough = (r: ReturnType<typeof run>) => {
  expect(r.code).toBe(0);
  expect(r.out).toBe("");
};

describe("route-to-opencode hook: rewrites", () => {
  test("general-purpose is rewritten", () => {
    expectRewritten(
      run(call({ ...base, subagent_type: "general-purpose", model: "sonnet" })),
      base,
    );
  });
  test("missing subagent_type is rewritten", () => {
    expectRewritten(run(call(base)), base);
  });
  test("empty subagent_type counts as general-purpose", () => {
    expectRewritten(run(call({ ...base, subagent_type: "" })), base);
  });
  test("extra tool_input keys are preserved", () => {
    const updated = expectRewritten(run(call({ ...base, run_in_background: true })), base);
    expect(updated.run_in_background).toBe(true);
  });
  test("Task alias is rewritten", () => {
    expectRewritten(run(call(base, "Task")), base);
  });
  test("prompt with special characters survives intact", () => {
    const tricky = { description: 'q"uote', prompt: 'line1\nline2 "x" $HOME `id` \\ ü' };
    expectRewritten(run(call(tricky)), tricky);
  });
  test("OPENCODE_DELEGATE_ROUTE=on keeps routing", () => {
    expectRewritten(run(call(base), { OPENCODE_DELEGATE_ROUTE: "on" }), base);
  });
  test("empty OPENCODE_DELEGATE_ROUTE keeps routing", () => {
    expectRewritten(run(call(base), { OPENCODE_DELEGATE_ROUTE: "" }), base);
  });
});

describe("route-to-opencode hook: pass-through", () => {
  test("Explore is untouched", () => {
    expectPassThrough(run(call({ ...base, subagent_type: "Explore" })));
  });
  test("opencode-worker is untouched (no loop)", () => {
    expectPassThrough(run(call({ ...base, subagent_type: WORKER })));
  });
  test("non-Agent tool is untouched", () => {
    expectPassThrough(run(call(base, "Bash")));
  });
  test.each(["off", "0", "false", "no", "OFF", "False"])(
    "OPENCODE_DELEGATE_ROUTE=%s disables routing",
    (v) => {
      expectPassThrough(run(call(base), { OPENCODE_DELEGATE_ROUTE: v }));
    },
  );
  test("unresolvable OPENCODE_BIN path is untouched", () => {
    expectPassThrough(run(call(base), { OPENCODE_BIN: "/nonexistent/opencode" }));
  });
  test("unresolvable OPENCODE_BIN command name is untouched", () => {
    expectPassThrough(run(call(base), { OPENCODE_BIN: "definitely-not-a-command-xyz" }));
  });
  test("[no-opencode] marker is untouched", () => {
    expectPassThrough(run(call({ ...base, prompt: "fix it [no-opencode] please" })));
  });
  test("invalid JSON is untouched", () => {
    const r = run("not json {");
    expectPassThrough(r);
    expect(r.err.length).toBeGreaterThan(0);
  });
  test("missing tool_input is untouched", () => {
    expectPassThrough(run(JSON.stringify({ tool_name: "Agent" })));
  });
});
