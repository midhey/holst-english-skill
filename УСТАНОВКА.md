# Установка скилла holst-english-lesson

Скилл работает в **Claude Code** и **Codex** на **macOS** и **Windows**.

## Что нужно на компьютере

- десктопное приложение **Holst** (запущено, вы вошли в аккаунт);
- **Node.js 18+** — `node -v`; на Mac: `brew install node`;
- **Google Chrome** (или Edge / Chromium / Brave) — для отрисовки мемов.

## macOS

```bash
tar -xzf holst-english-lesson.tar.gz -C ~/skills     # или любая папка, где будут жить скиллы
cd ~/skills/holst-english-lesson
bash install.sh            # симлинки в ~/.claude/skills и ~/.codex/skills
```

`bash install.sh --copy` — независимые копии вместо симлинков (тогда исходную папку можно удалить).

## Windows

Дважды кликнуть `install.bat` (или `install.bat -Copy`).

## Проверка

- Claude Code: `/skills` показывает `holst-english-lesson`.
- Codex: скилл есть в списке скиллов.
- Связь с Holst: `node scripts/holst-mcp.mjs tools` выводит список инструментов
  (`resolve_board`, `create_board`, `use_holst` …). Если `Holst MCP недоступен` — запустите Holst;
  если порт на Mac другой, см. `references/holst-notes.md`, раздел «Подключение».

## Как пользоваться

Просто напишите агенту тему урока:

> Подготовь урок: Travelling, conditionals 0,1,2,3 and mixed

Агент сам соберёт доску в Holst и пришлёт ссылку.
