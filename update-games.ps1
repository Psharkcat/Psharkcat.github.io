<#
.SYNOPSIS
    Regenerates games-list.json by scanning the Games/ directory.

.DESCRIPTION
    Run this script whenever you add or remove a game folder under Games/.
    It updates games-list.json at the repo root automatically.

.EXAMPLE
    .\update-games.ps1
#>

$GamesDir = Join-Path $PSScriptRoot "Games"
$OutputFile = Join-Path $PSScriptRoot "games-list.json"

if (-not (Test-Path $GamesDir)) {
    Write-Error "Games/ directory not found. Make sure you run this from the repo root."
    exit 1
}

# Find all subdirectories in Games/ that contain a game.json
$gameFolders = Get-ChildItem -Path $GamesDir -Directory |
    Where-Object { Test-Path (Join-Path $_.FullName "game.json") } |
    Sort-Object Name |
    ForEach-Object { $_.Name }

# Write JSON
$json = $gameFolders | ConvertTo-Json -Compress

# If only one item, ConvertTo-Json returns a plain string, not an array
if ($gameFolders.Count -eq 1) {
    $json = "[$($gameFolders[0] | ConvertTo-Json)]"
} elseif ($gameFolders.Count -eq 0) {
    $json = "[]"
}

Set-Content -Path $OutputFile -Value $json -Encoding UTF8

Write-Host "✅ games-list.json updated with $($gameFolders.Count) game(s):"
$gameFolders | ForEach-Object { Write-Host "   → $_" }
