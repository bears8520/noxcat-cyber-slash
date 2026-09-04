import Phaser from "phaser";
import Assets from "../../assets.json";
import Text from "../../locales/en.json";
import { CatCharacter } from "../characters/CatCharacter";
import {
  T,
  DEPTH,
  FONT_PLAYFUL,
  GROUND_MARGIN,
  BLOCK_COLORS,
  TARGET_CHARACTER_HEIGHT,
} from "./tuning";
import type { BranchSide, SegmentData, SceneHandlers } from "./tuning";
import { buildTitleScreen } from "./title";
import { createSegment } from "./tower";
import { createGroundLayer, createBackgroundLayer } from "./background";
import {
  launchFlyingBlock as spawnFlyingBlock,
  updateFlyingBlocks as tickFlyingBlocks,
} from "./flyingBlocks";
import type { FlyingBlock } from "./flyingBlocks";
import {
  findCharacter,
  getBestScore,
  getSelectedId,
  selectCharacter,
  recordScore,
} from "../characters/roster";
import type { CharacterProfile } from "../characters/roster";

const DebugPanel = (window as any).DebugPanel ?? { paused: false, timeScale: 1 };

let activeScene: TimbermanScene | null = null;

DebugPanel?.button?.("Restart", () => {
  if (activeScene) activeScene.scene.restart({ skipMenu: false });
});

export class TimbermanScene extends Phaser.Scene {
  private player!: CatCharacter;
  private activeCharacter!: CharacterProfile;
  private playerSide: "left" | "right" = "left";
  private playerXLeft = 0;
  private playerXRight = 0;
  private playerY = 0;
  private segmentHeight = 0;

  private segments: SegmentData[] = [];
  private segmentContainers: Phaser.GameObjects.Container[] = [];
  private flyingBlocks: FlyingBlock[] = [];
  private bottomRowY = 0;
  private visibleSegments = 0;

  private trunkLeft = 0;
  private trunkRight = 0;
  private groundY = 0;

  private score = 0;
  private timeLeft = 0;
  private gameOver = false;
  private started = false;
  private hintVisible = false;

  private lastChopAt = 0;
  private blockColorCounter = 0;
  private safeStreak = 0;
  private sideStreak = 0;
  private lastHazardSide: "left" | "right" | null = null;

  private scoreText!: Phaser.GameObjects.Text;
  private bestText!: Phaser.GameObjects.Text;
  private timerDom!: HTMLElement;
  private timerFill!: HTMLElement;
  private hintText!: Phaser.GameObjects.Text;
  private groundLayer!: Phaser.GameObjects.Container;
  private hudLayer!: Phaser.GameObjects.Container;

  private leftBtnBg!: Phaser.GameObjects.Rectangle;
  private leftBtnText!: Phaser.GameObjects.Text;
  private rightBtnBg!: Phaser.GameObjects.Rectangle;
  private rightBtnText!: Phaser.GameObjects.Text;

  private backgroundLayer: Phaser.GameObjects.Container | null = null;

  private chopSound!: Phaser.Sound.BaseSound;
  private gameoverSound!: Phaser.Sound.BaseSound;
  private clickSound!: Phaser.Sound.BaseSound;
  private tickSound!: Phaser.Sound.BaseSound;
  private musicSound!: Phaser.Sound.BaseSound;

  private dangerVignette!: Phaser.GameObjects.Container;
  private lastTickAt = 0;

  private titleLayer!: Phaser.GameObjects.Container;
  private menuActive = true;

  private _eff = 1;
  private _lastBtn = { inset: -1, lift: -1, w: -1, h: -1 };
  private _lastVol = -1;

  constructor() {
    super({ key: "TimbermanScene" });
  }

