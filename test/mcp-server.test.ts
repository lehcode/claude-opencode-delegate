import { describe, expect, test } from "bun:test";
import { copyFileSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const root = join(import.meta.dir, "..");
const EXPECTED = [
  "delegate",
  "delegate_async",
  "list_models",
  "list_sessions",
  "task_cancel",
  "task_list",
  "task_result",
];

interface Tool {
  name: string;
  inputSchema: { required?: string[] };
}

async function listTools(entry: string): Promise<Tool[]> {
  const proc = Bun.spawn(["bun", join(root, entry)], {
    stdin: "pipe",
    stdout: "pipe",
    stderr: "pipe",
    env: { ...process.env, OPENCODE_BIN: "/bin/true" },
  });
  const send = (msg: object) => proc.stdin.write(JSON.stringify(msg) + "\n");
  send({
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: { name: "test", version: "0" },
    },
  });
  send({ jsonrpc: "2.0", method: "notifications/initialized" });
  send({ jsonrpc: "2.0", id: 2, method: "tools/list", params: {} });
  proc.stdin.flush();

  const reader = proc.stdout.getReader();
  const dec = new TextDecoder();
  let buf = "";
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) throw new Error(`server exited early: ${await new Response(proc.stderr).text()}`);
      buf += dec.decode(value);
      for (const line of buf.split("\n")) {
        if (!line.trim()) continue;
        const msg = JSON.parse(line);
        if (msg.id === 2) return msg.result.tools as Tool[];
      }
    }
  } finally {
    proc.kill();
  }
}

describe.each(["src/index.ts", "dist/index.js"])("MCP server (%s)", (entry) => {
  test("tools/list exposes the 7 tools and delegate requires prompt", async () => {
    const tools = await listTools(entry);
    expect(tools.map((t) => t.name).sort()).toEqual(EXPECTED);
    const d = tools.find((t) => t.name === "delegate");
    expect(d?.inputSchema.required).toContain("prompt");
  }, 15000);
});

describe("MCP server version", () => {
  test("serverInfo.version is read from package.json at runtime", async () => {
    const tmp = mkdtempSync(join(tmpdir(), "ocd-version-"));
    try {
      mkdirSync(join(tmp, "dist"));
      copyFileSync(join(root, "dist/index.js"), join(tmp, "dist/index.js"));
      writeFileSync(join(tmp, "package.json"), JSON.stringify({ name: "x", version: "9.9.9" }));
      const proc = Bun.spawn(["bun", join(tmp, "dist/index.js")], {
        stdin: "pipe",
        stdout: "pipe",
        stderr: "pipe",
        env: { ...process.env, OPENCODE_BIN: "/bin/true" },
      });
      proc.stdin.write(
        JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "initialize",
          params: {
            protocolVersion: "2024-11-05",
            capabilities: {},
            clientInfo: { name: "test", version: "0" },
          },
        }) + "\n",
      );
      proc.stdin.flush();
      const reader = proc.stdout.getReader();
      const dec = new TextDecoder();
      let buf = "";
      try {
        for (;;) {
          const { value, done } = await reader.read();
          if (done)
            throw new Error(`server exited early: ${await new Response(proc.stderr).text()}`);
          buf += dec.decode(value);
          const line = buf.split("\n").find((l) => l.includes('"id":1'));
          if (line) {
            expect(JSON.parse(line).result.serverInfo.version).toBe("9.9.9");
            return;
          }
        }
      } finally {
        proc.kill();
      }
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  }, 15000);
});
