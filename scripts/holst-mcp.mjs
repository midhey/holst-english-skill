#!/usr/bin/env node
// Мини-клиент MCP Holst поверх HTTP (streamable-http, JSON-RPC).
// Нужен, когда MCP-сервер holst не подключён в сессии агента (Codex без настройки,
// Claude Code после ECONNREFUSED), а десктопное приложение Holst уже запущено.
//
//   node holst-mcp.mjs tools                                  список инструментов
//   node holst-mcp.mjs call <tool> '<json>' | @args.json      вызвать любой инструмент
//   node holst-mcp.mjs guide <topic> [out.txt]                get_guide в файл/stdout
//   node holst-mcp.mjs use <boardId> <code.js> [--lib] [--desc "..."] [--shots prefix]
//        выполнить use_holst; --lib приклеивает scripts/lib.js перед кодом;
//        скриншоты (await node.screenshot()) сохраняются как <prefix>-N.png
//   node holst-mcp.mjs upload <boardId> file1.png [file2 ...]  загрузить картинки, вывести assetId
//
// Адрес: HOLST_MCP_URL (по умолчанию http://127.0.0.1:47641/mcp).
// Нужен Node 18+ (глобальный fetch).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const URL_ = process.env.HOLST_MCP_URL || "http://127.0.0.1:47641/mcp";
const HERE = path.dirname(fileURLToPath(import.meta.url));
let sid = null;
let rpcId = 1;

async function rpc(method, params, notify = false) {
  const headers = {
    "content-type": "application/json",
    accept: "application/json, text/event-stream",
    "mcp-protocol-version": "2025-06-18",
  };
  if (sid) headers["mcp-session-id"] = sid;
  const body = notify ? { jsonrpc: "2.0", method, params } : { jsonrpc: "2.0", id: rpcId++, method, params };
  const r = await fetch(URL_, { method: "POST", headers, body: JSON.stringify(body) });
  const s = r.headers.get("mcp-session-id");
  if (s) sid = s;
  const text = await r.text();
  if (notify) return null;
  if (!r.ok) throw new Error(`HTTP ${r.status}: ${text.slice(0, 500)}`);
  if (text.trim().startsWith("{")) return JSON.parse(text);
  // SSE: ищем data: с нашим id
  for (const line of text.split("\n")) {
    if (!line.startsWith("data:")) continue;
    try {
      const msg = JSON.parse(line.slice(5));
      if (msg.id === body.id) return msg;
    } catch {}
  }
  throw new Error("Нет ответа в потоке: " + text.slice(0, 500));
}

async function connect() {
  try {
    await rpc("initialize", {
      protocolVersion: "2025-06-18",
      capabilities: {},
      clientInfo: { name: "holst-english-lesson", version: "1" },
    });
  } catch (e) {
    throw new Error(
      `Holst MCP недоступен по ${URL_} (${e.cause?.code || e.message}). ` +
        "Запустите десктопное приложение Holst и войдите в аккаунт."
    );
  }
  await rpc("notifications/initialized", {}, true);
}

let shotN = 0;
function render(res, shots) {
  if (res.error) return "ERROR " + JSON.stringify(res.error);
  const r = res.result;
  if (!r?.content) return JSON.stringify(r);
  const out = r.content.map((c) => {
    if (c.type === "text") return c.text;
    if (c.type === "image") {
      const f = `${shots || "shot"}-${++shotN}.png`;
      fs.writeFileSync(f, Buffer.from(c.data, "base64"));
      return `[скриншот: ${path.resolve(f)}]`;
    }
    return JSON.stringify(c);
  });
  return (r.isError ? "ERROR " : "") + out.join("\n");
}

const callTool = async (name, args, shots) => render(await rpc("tools/call", { name, arguments: args }), shots);
const readArg = (a) => (a?.startsWith("@") ? fs.readFileSync(a.slice(1), "utf8") : a || "{}");
const flag = (argv, name) => {
  const i = argv.indexOf(name);
  return i >= 0 ? argv[i + 1] : undefined;
};

const [cmd, ...rest] = process.argv.slice(2);
try {
  await connect();
  if (cmd === "tools") {
    const r = await rpc("tools/list", {});
    console.log(r.result.tools.map((t) => `${t.name} — ${t.description.split(". ")[0]}`).join("\n"));
  } else if (cmd === "call") {
    console.log(await callTool(rest[0], JSON.parse(readArg(rest[1]))));
  } else if (cmd === "guide") {
    const txt = await callTool("get_guide", { topic: rest[0] });
    if (rest[1]) fs.writeFileSync(rest[1], txt), console.log(`${rest[1]}: ${txt.length} симв.`);
    else console.log(txt);
  } else if (cmd === "use") {
    const [boardId, codeFile] = rest;
    let code = fs.readFileSync(codeFile, "utf8");
    if (rest.includes("--lib")) code = fs.readFileSync(path.join(HERE, "lib.js"), "utf8") + "\n" + code;
    const description = flag(rest, "--desc") || path.basename(codeFile);
    console.log(await callTool("use_holst", { boardId, code, description }, flag(rest, "--shots")));
  } else if (cmd === "upload") {
    const [boardId, ...files] = rest;
    for (let i = 0; i < files.length; i += 10) {
      const batch = files.slice(i, i + 10);
      const txt = await callTool("upload_assets", { boardId, count: batch.length });
      const urls = [...txt.matchAll(/"submitUrl":"([^"]+)"/g)].map((m) => m[1]);
      for (const [j, f] of batch.entries()) {
        const fd = new FormData();
        const type = f.endsWith(".png") ? "image/png" : f.match(/\.jpe?g$/) ? "image/jpeg" : "application/octet-stream";
        fd.append("file", new Blob([fs.readFileSync(f)], { type }), path.basename(f));
        const r = await fetch(urls[j], { method: "POST", body: fd });
        console.log(path.basename(f), await r.text());
      }
    }
  } else {
    console.log(fs.readFileSync(fileURLToPath(import.meta.url), "utf8").split("\n").slice(1, 16).join("\n"));
    process.exit(cmd ? 1 : 0);
  }
} catch (e) {
  console.error(e.message);
  process.exit(1);
}
