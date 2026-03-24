# Asteroid Game

> [https://angelkoradiya.github.io/astroid-game/](https://angelkoradiya.github.io/astroid-game/)

A modern browser-based Asteroids-inspired shooter built with vanilla JavaScript, HTML5 Canvas, and CSS.

## 🚀 Overview

This project is a single-page arcade game with responsive UI and rich gameplay mechanics:

- ship movement with momentum and inertia
- shooting with bullet physics
- procedurally spawning asteroids and UFOs
- power-up system: shield, rapid fire, multi shot, time warp
- combo scoring, level progression, and score multipliers
- local high score and settings persistence via `localStorage`
- sound effects + procedural background music via Web Audio API
- FPS counter, particle explosion effects, and screen shake

## 🕹️ Controls

- Move: Arrow keys or `W`, `A`, `S`, `D`
- Shoot: `Space`
- Pause / Resume: `P` or Pause button
- Toggle Music: `M` or settings
- Restart: `R`/button or game over play again
- Open settings: ⚙️ button

## ⚙️ Settings

In-game settings panel includes:

- Sound effects on/off
- Background music on/off
- Music volume control
- Difficulty (`Easy`, `Normal`, `Hard`)
- Particles on/off
- Show FPS on/off
- Ship color selection

All settings are saved locally using `localStorage`.

## ▶️ How to run

1. Open `index.html` in a modern browser (Chrome/Edge/Firefox/Safari).
2. Optional: run with a local static server for best compatibility:

```bash
# Python 3
python -m http.server 8000
# or npm http-server
npx http-server
```

3. Visit `http://localhost:8000` (or port shown by your server).

## 🛠️ Project structure

- `index.html` — game canvas, HUD, overlays (game over, settings)
- `style.css` — layout, theme, HUD styling
- `game.js` — game engine and rendering logic

## 🧪 Development notes

- At game end, new high score is saved automatically.
- Asteroid respawn speed/density scales with difficulty and level.
- UFOs spawn periodically and fire enemy bullets.
- Running in browsers without `AudioContext` gracefully disables sound.

## 🔧 Git workflow (recommended)

```bash
git clone <repo-url>
cd asteroid-game
# create feature/bugfix branch
git checkout -b feature/new-asteroid-type
# commit changes with clear messages
git add .
git commit -m "Add orbiting asteroids and score multiplier"
# merge via PR
```

## 📄 License

Use this project freely for learning and personal projects. Add a license file of your choice when publishing.
