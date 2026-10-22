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

const routed = (type: string, prompt: string, extra: ToolInput = {}) => {
  const input = { ...base, prompt, subagent_type: type, ...extra };
  const r = run(call(input));
  expect(r.code).toBe(0);
  const o = JSON.parse(r.out).hookSpecificOutput;
  expect(o.updatedInput.subagent_type).toBe(WORKER);
  expect(o.updatedInput.model).toBe("haiku");
  expect(o.updatedInput.description).toBe(base.description);
  return o as { updatedInput: ToolInput; permissionDecisionReason: string };
};

describe("route-to-opencode hook: built-in subagent types", () => {
  test.each(["Explore", "Plan", "claude-code-guide"])("%s gets a read-only prefix", (t) => {
    const o = routed(t, "find x", { run_in_background: true });
    expect(o.updatedInput.prompt).toBe(
      `Read-only task (routed from the \`${t}\` subagent).\n\nfind x`,
    );
    expect(o.updatedInput.run_in_background).toBe(true);
    expect(o.permissionDecisionReason).toBe(`routed ${t} to opencode-worker`);
  });
  test("statusline-setup gets a routed-from note", () => {
    const o = routed("statusline-setup", "do it");
    expect(o.updatedInput.prompt).toBe("Routed from the `statusline-setup` subagent.\n\ndo it");
    expect(o.permissionDecisionReason).toBe("routed statusline-setup to opencode-worker");
  });
  test("claude prompt is unchanged", () => {
    const o = routed("claude", "plain");
    expect(o.updatedInput.prompt).toBe("plain");
    expect(o.permissionDecisionReason).toBe("routed claude to opencode-worker");
  });
  test("general-purpose prompt is unchanged and reason names it", () => {
    const o = routed("general-purpose", "plain");
    expect(o.updatedInput.prompt).toBe("plain");
    expect(o.permissionDecisionReason).toBe("routed general-purpose to opencode-worker");
  });
  test("missing type reason says general-purpose", () => {
    const r = run(call(base));
    expect(JSON.parse(r.out).hookSpecificOutput.permissionDecisionReason).toBe(
      "routed general-purpose to opencode-worker",
    );
  });
  test("tricky prompt stays verbatim inside the prefix", () => {
    const tricky = "a \"q\" 's'\nline2 $(id) `id` $HOME \\ ü";
    const o = routed("Explore", tricky);
    expect(o.updatedInput.prompt).toBe(
      `Read-only task (routed from the \`Explore\` subagent).\n\n${tricky}`,
    );
    const o2 = routed("statusline-setup", tricky);
    expect(o2.updatedInput.prompt).toBe(
      `Routed from the \`statusline-setup\` subagent.\n\n${tricky}`,
    );
  });
  test("[no-opencode] still opts out for named types", () => {
    expectPassThrough(run(call({ ...base, prompt: "x [no-opencode]", subagent_type: "Plan" })));
  });
});

describe("route-to-opencode hook: custom, plugin, reviewer and SDD agents stay on Claude", () => {
  test.each([
    "review-risk",
    "review-refuter",
    "sdd-apply",
    "jd-judge-a",
    "pr-review-toolkit:code-reviewer",
    "gentle-ai:sdd-verify",
    "technical-copywriter",
    "tech-docs-writer",
    "universal-stack-expert",
    "superpowers:some-agent",
    WORKER,
  ])("%s is untouched", (t) => {
    expectPassThrough(run(call({ ...base, subagent_type: t })));
  });
});

describe("route-to-opencode hook: pass-through", () => {
  test("opencode-worker is untouched (no loop)", () => {
    expectPassThrough(run(call({ ...base, subagent_type: WORKER })));
  });
  test("bare opencode-worker is untouched (no loop)", () => {
    expectPassThrough(run(call({ ...base, subagent_type: "opencode-worker" })));
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