  preload() {
    this.load.on("loaderror", (f: any) => {
      window.dispatchEvent(
        new ErrorEvent("error", {
          message: "Phaser load failed: " + f.key + " — " + f.src,
          filename: f.src,
        }),
      );
    });

    this.load.spritesheet("catSword", Assets.spritesheets.catSword.url, {
      frameWidth: 256,
      frameHeight: 256,
    });
    this.load.image("cyberpunkCity", Assets.backgrounds.cyberpunkCity.url);
    this.load.image("noxcat", Assets.logos.noxcat.url);
    this.load.spritesheet("catArmorSword", Assets.spritesheets.catArmorSword.url, {
      frameWidth: 256,
      frameHeight: 256,
    });
    this.load.spritesheet("catTacticalSword", Assets.spritesheets.catTacticalSword.url, {
      frameWidth: 256,
      frameHeight: 256,
    });
    this.load.spritesheet("catHackerSword", Assets.spritesheets.catHackerSword.url, {
      frameWidth: 256,
      frameHeight: 256,
    });
    this.load.audio("chop", Assets.audio.chop.url);
    this.load.audio("gameover", Assets.audio.gameover.url);
    this.load.audio("click", Assets.audio.click.url);
    this.load.audio("tick", Assets.audio.tick.url);
    this.load.audio("razorInTheRain", Assets.audio.razorInTheRain.url);
  }

  private loadEnvironment() {
    // The moonlit grove is rendered with Phaser shapes, without external world art.
  }

  create(data: any) {
    // On restart Phaser reuses this scene instance but destroys every
    // GameObject it created (Shape.preDestroy sets `geom = null`). Clear
    // cached refs so `setSize`/`setPosition` never hit a destroyed shape.
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.onShutdown());

    activeScene = this;
    this.cameras.main.setBackgroundColor("#020817");

    this.chopSound = this.sound.add("chop", { volume: 0.6 });
    this.gameoverSound = this.sound.add("gameover", { volume: 0.7 });
    this.clickSound = this.sound.add("click", { volume: 0.6 });
    this.tickSound = this.sound.add("tick", { volume: 0.5 });
    this.musicSound = this.sound.add("razorInTheRain", { loop: true });
    this.sound.volume = T.audio.volume;

    this.layout();
    this.buildGround();
    this.buildBackground();
    this.buildHUD();
    this.buildTimerDom();

    this.buildPlayer();

    this.resetGame();

    this.input.keyboard?.on("keydown-LEFT", () => this.chop("left"));
    this.input.keyboard?.on("keydown-RIGHT", () => this.chop("right"));
    this.input.keyboard?.on("keydown-A", () => this.chop("left"));
    this.input.keyboard?.on("keydown-D", () => this.chop("right"));

    this.buildButtons();

