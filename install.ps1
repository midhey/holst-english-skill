# Устанавливает скилл holst-english-lesson для Claude Code (%USERPROFILE%\.claude\skills)
# и Codex (%USERPROFILE%\.codex\skills).
# По умолчанию — junction на эту папку (правки скилла сразу видны обоим агентам);
# с ключом -Copy — независимые копии.
#
#   install.bat [-Copy]              <- обычный способ (обходит ExecutionPolicy)
#   pwsh -File install.ps1 [-Copy]   <- если политика выполнения не мешает

param([switch]$Copy)

$ErrorActionPreference = 'Stop'
$name = 'holst-english-lesson'
# при запуске через [scriptblock]::Create (обход GPO-политики в install.bat)
# $PSScriptRoot пуст — тогда работаем от текущего каталога
$src = if ($PSScriptRoot) { $PSScriptRoot } else { (Get-Location).Path }

if (-not (Test-Path (Join-Path $src 'SKILL.md'))) {
    Write-Error "Не найден $src\SKILL.md — запускайте install.bat/install.ps1 из папки скилла"
}

foreach ($agent in '.claude', '.codex') {
    $agentDir = Join-Path $env:USERPROFILE $agent
    if (-not (Test-Path $agentDir)) {
        Write-Host "пропущено: $agentDir не найден ($agent не установлен)"
        continue
    }
    $dstRoot = Join-Path $agentDir 'skills'
    $dst = Join-Path $dstRoot $name
    if (-not (Test-Path $dstRoot)) { New-Item -ItemType Directory -Path $dstRoot | Out-Null }

    # переустановка поверх существующей
    if (Test-Path -LiteralPath $dst) {
        $item = Get-Item -LiteralPath $dst -Force
        if ($item.LinkType) { $item.Delete() } else { Remove-Item -LiteralPath $dst -Recurse -Force }
    }

    if ($Copy) {
        New-Item -ItemType Directory -Path $dst | Out-Null
        Get-ChildItem $src -Force | Where-Object Name -ne '.git' | Copy-Item -Destination $dst -Recurse
        Write-Host "установлено копией: $dst"
    } else {
        New-Item -ItemType Junction -Path $dst -Target $src | Out-Null
        Write-Host "установлено junction'ом: $dst -> $src"
    }
}

Write-Host "Готово: в Claude Code — /skills, в Codex — список скиллов должен показать $name."
