# Requirements - NOXCAT: Cyber Slash

## Coding Patterns

- Keep gameplay in `src/game/`; React remains a thin host plus leaderboard UI.
- Load all image and audio URLs through `src/assets.json`; scenes do not hardcode remote asset URLs.
- Keep all gameplay and UI tuning values in the single top-level `DebugPanel.define` schema and read live values at use time.
- Keep all player-facing copy in `src/locales/en.json`.
- Preserve the protected compatibility section in `Game.ts`.

## Constraints

- The game is portrait-first and uses FIT scaling for desktop and touch screens.
- The leaderboard gracefully falls back to offline play when the server cannot be reached.
- Remote assets require network access; browser autoplay policy may defer music until the first player interaction.
- MapleStory/MSU code, data, and materials are intentionally absent.
