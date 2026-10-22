import { describe, expect, test } from "bun:test";
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
