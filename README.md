# NOXCAT: Cyber Slash

NOXCAT: Cyber Slash 是一款以 Phaser 3 製作的直式 Timberman 風格街機遊戲。玩家在霓虹雨夜中操作 NOXCAT，左右切換位置砍伐樹幹、避開障礙物，並維持時間條以取得高分。

## 問題

本專案將簡單易懂的左右砍伐玩法、角色收集與高分排行榜，包裝成可在瀏覽器與觸控裝置遊玩的賽博龐克街機體驗。

## 功能

- 直式單人砍樹玩法，支援鍵盤、滑鼠與觸控按鈕。
- NOXCAT、Armor、Tactical、Hacker 等可解鎖角色外觀。
- 角色待機、準備、揮砍與收招動畫。
- 碰撞死亡、倒數時間條、分數與最高分紀錄。
- 賽博龐克主選單、HUD、結算畫面與排行榜。
- 使用者提供的 `Midnight Perimeter` 循環背景音樂與多種音效。
- 伺服器排行榜整合；無法連線時仍可離線遊玩。
- 預覽環境提供即時 DebugPanel，可調整遊戲與UI參數。

## 可辨識的實作內容

- `TimbermanScene` 實作遊戲迴圈、角色選擇入口、砍伐判定、障礙物生成、時間條與 game-over 事件。
- `App` 負責掛載 Phaser、接收 game-over 事件，並顯示 `GameOverOverlay` 與 `LeaderboardModal`。
- `GameOverOverlay` 實作成績顯示、排行榜送分、重玩與返回角色選擇。
- `characterSelect` 實作角色輪播、解鎖門檻、鎖定顯示與選角開始。
- `tuning` 集中管理 DebugPanel 調校參數，遊戲程式在使用時讀取即時值。
- `server/src/server.ts` 實作排行榜查詢、同名高分更新與前 20 名限制。

## 架構

```text
App
├── GameComponent        React 與 Phaser 橋接
├── GameOverOverlay      結算與送榜UI
└── LeaderboardModal     排行榜UI

game
├── Game                 Phaser 設定與建立入口
├── scenes
│   ├── TimbermanScene   主要遊戲流程
│   ├── title            主選單
│   ├── characterSelect  角色輪播
│   ├── tower            樹幹與障礙物
│   └── background       程序化背景
├── characters           角色與分數持久化
└── scenes/tuning        調校設定與共用型別
```

玩家可見文字集中在 `src/locales/en.json`，素材索引集中在 `src/assets.json`。

## 技術

- TypeScript、React、ReactDOM
- Phaser 3
- Vite
- Tailwind CSS 與 PostCSS
- Agent8 GameServer SDK：排行榜資料與遠端函式
- Bun：安裝依賴與執行指令

## 執行方式

需要先安裝 [Bun](https://bun.sh)。

```bash
git clone <repository-url>
cd <repository-directory>
bun install
bun run dev
```

接著開啟終端機顯示的本機網址，通常是 `http://localhost:5173`。

檢查型別與建立正式產出：

```bash
bunx tsc --noEmit
bun run build
```

排行榜需要 Agent8 GameServer 環境。一般本機環境仍可遊玩，但排行榜可能顯示離線狀態。

## 限制

- 目前只有英文語系。
- 遊戲畫面固定以直式比例設計，桌面瀏覽器會以 FIT 模式縮放。
- 角色、背景與音樂素材透過遠端資源URL載入，離線時可能無法取得全部素材。
- 瀏覽器自動播放政策可能延後音效或背景音樂，通常需要玩家先互動。
- 排行榜依賴遠端 GameServer；網路或服務不可用時無法讀寫排行榜。
- 本機開發沒有平台注入的 DebugPanel，程式會使用預設調校值，不會顯示調校面板。

## 第三方套件、模型、資料與素材

### 軟體套件

- React、ReactDOM：Meta，MIT License。
- Phaser 3：Phaser CE，MIT License。
- Vite：Vite team，MIT License。
- TypeScript：Microsoft，Apache-2.0 License。
- Tailwind CSS：Tailwind Labs，MIT License。
- PostCSS、Autoprefixer、Lucide React：依各套件附帶的 MIT 或其發行授權使用。
- `@agent8/gameserver` 與 `@agent8/gameserver-node`：Agent8 平台套件，依 Agent8 平台條款與套件隨附授權使用。

### 字體

`Audiowide` 與 `Orbitron` 由 Google Fonts 載入；使用時遵循各字體的 SIL Open Font License 條款。系統備援字體不需要額外下載。

### 遊戲素材與資料

- NOXCAT logo、角色參考圖、角色動畫與音樂檔案均由使用者提供或授權本專案使用；未確認可再散布前，不應單獨從本專案重新發布。
- 角色動畫變體與背景圖為本專案使用的生成素材，來源與URL記錄於 `src/assets.json`；商用、再授權與模型輸出權利仍以原始服務與使用者授權條款為準。
- `Midnight Perimeter.mp3`、砍擊、結算、按鈕與倒數音效的來源及用途已記錄於 `src/assets.json`。


## 授權

本專案原始程式碼採用 [MIT License](./LICENSE)。第三方套件、使用者提供素材、生成素材、字體與資料檔不因本專案採用 MIT 而自動取得相同授權，請依上方說明及各自授權條款使用。
