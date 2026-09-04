import Phaser from "phaser";
import Text from "../../locales/en.json";
import { DEPTH, FONT_PLAYFUL } from "./tuning";
import { buildCharacterCarousel } from "./characterSelect";

/**
 * Builds the lobby modal: a centered white panel with title, subtitle,
 * the character carousel, and helper text at the bottom.
 */
export function buildTitleScreen(
  scene: Phaser.Scene,
  opts: {
    selectedId: string;
    onSelectAndStart: (id: string) => void;
    onShowLeaderboard: () => void;
  },
): Phaser.GameObjects.Container {
  const w = scene.scale.width;
  const h = scene.scale.height;
  const cx = w / 2;
  const cy = h / 2;

  const layer = scene.add.container(0, 0).setDepth(DEPTH.hud + 10);

  const dim = scene.add.rectangle(cx, cy, w, h, 0x020817, 0.62);
  dim.setInteractive();

  const panelW = Math.min(520, w - 20);
  const panel = scene.add.rectangle(cx, cy, panelW, 520, 0x071827, 0.96).setRounded(28);
  panel.setStrokeStyle(5, 0x00ffc8, 1);

  const title = scene.add
    .text(cx, cy - 225, Text.ui.title, {
      fontFamily: FONT_PLAYFUL,
       fontSize: "34px",
       fontStyle: "bold",
       color: "#b8fff4",
       stroke: "#ff4dff",
       strokeThickness: 7,
      align: "center",
    })
    .setOrigin(0.5);

  const tagline = scene.add
    .text(cx, cy - 185, Text.ui.tagline, {
      fontFamily: FONT_PLAYFUL,
      fontSize: "17px",
      color: "#b9c9e8",
      align: "center",
    })
    .setOrigin(0.5);

  // Centered carousel (card center sits at cy - 30).
  const carousel = buildCharacterCarousel(scene, {
    selectedId: opts.selectedId,
    onSelectAndStart: opts.onSelectAndStart,
  });
  carousel.setPosition(cx, cy - 30);

  const hint = scene.add
    .text(cx, cy + 205, Text.ui.startHint, {
      fontFamily: FONT_PLAYFUL,
      fontSize: "14px",
      color: "#9ab7c9",
      align: "center",
    })
    .setOrigin(0.5);

  // Leaderboard button (top-right corner of the panel).
  const lbX = cx + panelW / 2 - 34;
  const lbY = cy - 225;
  const lbBtn = scene.add
    .circle(lbX, lbY, 22, 0x39527a, 1)
    .setStrokeStyle(4, 0xff4dff, 1);
  lbBtn.setInteractive({ useHandCursor: true });
  const lbLabel = scene.add
    .text(lbX, lbY, "🏆", { fontSize: "20px" })
    .setOrigin(0.5);
  lbBtn.on("pointerdown", () => opts.onShowLeaderboard());

  layer.add([dim, panel, title, tagline, carousel, hint, lbBtn, lbLabel]);

  return layer;
}
