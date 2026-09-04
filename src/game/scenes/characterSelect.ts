import Phaser from "phaser";
import { ROSTER, CharacterProfile, isUnlocked } from "../characters/roster";
import { CatCharacter } from "../characters/CatCharacter";
import { FONT_PLAYFUL, T } from "./tuning";
import Text from "../../locales/en.json";

const CARD_W = 160;
const CARD_H = 200;
const PREVIEW_H = 70;
const FLOOR_Y = 14;

function createPreview(scene: Phaser.Scene, _profile: CharacterProfile): CatCharacter {
  const p = new CatCharacter(scene, 0, 0, _profile.spriteKey);
  p.setScale((PREVIEW_H / 120) * T.player.scale);

  // Anchor feet to the floor line and center horizontally inside the card,
  // so the sprite never drifts above the card or to screen coords.
  const b = p.getBounds();
  const feetOffset = b.bottom - p.y;
  const centerX = (b.left + b.right) / 2;
  p.setPosition(-centerX, FLOOR_Y - feetOffset);
  return p;
}

function grayscale(sprite: CatCharacter): void {
  sprite.list.forEach((child: any) => {
    if (child && typeof child.setTint === "function") child.setTint(0x7c8287);
  });
  sprite.setAlpha(0.62);
}

/**
 * A single-character carousel: ◀ | active card | ▶, with a Select & Start
 * button beneath. Everything uses local coordinates relative to this
 * container (which the caller centers on screen).
 */
export function buildCharacterCarousel(
  scene: Phaser.Scene,
  opts: { selectedId: string; onSelectAndStart: (id: string) => void },
): Phaser.GameObjects.Container {
  const layer = scene.add.container(0, 0);
  let index = Math.max(
    0,
    ROSTER.findIndex((c) => c.id === opts.selectedId),
  );

  // Active character card (fixed dimensions, centered at local 0,0).
  const card = scene.add.container(0, 0);
  const cardBg = scene.add
    .rectangle(0, 0, CARD_W, CARD_H, 0x2c3458, 1)
    .setRounded(20)
    .setStrokeStyle(4, 0x8df3df, 1);
  const previewHolder = scene.add.container(0, 0);
  const nameText = scene.add
    .text(0, 26, "", {
      fontFamily: FONT_PLAYFUL,
      fontSize: "13px",
      fontStyle: "bold",
      color: "#f1fff8",
      align: "center",
      lineSpacing: 3,
      wordWrap: { width: CARD_W - 12 },
    })
    .setOrigin(0.5, 0);
  const statusText = scene.add
    .text(0, 64, "", {
      fontFamily: FONT_PLAYFUL,
      fontSize: "12px",
      fontStyle: "bold",
      color: "#ffbfd9",
      align: "center",
      wordWrap: { width: CARD_W - 12 },
    })
    .setOrigin(0.5, 0);
  const lockBadge = scene.add
    .text(46, -58, "🔒", { fontSize: "22px" })
    .setOrigin(0.5);
  card.add([cardBg, previewHolder, nameText, statusText, lockBadge]);

  let preview: CatCharacter | null = null;

  // Arrows flanking the card (gap 16px from the card edge).
  const arrowW = 58;
  const arrowX = CARD_W / 2 + 16 + arrowW / 2;
  const leftBtn = scene.add
    .rectangle(-arrowX, 0, arrowW, arrowW, 0x39527a, 0.95)
    .setRounded(20)
    .setStrokeStyle(4, 0xffffff, 1);
  leftBtn.setInteractive({ useHandCursor: true });
  const leftLabel = scene.add
    .text(-arrowX, 0, "◀", { fontSize: "30px", fontStyle: "bold", color: T.ui.arrowColor })
    .setOrigin(0.5);
  const rightBtn = scene.add
    .rectangle(arrowX, 0, arrowW, arrowW, 0x39527a, 0.95)
    .setRounded(20)
    .setStrokeStyle(4, 0xffffff, 1);
  rightBtn.setInteractive({ useHandCursor: true });
  const rightLabel = scene.add
    .text(arrowX, 0, "▶", { fontSize: "30px", fontStyle: "bold", color: T.ui.arrowColor })
    .setOrigin(0.5);

  // Select & Start button beneath the card.
  const confirmBtn = scene.add
    .rectangle(0, CARD_H / 2 + 12 + 30, 200, 60, 0x8df3df)
    .setRounded(24)
    .setStrokeStyle(5, 0xffffff, 1);
  confirmBtn.setInteractive({ useHandCursor: true });
  const confirmLabel = scene.add
    .text(0, CARD_H / 2 + 12 + 30, Text.ui.selectStart, {
      fontFamily: FONT_PLAYFUL,
      fontSize: "24px",
      fontStyle: "bold",
      color: "#202747",
    })
    .setOrigin(0.5);

  function refresh() {
    const profile = ROSTER[index];
    const unlocked = isUnlocked(profile);

    if (preview) {
      preview.destroy(true);
      preview = null;
    }
    preview = createPreview(scene, profile);
    if (!unlocked) grayscale(preview);
    previewHolder.add(preview);

    nameText.setText(profile.name);
    if (unlocked) {
      statusText.setText(Text.ui.ready);
      lockBadge.setVisible(false);
      confirmBtn.setVisible(true);
      confirmLabel.setVisible(true);
    } else {
      statusText.setText(`${Text.ui.locked} · ${Text.ui.unlockAt} ${profile.unlockScore} pts`);
      lockBadge.setVisible(true);
      confirmBtn.setVisible(false);
      confirmLabel.setVisible(false);
    }
  }

  leftBtn.on("pointerdown", () => {
    index = (index - 1 + ROSTER.length) % ROSTER.length;
    refresh();
  });
  rightBtn.on("pointerdown", () => {
    index = (index + 1) % ROSTER.length;
    refresh();
  });
  confirmBtn.on("pointerdown", () => opts.onSelectAndStart(ROSTER[index].id));

  layer.add([card, leftBtn, leftLabel, rightBtn, rightLabel, confirmBtn, confirmLabel]);
  refresh();

  return layer;
}
