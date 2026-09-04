import Phaser from "phaser";
import { T, DEPTH, BLOCK_COLORS, lighten } from "./tuning";
import type { SegmentData } from "./tuning";

export function createSegment(
  scene: Phaser.Scene,
  seg: SegmentData,
  segmentHeight: number,
): Phaser.GameObjects.Container {
  const c = scene.add.container(0, 0);
  const w = T.tree.trunkWidth;
  const h = segmentHeight;
  const color = BLOCK_COLORS[seg.colorIndex];

  const g = scene.add.graphics();
  g.lineStyle(26, color, T.tree.stackGlow);
  g.strokeRoundedRect(-w / 2, -h / 2, w, h, 16);
  g.lineStyle(16, color, T.tree.stackGlow);
  g.strokeRoundedRect(-w / 2, -h / 2, w, h, 16);
  g.lineStyle(9, color, T.tree.stackGlow);
  g.strokeRoundedRect(-w / 2, -h / 2, w, h, 16);
  g.fillStyle(0x0b1d35, 0.78);
  g.fillRoundedRect(-w / 2, -h / 2, w, h, 16);
  g.fillStyle(color, 0.08);
  g.fillRoundedRect(-w / 2 + 5, -h / 2 + 5, w - 10, h - 10, 11);
  g.fillStyle(0x0d1228, 0.2);
  g.fillRect(-w / 2 + 5, h / 2 - 16, w - 10, 16);
  g.fillStyle(lighten(color, 32), T.tree.stackGlow);
  g.fillEllipse(-w * 0.28, -h * 0.16, 18, 30);
  g.fillEllipse(-w * 0.08, -h * 0.16, 18, 30);
  g.lineStyle(4, color, T.tree.stackGlow);
  g.strokeRoundedRect(-w / 2, -h / 2, w, h, 16);
  g.setDepth(0);
  c.add(g);

  if (seg.branch !== "none") {
    addHazard(scene, c, seg, segmentHeight);
  }

  c.setDepth(DEPTH.trunk);
  return c;
}

function addHazard(
  scene: Phaser.Scene,
  c: Phaser.GameObjects.Container,
  seg: SegmentData,
  segmentHeight: number,
) {
  const w = T.tree.trunkWidth;
  const side = seg.branch as "left" | "right";
  const dir = side === "left" ? -1 : 1;
  const hw = w * 0.6;
  const hh = segmentHeight * 0.5;

  const g = scene.add.graphics();
  g.lineStyle(24, 0xff4dff, 0.12);
  g.strokeRoundedRect(-hw / 2, -hh / 2, hw, hh, 12);
  g.lineStyle(14, 0xff4dff, 0.28);
  g.strokeRoundedRect(-hw / 2, -hh / 2, hw, hh, 12);
  g.lineStyle(7, 0xff4dff, 0.72);
  g.strokeRoundedRect(-hw / 2, -hh / 2, hw, hh, 12);
  g.fillStyle(0x321636, 0.86);
  g.fillRoundedRect(-hw / 2, -hh / 2, hw, hh, 12);
  g.fillStyle(0xff4dff, 0.2);
  g.fillRoundedRect(-hw / 2 + 4, -hh / 2 + 4, hw - 8, hh - 8, 8);
  g.fillStyle(0xffd1ff, 1);
  g.fillEllipse(-hw * 0.22, 0, 15, 25);
  g.fillEllipse(hw * 0.08, 0, 15, 25);
  g.lineStyle(4, 0xff4dff, 1);
  g.strokeRoundedRect(-hw / 2, -hh / 2, hw, hh, 8);

  // Protrudes from the middle (1/2 height) of the hazardous block.
  g.setDepth(4);
  g.setPosition(dir * (w * 0.5 + hw * 0.35), 0);
  c.add(g);
}
