# PSHARKCAT — Game Portal

A dark cyberpunk game portal that auto-discovers and plays **Godot 4 web exports** right in the browser, hosted on GitHub Pages.

## 🗂️ Adding a New Game

1. **Export your Godot game** for the web (`Project → Export → HTML5/Web`)
2. **Create a folder** under `Games/`:
   ```
   Games/
   └── YourGameName/
       ├── index.html       ← Godot export entry point
       ├── game.json        ← Your game's metadata
       ├── thumbnail.png    ← Cover image (recommended: 16:9)
       └── ...              ← Other Godot web files (.wasm, .js, .pck, etc.)
   ```
3. **Create `game.json`** with your game's details:
   ```json
   {
     "title": "My Awesome Game",
     "description": "A fun Godot platformer with cool mechanics.",
     "version": "1.0.0",
     "author": "Psharkcat",
     "releaseDate": "2025-06-01",
     "tags": ["platformer", "action"],
     "thumbnail": "thumbnail.png",
     "controls": "Arrow keys to move, Space to jump",
     "featured": false
   }
   ```
4. **Update `games-list.json`** — either manually:
   ```json
   ["DemoGame", "YourGameName"]
   ```
   Or run the helper script:
   ```powershell
   .\update-games.ps1
   ```
5. **Push to GitHub** — the portal updates automatically!

## 📋 `game.json` Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | ✅ | Display name of the game |
| `description` | string | ✅ | Short description shown on the card |
| `version` | string | — | Version number (e.g. `1.0.0`) |
| `author` | string | — | Creator name |
| `releaseDate` | string | — | ISO date `YYYY-MM-DD` |
| `tags` | array | — | List of genre/category tags |
| `thumbnail` | string | — | Image filename in the same folder |
| `controls` | string | — | Control instructions shown on game page |
| `featured` | boolean | — | Shows ⭐ badge and sorts to top |

## 🏗️ Project Structure

```
Psharkcat.github.io/
├── index.html          ← Homepage
├── game.html           ← Game play page (shared template)
├── games-list.json     ← Manifest of game folder names
├── update-games.ps1    ← Helper: auto-regenerate manifest
├── css/style.css
├── js/main.js
├── js/game.js
├── assets/logo.png
└── Games/
    └── YourGame/
        ├── index.html
        ├── game.json
        └── thumbnail.png
```

## ⚡ GitHub Pages Setup

1. Go to your repo **Settings → Pages**
2. Set source to **main branch / root**
3. Your site will be live at `https://psharkcat.github.io`

## 🔧 Local Dev

Since the site uses `fetch()`, you need a local server (not `file://`):

```powershell
# Python
python -m http.server 8080

# Or use VS Code Live Server extension
```

Then open `http://localhost:8080`.
