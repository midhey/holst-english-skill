// Хелперы для use_holst: приклеиваются перед кодом урока
// (holst-mcp.mjs use ... --lib, либо вставить текст файла в начало code вручную).
// Каждый вызов use_holst — новый JS-scope, поэтому хелперы и шрифт нужны в каждом вызове.
// Палитра и шрифт — стиль преподавателя (references/teacher-style.md); меняйте здесь, а не по коду урока.

const F = "ShantellSans";            // рукописный шрифт преподавателя
await holst.loadFontAsync(F);
const BURG = "#7A1F2B";              // заголовки, плашки, акцент
const INK = "gray12";                // основной текст
const BLUE = "#6FA8DC";              // рамка формулы
const HL = "#FFE58F";                // подсветка грамматики в примерах
const PINK = "#FCE8EC";              // «Watch out», план урока
const SECTION = {                    // фоны секций (тёплое/холодное чередование)
  warmup: "#FFF1D6", vocab: "#E3F0FB", grammar: "#F3ECFB",
  practice: "#E8F6EC", speaking: "#FFE7D1", root: "#FFFBF5",
};

// Text с шрифтом урока. opt: {color, width, align}
const T = (html, fs, opt = {}) =>
  holst.createText({
    html, fontFamily: F, fontSize: fs, textColor: opt.color || INK,
    ...(opt.width ? { width: opt.width } : {}),
    ...(opt.align ? { horizontalAlign: opt.align } : {}),
  });

// Подсветка куска примера: `If I ${hl("had")} …`
const hl = (s) => `<span style="background-color:${HL}">${s}</span>`;

// Белая панель с отступами: Frame + Text. Shape с текстом не годится —
// у него нет внутренних полей, текст липнет к рамке.
function panel(parent, html, x, y, w, opt = {}) {
  const pad = opt.pad || 40;
  const fr = holst.createFrame({ width: w, height: 100, fill: opt.fill || "#FFFFFF", backgroundStyle: opt.style || "with-border" });
  parent.appendChild(fr);
  fr.update({ x, y });
  const t = T(html, opt.fs || 30, { width: w - 2 * pad, color: opt.color });
  fr.appendChild(t);
  t.update({ x: pad, y: pad });
  fr.update({ height: t.height + 2 * pad });
  return fr;
}

// Плашка-«пилюля» (тип условного, номер упражнения). Ширину задавать явно,
// иначе Shape без ширины сворачивается в узкий столбик.
function pill(parent, html, x, y, w, fill = BURG, fs = 38) {
  const s = holst.createShape({
    kind: "square", borderRadius: 999, html, width: w, height: fs * 2.2, fixedSize: true,
    fill, strokeColor: fill, strokeWidth: 1, fontFamily: F, fontSize: fs,
    textColor: "white6", horizontalAlign: "center", verticalAlign: "center",
  });
  parent.appendChild(s);
  s.update({ x, y });
  return s;
}

// Рамка с формулой (крупно, синяя обводка, по центру).
function formula(parent, html, x, y, w, h = 170, fs = 44) {
  const s = holst.createShape({
    kind: "square", borderRadius: 28, html, width: w, height: h, fixedSize: true,
    fill: "#FFFFFF", strokeColor: BLUE, strokeWidth: 6, fontFamily: F, fontSize: fs,
    textColor: INK, horizontalAlign: "center", verticalAlign: "center",
  });
  parent.appendChild(s);
  s.update({ x, y });
  return s;
}

// Секция урока: цветной Frame + крупный заголовок внутри. Возвращает {frame, top} —
// top = y, с которого класть содержимое.
function section(root, title, fill, x, y, w = 2300, subtitle) {
  const frame = holst.createFrame({ width: w, height: 1000, fill });
  root.appendChild(frame);
  frame.update({ x, y });
  const h = T(`<p><strong>${title}</strong></p>`, 72, { color: BURG });
  frame.appendChild(h);
  h.update({ x: 80, y: 64 });
  let top = h.y + h.height + 40;
  if (subtitle) {
    const s = T(`<p>${subtitle}</p>`, 34, { width: w - 160 });
    frame.appendChild(s);
    s.update({ x: 80, y: h.y + h.height + 24 });
    top = s.y + s.height + 48;
  }
  return { frame, top };
}

// Подогнать высоту Frame под содержимое (Frame сам не растёт).
function fit(frame, bottomPad = 96) {
  const b = Math.max(...frame.children.map((c) => c.y + c.height));
  frame.update({ height: b + bottomPad });
  return frame.height;
}

// Секции корня по горизонтали: следующая x = правый край последней + gap.
function nextX(root, gap = 160) {
  const fr = root.children.filter((n) => n.type === "frame");
  return fr.length ? Math.max(...fr.map((f) => f.x + f.width)) + gap : 120;
}
