#!/usr/bin/env node
// Разбор выгрузки доски Holst (.holst = zip: data.json + картинки) для изучения стиля преподавателя.
//
//   node inspect-holst-export.mjs <распакованная папка | data.json> [--since 2026-06-01] [--texts out.txt]
//
// Печатает: типы объектов, шрифты, заливки фигур, цвета рисунков, штампы, кадры,
// список картинок (дата, имя, исходное имя, размер). С --texts пишет все тексты
// (по дате создания, с типами блоков: heading/ul/ol/paragraph и жирным **так**).
// Распаковать .holst: `unzip -q board.holst -d <папка>` или Expand-Archive (переименовав в .zip).
import fs from "node:fs";
import path from "node:path";

const argv = process.argv.slice(2);
const flag = (n) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : undefined; };
let src = argv[0];
if (!src) { console.error("укажите папку выгрузки или data.json"); process.exit(1); }
if (fs.statSync(src).isDirectory()) src = path.join(src, "data.json");
const d = JSON.parse(fs.readFileSync(src, "utf8"));
const since = flag("--since") ? Date.parse(flag("--since")) : 0;
const O = d.objects.filter((o) => (o.created?.t || 0) >= since);

const hex = (c) => (typeof c === "number" ? "#" + c.toString(16).padStart(6, "0").toUpperCase() : c);
const count = (f) => {
  const c = {};
  for (const o of O) { const k = f(o); if (k !== undefined) c[k] = (c[k] || 0) + 1; }
  return Object.entries(c).sort((a, b) => b[1] - a[1]).slice(0, 15);
};
const show = (title, rows) => console.log(`\n## ${title}\n` + rows.map(([k, v]) => `  ${v}\t${k}`).join("\n"));

console.log(`Доска: ${d.boardName}, объектов: ${O.length}${since ? " (с " + flag("--since") + ")" : ""}`);
show("Типы объектов", count((o) => o.type));
show("Шрифты текстов", count((o) => (o.type === "simple-text" ? o.fontFamily || "(по умолчанию Inter)" : undefined)));
show("Фигуры", count((o) => (o.type === "shape" ? o.shapeType : undefined)));
show("Заливки фигур", count((o) => (o.type === "shape" ? hex(o.fillColor?.color) : undefined)));
show("Цвета рисования (пометки на уроке)", count((o) => (o.type === "drawing" ? hex(o.color) : undefined)));
show("Штампы", count((o) => (o.type === "stamp" ? o.data?.text : undefined)));

console.log("\n## Картинки (дата, файл в архиве, исходное имя, натуральный размер)");
O.filter((o) => o.type === "image").sort((a, b) => a.created.t - b.created.t).forEach((o) =>
  console.log(`  ${new Date(o.created.t).toISOString().slice(0, 10)}  ${o.name}  ${o.originalName}  ${o.naturalWidth}x${o.naturalHeight}`));

const out = flag("--texts");
if (out) {
  const txt = (js) => {
    let a; try { a = JSON.parse(js.children); } catch { return ""; }
    const r = [];
    (function w(n) { for (const c of n) {
      if (c.text !== undefined) r.push(c.bold ? `**${c.text}**` : c.text);
      else { if (c.type && c.type !== "wrapper") r.push(`\n[${c.type}] `); if (c.children) w(c.children); }
    } })(a);
    return r.join("");
  };
  const T = O.filter((o) => (o.type === "simple-text" || o.type === "shape") && o.jsonState)
    .map((o) => ({ o, t: txt(o.jsonState) })).filter((x) => x.t.trim())
    .sort((a, b) => a.o.created.t - b.o.created.t);
  fs.writeFileSync(out, T.map(({ o, t }) =>
    `=== ${new Date(o.created.t).toISOString().slice(0, 10)} ${o.type} ${o.fontFamily || o.shapeType || ""} ` +
    `@${Math.round(o.position.x)},${Math.round(o.position.y)}${o.fillColor ? " fill=" + hex(o.fillColor.color) : ""}\n${t}\n`).join("\n"));
  console.log(`\nТексты: ${T.length} блоков → ${out}`);
}
