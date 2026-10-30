#!/usr/bin/env bash
# Устанавливает скилл holst-english-lesson для Claude Code (~/.claude/skills)
# и Codex (~/.codex/skills) на macOS / Linux.
# По умолчанию — симлинк на эту папку (правки скилла сразу видны обоим агентам);
# с ключом --copy — независимые копии.
#
#   bash install.sh [--copy]
set -euo pipefail

name="holst-english-lesson"
src="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
[ -f "$src/SKILL.md" ] || { echo "Не найден $src/SKILL.md — запускайте install.sh из папки скилла" >&2; exit 1; }

mode="link"
[ "${1:-}" = "--copy" ] && mode="copy"

for agent in .claude .codex; do
  agent_dir="$HOME/$agent"
  if [ ! -d "$agent_dir" ]; then
    echo "пропущено: $agent_dir не найден ($agent не установлен)"
    continue
  fi
  dst="$agent_dir/skills/$name"
  mkdir -p "$agent_dir/skills"
  rm -rf "$dst"   # переустановка поверх существующей (симлинк или папка)
  if [ "$mode" = "copy" ]; then
    cp -R "$src" "$dst" && rm -rf "$dst/.git"
    echo "установлено копией: $dst"
  else
    ln -s "$src" "$dst"
    echo "установлено симлинком: $dst -> $src"
  fi
done

if ! command -v node >/dev/null 2>&1; then
  echo "Внимание: node не найден. Скриптам скилла нужен Node 18+: brew install node"
elif [ "$(node -p 'process.versions.node.split(".")[0]')" -lt 18 ]; then
  echo "Внимание: node $(node -v) — нужен 18+: brew upgrade node"
fi
echo "Готово: в Claude Code — /skills, в Codex — список скиллов должен показать $name."
