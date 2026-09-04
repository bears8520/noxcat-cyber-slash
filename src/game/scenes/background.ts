import Phaser from "phaser";
import { DEPTH, GROUND_MARGIN } from "./tuning";

export function createGroundLayer(scene: Phaser.Scene): Phaser.GameObjects.Container {
  const layer = scene.add.container(0, 0).setDepth(DEPTH.ground);
  const groundTop = scene.scale.height - GROUND_MARGIN;
  const ground = scene.add.rectangle(scene.scale.width / 2, groundTop + 45, scene.scale.width, 90, 0x071827);
  ground.setStrokeStyle(4, 0x00ffc8, 0.8);
  layer.add(ground);
  for (let x = 20; x < scene.scale.width; x += 56) {
    const light = scene.add.rectangle(x, groundTop - 2, 28, 4, x % 112 === 20 ? 0xff4dff : 0x00ffc8, 0.85);
    layer.add(light);
  }
  return layer;
}

export function createBackgroundLayer(scene: Phaser.Scene): Phaser.GameObjects.Container {
  const layer = scene.add.container(0, 0);
  const w = scene.scale.width;
  const h = scene.scale.height;
  layer.add(scene.add.image(w / 2, h / 2, "cyberpunkCity").setDisplaySize(w, h));
  layer.add(scene.add.rectangle(w / 2, h / 2, w, h, 0x020817, 0.34));
  layer.add(scene.add.rectangle(w / 2, h * 0.68, w, h * 0.64, 0x020817, 0.36));
  layer.setDepth(DEPTH.far);
  return layer;
}