    // Lobby screen before the game starts (skip on "Play Again" restart).
    this.menuActive = !(data && data.skipMenu);
    if (this.menuActive) {
      this.buildTitle();
    } else {
      this.startGame();
    }
  }

  // ─────────────────────────── layout ───────────────────────────

  private layout() {
    const w = this.scale.width;
    const h = this.scale.height;

    this.trunkLeft = w / 2 - T.tree.trunkWidth / 2;
    this.trunkRight = w / 2 + T.tree.trunkWidth / 2;

    // Ground sits above the bottom touch buttons; the player's feet land on it.
    this.groundY = h - GROUND_MARGIN;

    const halfChar = 20;
    this.playerXLeft = this.trunkLeft - T.player.gap - halfChar;
    this.playerXRight = this.trunkRight + T.player.gap + halfChar;

    this.segmentHeight = T.tree.segmentHeight;
    this.bottomRowY = this.groundY - this.segmentHeight / 2;
    this.visibleSegments = Math.max(8, Math.ceil(h / this.segmentHeight) + 2);
  }

  private measurePlayer() {
    const b = this.player.getBounds();
    const feetOffset = b.bottom - this.player.y;
    this.playerY = this.groundY - feetOffset + T.player.lift;
    this.player.setPosition(this.playerXLeft, this.playerY);
  }

  private buildPlayer() {
    if (this.player) {
      this.player.destroy(true);
      this.player = undefined as any;
    }

    this.activeCharacter = findCharacter(getSelectedId());
    this.player = new CatCharacter(this, this.playerXLeft, 0, this.activeCharacter.spriteKey);
    this.player.face("left");
    this.player.setDepth(DEPTH.player);
    this.player.setScale((TARGET_CHARACTER_HEIGHT / 120) * T.player.scale);
    this.measurePlayer();
  }

  private playerIdle() {
    this.player.idle();
  }

  private playerChop() {
    this.player.chop();
  }

  private buildGround() {
    if (this.groundLayer) this.groundLayer.destroy(true);
    this.groundLayer = createGroundLayer(this);
  }

  private buildBackground() {
    if (this.backgroundLayer) this.backgroundLayer.destroy(true);
    this.backgroundLayer = createBackgroundLayer(this);
  }

  private buildHUD() {
    if (this.hudLayer) this.hudLayer.destroy(true);
    this.hudLayer = this.add.container(0, 0).setDepth(DEPTH.hud);

    const w = this.scale.width;
    const h = this.scale.height;
    const cx = w / 2;

    const logo = this.add
      .image(T.ui.logoX, T.ui.logoY, "noxcat")
      .setOrigin(0)
      .setDisplaySize(T.ui.logoW, T.ui.logoH)
      .setAlpha(0.86);

    this.scoreText = this.add
      .text(cx, 26, "0", {
        fontFamily: FONT_PLAYFUL,
        fontSize: "52px",
        fontStyle: "bold",
        color: "#ffffff",
        stroke: "#39527a",
        strokeThickness: 10,
      })
      .setOrigin(0.5, 0);

    const scoreLabel = this.add
      .text(cx, 12, Text.ui.score, {
        fontFamily: FONT_PLAYFUL,
        fontSize: "15px",
        fontStyle: "bold",
         color: "#00ffc8",
      })
      .setOrigin(0.5, 0);

    this.bestText = this.add
      .text(cx, 96, `${Text.ui.best} 0`, {
        fontFamily: FONT_PLAYFUL,
        fontSize: "18px",
        fontStyle: "bold",
         color: "#ffffff",
         stroke: "#ff4dff",
        strokeThickness: 5,
      })
      .setOrigin(0.5, 0);

    // Red danger vignette along the screen borders (shown on low time).
    this.dangerVignette = this.add
      .container(0, 0)
      .setDepth(DEPTH.hud - 1)
      .setAlpha(0);
    const edge = 28;
    this.dangerVignette.add(this.add.rectangle(cx, 0, w, edge, 0xff1a1a));
    this.dangerVignette.add(this.add.rectangle(cx, h, w, edge, 0xff1a1a));
    this.dangerVignette.add(this.add.rectangle(0, h / 2, edge, h, 0xff1a1a));
    this.dangerVignette.add(this.add.rectangle(w, h / 2, edge, h, 0xff1a1a));

    this.hintText = this.add
      .text(cx, h - 300, Text.ui.tapToStart, {
        fontFamily: FONT_PLAYFUL,
        fontSize: "22px",
        fontStyle: "bold",
        color: "#ffffff",
        stroke: "#ff6fae",
        strokeThickness: 6,
        align: "center",
      })
      .setOrigin(0.5, 0)
      .setAlpha(0);

    this.hudLayer.add([
      logo,
      scoreLabel,
      this.scoreText,
      this.bestText,
      this.hintText,
    ]);

    this.updateScoreText();
  }

  private buildButtons() {
    const w = this.scale.width;
    const h = this.scale.height;
    const bw = T.ui.btnW;
    const bh = T.ui.btnH;
    const inset = T.ui.btnInset;
    const lift = T.ui.btnLift;
    const y = h - bh / 2 - 14 + lift;

    this.makeButton("left", inset + bw / 2, y, bw, bh);
    this.makeButton("right", w - inset - bw / 2, y, bw, bh);
  }

  private makeButton(
    side: "left" | "right",
    x: number,
    y: number,
    bw: number,
    bh: number,
  ) {
    const isLeft = side === "left";
    const bg = isLeft ? this.leftBtnBg : this.rightBtnBg;
    const txt = isLeft ? this.leftBtnText : this.rightBtnText;

    if (bg) {
      bg.setPosition(x, y);
      bg.setSize(bw, bh);
      txt.setPosition(x, y);
      return;
    }

    const fillColor = isLeft ? 0x7b176f : 0x064c5c;
    const strokeText = isLeft ? 0xff4dff : 0x00ffc8;

    const newBg = this.add
      .rectangle(x, y, bw, bh, fillColor, 0.8)
      .setRounded(28)
      .setStrokeStyle(4, 0xffffff, 1)
      .setDepth(DEPTH.hud);
    newBg.setInteractive({ useHandCursor: true });

    const arrow = isLeft ? "◀" : "▶";
    const label = isLeft ? Text.ui.left : Text.ui.right;
    const newTxt = this.add
      .text(x, y, `${arrow}\n${label}`, {
        fontFamily: FONT_PLAYFUL,
        fontSize: "26px",
        fontStyle: "bold",
        color: "#ffffff",
        stroke: `#${strokeText.toString(16)}`,
        strokeThickness: 6,
        align: "center",
        lineSpacing: 4,
      })
      .setOrigin(0.5)
      .setDepth(DEPTH.hud)
      .setAlpha(0.85);

    newBg.on("pointerdown", () => this.chop(side));

    if (isLeft) {
      this.leftBtnBg = newBg;
      this.leftBtnText = newTxt;
    } else {
      this.rightBtnBg = newBg;
      this.rightBtnText = newTxt;
    }
  }

  // ─────────────────────────── title / lobby ───────────────────────────

  private buildTitle() {
    if (this.titleLayer) this.titleLayer.destroy(true);
    const handlers = this.registry.get("handlers") as SceneHandlers | undefined;
    this.titleLayer = buildTitleScreen(this, {
      selectedId: getSelectedId(),
      onSelectAndStart: (id) => {
        selectCharacter(id);
        this.startGame();
      },
      onShowLeaderboard: () => handlers?.onShowLeaderboard?.(),
    });
  }

  private startGame() {
    this.menuActive = false;
    this.clickSound.play();
    if (!this.musicSound.isPlaying) this.musicSound.play();
    if (this.titleLayer) {
      this.titleLayer.destroy(true);
      this.titleLayer = undefined as any;
    }
    if (getSelectedId() !== this.activeCharacter.id) {
      this.buildPlayer();
      this.player.setPosition(this.playerXLeft, this.playerY);
      this.playerIdle();
    }
    this.showHint();
  }

  private showHint() {
    this.hintVisible = true;
    this.hintText.setAlpha(0.95);
    this.tweens.add({
      targets: this.hintText,
      alpha: { from: 0.45, to: 0.95 },
      duration: 650,
      yoyo: true,
      repeat: -1,
    });
  }

  // ─────────────────────────── game flow ───────────────────────────

  private resetGame() {
    this.segments = [];
    this.segmentContainers.forEach((c) => c.destroy(true));
    this.segmentContainers = [];
    this.flyingBlocks.forEach((fb) => fb.container.destroy());
    this.flyingBlocks = [];

    this.score = 0;
    this.timeLeft = T.time.max;
    this.gameOver = false;
    this.started = false;
    this.hintVisible = false;
    this.blockColorCounter = 0;
    this.safeStreak = 0;
    this.sideStreak = 0;
    this.lastHazardSide = null;
    this.playerSide = "left";
    this.player.face("left");
    this.player.setPosition(this.playerXLeft, this.playerY);
    this.playerIdle();

    for (let i = 0; i < this.visibleSegments; i++) {
       const seg = this.generateSegment(i < 3);
      this.segments.push(seg);
      const c = createSegment(this, seg, this.segmentHeight);
      c.x = this.scale.width / 2;
      c.y = this.bottomRowY - i * this.segmentHeight;
      this.segmentContainers.push(c);
    }

    this.updateScoreText();
    this.updateTimerDom();
    this.hintText.setAlpha(0);
  }

  private generateSegment(forceSafe = false): SegmentData {
    let branch: BranchSide = "none";
    if (!forceSafe) {
      const rate =
        this.score > 80 ? T.tree.hazardHigh : this.score > 30 ? T.tree.hazardMid : T.tree.hazardLow;
      if (this.safeStreak >= T.tree.maxSafeStreak || Math.random() < rate) {
        const opposite: "left" | "right" =
          this.lastHazardSide === "left" ? "right" : "left";
        let side: "left" | "right";
        if (this.lastHazardSide === null) {
          side = Math.random() < 0.5 ? "left" : "right";
        } else if (this.sideStreak >= T.tree.maxSideStreak || Math.random() < 0.7) {
          side = opposite; // cap same-side, or bias toward L→R→L→R alternation
        } else {
          side = this.lastHazardSide; // occasional repeat
        }
        branch = side;
        this.sideStreak = side === this.lastHazardSide ? this.sideStreak + 1 : 1;
        this.lastHazardSide = side;
        this.safeStreak = 0;
      } else {
        this.safeStreak++;
        this.sideStreak = 0;
      }
    }
    return { branch, colorIndex: this.blockColorCounter++ % BLOCK_COLORS.length };
  }

  private chop(side: "left" | "right") {
    if (this.menuActive) {
      this.startGame();
      return;
    }
    if (this.gameOver || this._eff === 0) return;
    if (this.segments.length < 2) return;
    if (this.time.now - this.lastChopAt < 70) return;
    this.lastChopAt = this.time.now;

    if (this.hintVisible) {
      this.hintVisible = false;
      this.started = true; // countdown begins on the first chop
      this.tweens.killTweensOf(this.hintText);
      this.hintText.setAlpha(0);
    }

    this.playerSide = side;
    this.player.face(side);
    this.tweens.add({
      targets: this.player,
      x: side === "left" ? this.playerXLeft : this.playerXRight,
      duration: 70,
      ease: "Quad.easeOut",
    });

    this.playerChop();

    this.chopSound.play();
    this.spawnChips(side);

    const incoming = this.segments[1];

    const bottomContainer = this.segmentContainers.shift();
    this.segments.shift();
    if (bottomContainer) {
      this.launchFlyingBlock(bottomContainer, side === "left" ? 1 : -1);
    }

    const newSeg = this.generateSegment();
    this.segments.push(newSeg);
    const newContainer = createSegment(this, newSeg, this.segmentHeight);
    newContainer.x = this.scale.width / 2;
    newContainer.y = this.bottomRowY - this.segments.length * this.segmentHeight;
    this.segmentContainers.push(newContainer);

    const sh = this.segmentHeight;
    this.segmentContainers.forEach((c, i) => {
      this.tweens.add({
        targets: c,
        y: this.bottomRowY - i * sh,
        duration: T.tree.dropMs,
        ease: "Cubic.easeOut",
      });
    });

    if (incoming.branch === side) {
      this.endGame("branch");
      return;
    }

    this.score++;
    const repl = this.score > 80 ? T.time.replenish * T.time.replenishHigh : T.time.replenish;
    this.timeLeft = Math.min(T.time.max, this.timeLeft + repl);
    this.updateScoreText();
    this.updateTimerDom();
  }

  private spawnChips(side: "left" | "right") {
    const dir = side === "left" ? -1 : 1;
    const originX = side === "left" ? this.trunkLeft : this.trunkRight;
    const originY = this.bottomRowY;
    const color = 0xff4dff;

    for (let i = 0; i < 6; i++) {
      const chip = this.add.rectangle(
        originX,
        originY,
        18,
        14,
        color,
        1,
      );
      chip.setStrokeStyle(2, 0x2a1a10, 0.8);
      chip.setDepth(DEPTH.player + 1);
      this.tweens.add({
        targets: chip,
        x: originX + dir * (60 + Math.random() * 80),
        y: originY - 20 - Math.random() * 120,
        alpha: 0,
        angle: dir * (120 + Math.random() * 200),
        duration: 320 + Math.random() * 160,
        ease: "Cubic.easeOut",
        onComplete: () => chip.destroy(),
      });
    }
  }

  private launchFlyingBlock(container: Phaser.GameObjects.Container, dir: number) {
    // Behind the block stack/character/buttons, in front of the background.
    spawnFlyingBlock(this.flyingBlocks, container, dir, DEPTH.near + 1);
  }

  private updateFlyingBlocks() {
    tickFlyingBlocks(this.flyingBlocks, this.scale.width, this.scale.height);
  }

  private endGame(reason: "branch" | "timeout") {
    if (this.gameOver) return;
    this.gameOver = true;
    recordScore(this.score);

    if (reason === "branch") {
      this.cameras.main.flash(180, 255, 70, 70);
      this.cameras.main.shake(220, 0.012);
    }
    this.gameoverSound.play();
    this.musicSound.stop();
    this.time.delayedCall(420, () => {
      const handlers = this.registry.get("handlers") as SceneHandlers | undefined;
      handlers?.onGameOver?.(this.score, reason);
    });
  }

  private updateScoreText() {
    this.scoreText.setText(String(this.score));
    this.bestText.setText(`${Text.ui.best} ${Math.max(getBestScore(), this.score)}`);
  }

  private buildTimerDom() {
    const container = document.createElement("div");
    container.className = "timer-hud";
    container.innerHTML =
      `<div class="timer-label">${Text.ui.time.toUpperCase()}</div>` +
      '<div class="timer-track"><div class="timer-fill"></div></div>';
    this.timerFill = container.querySelector(".timer-fill") as HTMLElement;
    document.body.appendChild(container);
    this.timerDom = container;
  }

  private updateTimerDom() {
    const frac = Phaser.Math.Clamp(this.timeLeft / T.time.max, 0, 1);
    const low = T.time.lowTimePct;
    const background =
      frac > 0.5
        ? "linear-gradient(90deg, #00f2fe 0%, #4facfe 100%)"
        : frac > low
          ? "linear-gradient(90deg, #ffd43b 0%, #ff9e3d 100%)"
          : "linear-gradient(90deg, #ff6b6b 0%, #ff3b3b 100%)";
    this.timerFill.style.width = `${frac * 100}%`;
    this.timerFill.style.background = background;
  }

  private updateLowTimeWarning() {
    const frac = this.timeLeft / T.time.max;
    const low = frac > 0 && frac <= T.time.lowTimePct;
    if (low) {
      const pulse = 0.5 + 0.5 * Math.sin(this.time.now / 110);
      this.timerFill.style.opacity = String(0.55 + 0.45 * pulse);
      this.dangerVignette.setAlpha(0.16 + 0.22 * pulse);
      if (this.time.now - this.lastTickAt > 450) {
        this.lastTickAt = this.time.now;
        this.tickSound.play();
      }
    } else {
      this.timerFill.style.opacity = "1";
      this.dangerVignette.setAlpha(0);
    }
  }

  // ─────────────────────────── update ───────────────────────────

  update(_time: number, delta: number) {
    const paused =
      typeof (DebugPanel as any).paused === "boolean" && (DebugPanel as any).paused;
    const ts =
      typeof (DebugPanel as any).timeScale === "number" ? (DebugPanel as any).timeScale : 1;
    const eff = paused ? 0 : ts;
    if (eff !== this._eff) {
      this._eff = eff;
      this.time.timeScale = this.tweens.timeScale = eff;
      this.anims.globalTimeScale = eff;
    }
    if (eff === 0) return;
    const dt = (delta / 1000) * eff;

    this.syncLayoutTunables();

    if (this._lastVol !== T.audio.volume) {
      this._lastVol = T.audio.volume;
      this.sound.volume = T.audio.volume;
    }

    this.updateFlyingBlocks();

    if (this.gameOver || this.menuActive || !this.started) return;

    const mult =
      this.score > 80 ? T.time.drainHigh : this.score > 30 ? T.time.drainMid : 1;
    this.timeLeft -= T.time.drain * mult * dt;
    if (this.timeLeft <= 0) {
      this.timeLeft = 0;
      this.updateTimerDom();
      this.endGame("timeout");
      return;
    }
    this.updateTimerDom();
    this.updateLowTimeWarning();
  }

  private syncLayoutTunables() {
    const btn = this._lastBtn;
    if (
      btn.inset !== T.ui.btnInset ||
      btn.lift !== T.ui.btnLift ||
      btn.w !== T.ui.btnW ||
      btn.h !== T.ui.btnH
    ) {
      btn.inset = T.ui.btnInset;
      btn.lift = T.ui.btnLift;
      btn.w = T.ui.btnW;
      btn.h = T.ui.btnH;
      this.buildButtons();
    }
  }

  private onShutdown() {
    const sounds = [this.chopSound, this.gameoverSound, this.clickSound, this.tickSound, this.musicSound];
    sounds.forEach((s) => {
      try {
        s?.stop();
        s?.destroy();
      } catch {}
    });
    this.chopSound = undefined as any;
    this.gameoverSound = undefined as any;
    this.clickSound = undefined as any;
    this.tickSound = undefined as any;
    this.musicSound = undefined as any;

    if (this.timerDom) {
      this.timerDom.remove();
      this.timerDom = undefined as any;
      this.timerFill = undefined as any;
    }

    this.groundLayer = undefined as any;
    this.hudLayer = undefined as any;
    this.dangerVignette = undefined as any;
    this.player = undefined as any;
    this.scoreText = undefined as any;
    this.bestText = undefined as any;
    this.hintText = undefined as any;
    this.leftBtnBg = undefined as any;
    this.leftBtnText = undefined as any;
    this.rightBtnBg = undefined as any;
    this.rightBtnText = undefined as any;
    this.titleLayer = undefined as any;
    this.backgroundLayer = null;
    this.segmentContainers = [];
    this.segments = [];
    this.flyingBlocks = [];
  }
}
