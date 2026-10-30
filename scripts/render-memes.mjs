#!/usr/bin/env node
// Рендерит каждый *.html из папки в PNG (по умолчанию 1080x1080) через headless Chromium-браузер
// (macOS: Chrome → Edge → Chromium → Brave; Windows: Edge → Chrome; путь можно задать в MEME_BROWSER).
// Эмодзи — системные (Apple Color Emoji / Segoe UI Emoji).
//
//   node render-memes.mjs <папка с m1.html, m2.html ...> [--size 1080]
//
// Рядом с html должен лежать base.css (скопируйте из assets/memes/) и в html — href=base.css.
// Каждый процесс браузера ждём не дольше 60 с.
// Сделано на Node, а не на shell/PowerShell: одинаково запускается на Mac и Windows.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { pathToFileURL } from "node:url";

const argv = process.argv.slice(2);
const dir = argv[0] && path.resolve(argv[0]);
const size = Number(argv[argv.indexOf("--size") + 1]) || 1080;
if (!dir || !fs.existsSync(dir)) {
  console.error("укажите папку с html-мемами");
  process.exit(1);
}

const macApps = (name) => [`/Applications/${name}`, path.join(os.homedir(), "Applications", name)];
const byPlatform = {
  darwin: [
    ...macApps("Google Chrome.app/Contents/MacOS/Google Chrome"),
    ...macApps("Microsoft Edge.app/Contents/MacOS/Microsoft Edge"),
    ...macApps("Chromium.app/Contents/MacOS/Chromium"),
    ...macApps("Brave Browser.app/Contents/MacOS/Brave Browser"),
  ],
  win32: [
    // Edge первым: Chrome --headless=new на Windows-машине автора зависал
    path.join(process.env["ProgramFiles(x86)"] || "C:\\Program Files (x86)", "Microsoft\\Edge\\Application\\msedge.exe"),
    path.join(process.env["ProgramFiles"] || "C:\\Program Files", "Microsoft\\Edge\\Application\\msedge.exe"),
    path.join(process.env["ProgramFiles"] || "C:\\Program Files", "Google\\Chrome\\Application\\chrome.exe"),
    path.join(process.env["LOCALAPPDATA"] || "", "Google\\Chrome\\Application\\chrome.exe"),
  ],
  linux: ["/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser", "/usr/bin/microsoft-edge"],
};
const candidates = [process.env.MEME_BROWSER, ...(byPlatform[process.platform] || byPlatform.linux)].filter(Boolean);
const browser = candidates.find((p) => fs.existsSync(p));
if (!browser) {
  console.error(
    "Не найден Chromium-браузер (Chrome, Edge, Chromium, Brave). Установите Google Chrome " +
      "или укажите путь к исполняемому файлу в MEME_BROWSER."
  );
  process.exit(1);
}
const profile = path.join(os.tmpdir(), "holst-meme-render-profile");

function render(html) {
  const png = html.replace(/\.html?$/i, ".png");
  fs.rmSync(png, { force: true });
  const args = [
    "--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check",
    "--disable-extensions", "--hide-scrollbars", `--user-data-dir=${profile}`,
    `--window-size=${size},${size}`, `--screenshot=${png}`, pathToFileURL(html).href,
  ];
  return new Promise((resolve) => {
    const p = spawn(browser, args, { stdio: "ignore", windowsHide: true });
    const t = setTimeout(() => p.kill(), 60000);
    p.on("exit", () => {
      clearTimeout(t);
      resolve(fs.existsSync(png) ? `ok    ${png}` : `FAIL  ${path.basename(html)}`);
    });
  });
}

for (const f of fs.readdirSync(dir).filter((f) => /\.html?$/i.test(f)).sort()) {
  console.log(await render(path.join(dir, f)));
}
