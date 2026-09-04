# Structure - NOXCAT: Cyber Slash

## Shell

`App.tsx` owns the Phaser instance, game-over result overlay, and leaderboard modal. `GameComponent.tsx` mounts Phaser and passes event handlers into the scene.

## Game

`src/game/Game.ts` creates the fixed portrait Phaser game and contains the protected scale/tween compatibility patch.

`TimbermanScene.ts` owns the lobby, NOXCAT character selection, neon tower, slash loop, timer, HUD, touch buttons, and game-over event.

`CatCharacter.ts` renders the selected NOXCAT outfit and plays idle, preparation, swing, and recovery animations.

`roster.ts` stores character unlocks, selection, and local best-score persistence.

`background.ts`, `tower.ts`, and `flyingBlocks.ts` draw and animate the neon world.

`tuning.ts` contains the single DebugPanel schema, shared depth values, palette, and game types.

## Data

`src/locales/en.json` contains all player-visible text. `src/assets.json` contains only NOXCAT images, audio, and the cyberpunk background.

## Server

`server/src/server.ts` stores a validated, deduplicated global top-20 leaderboard through the Agent8 GameServer SDK.
