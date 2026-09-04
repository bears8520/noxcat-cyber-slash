import Phaser from "phaser";

export interface FlyingBlock {
  container: Phaser.GameObjects.Container;
  vx: number;
  vy: number;
  angularVel: number;
  age: number;
}

// Frame-based lifespan (~0.35s at 60fps).
const MAX_AGE = 21;

/** Launch a chopped block sideways with a fast upward arc + spin. */
export function launchFlyingBlock(
  list: FlyingBlock[],
  container: Phaser.GameObjects.Container,
  dir: number,
  depth: number,
): void {
  container.setDepth(depth);
  list.push({
    container,
    vx: dir * (24 + Math.random() * 8),
    vy: -(8 + Math.random() * 4),
    angularVel: dir * 15,
    age: 0,
  });
}

/** Integrate velocity + gravity + spin, shrink/fade over its lifetime, then cull. */
export function updateFlyingBlocks(
  list: FlyingBlock[],
  w: number,
  h: number,
): void {
  for (let i = list.length - 1; i >= 0; i--) {
    const fb = list[i];
    fb.age++;
    const t = Math.min(1, fb.age / MAX_AGE);
    fb.vy += 0.8; // gravity
    fb.container.x += fb.vx;
    fb.container.y += fb.vy;
    fb.container.angle += fb.angularVel;
    fb.container.setScale(1 - 0.6 * t); // 1.0 → 0.4
    fb.container.setAlpha(1 - t); // 1.0 → 0.0
    if (t >= 1 || fb.container.y > h + 100 || fb.container.x < -100 || fb.container.x > w + 100) {
      fb.container.destroy();
      list.splice(i, 1);
    }
  }
}
