# NebulaOS — Browser Operating System

A complete desktop operating system inside a **single self-contained HTML file** (`index.html`, ~152 KB).
Zero external dependencies: no frameworks, no CDN, no images or fonts — all icons are inline SVG,
all styling is embedded CSS, all logic is vanilla JavaScript.

Open `index.html` in any modern browser (desktop or mobile) and you have a desktop.

## Features

### Desktop & window management
- Draggable/clickable desktop icon grid for every app and game
- Dock with active-window buttons, start/app menu, and a live digital clock/calendar
- Windows: drag, resize (8 edges), minimize, maximize, close — clicked window always comes to front (z-index stacking)
- Right-click desktop context menu: 3 CSS-gradient wallpapers + refresh
- Global Light/Dark theme toggle that re-skins panels, windows, and icons

### System apps
| App | What it does |
|---|---|
| **Files** | Mock filesystem explorer — navigate folders, preview files, create folders (persists to LocalStorage) |
| **Notes** | Text editor with Save (LocalStorage + download as .txt) and Clear; notes survive refresh |
| **Mail** | Inbox list → reading pane, Compose form, send adds to Sent |
| **Calendar** | Month view, today highlighted, prev/next/today navigation, per-day events |
| **Terminal** | Assistant: `/help`, `/time`, `/weather`, `/open <app>`, keyword search filters desktop apps |

### Games (all fully playable)
- **Turbo City** — top-down arcade driving (WASD/arrows), traffic, score, lives
- **Tetris** — rotation, line clears, scoring, levels, game over
- **Snake** — grid movement, food, self-collision, score
- **Flappy** — spacebar flap physics through pipe gaps
- **Minesweeper** — 9x9, left-click reveal, right-click flag, mine counter, win/loss

### Special feature: Quantum Calc
A scientific calculator app invented for this OS: operator-precedence expression parser,
memory keys (MS/MR/M+/MC), √ / x² / 1/x / π, Ans semantics after `=`, full keyboard input,
and a persisted history tape. Documentation lives on the desktop in **ReadMe.txt**
(open it in Files) and in the **About** app.

## Building from source
The file is assembled from ordered parts by a syntax-gated builder (it refuses to emit if the
combined script fails to parse):

```
node build.js     # src/*.js + template.html -> index.html
```

## Testing
`e2e.py` is a Playwright suite (55 checks) covering boot, wallpapers, theme, start menu,
files CRUD + persistence, window z-order/drag/min/max/close, all five games' playfields and
game-over states, Quantum Calc arithmetic/memory/history, and the ReadMe/About documentation.

```
python3 -m http.server 8611 --directory .   # then run e2e.py against it
```
