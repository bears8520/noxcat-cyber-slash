# Context - NOXCAT: Cyber Slash

## Project Overview

NOXCAT: Cyber Slash is a portrait Phaser 3 arcade game in a React shell. Players switch sides around a neon energy tower, slash incoming hazards, maintain a countdown timer, unlock NOXCAT outfits, and submit scores to a server-backed top-20 leaderboard.

## Tech Stack

- Game engine: Phaser 3 with tween-driven arcade gameplay
- Shell: React and ReactDOM
- Styling: CSS, Tailwind base, and Google Fonts
- Server: Agent8 GameServer leaderboard integration with offline fallback
- Build: Vite and TypeScript

## Critical Memory

- `TimbermanScene` owns the title screen, character selection, chop loop, timer, effects, HUD, and game-over event.
- `CatCharacter` uses the NOXCAT sprite sheets from `src/assets.json`.
- All gameplay and UI tuning values live in the top-level `DebugPanel.define` schema.
- MapleStory/MSU code, data, and materials are not part of this project.
- The current project's platform identity is supplied by its own `.agent8.lock`; the imported repository identity was not copied.
