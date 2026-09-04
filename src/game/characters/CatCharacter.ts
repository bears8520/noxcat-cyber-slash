import Phaser from "phaser";
import { T } from "../scenes/tuning";

const ANIMATIONS = {
  idle: "cat-idle",
  prepare: "cat-prepare",
  swing: "cat-swing",
  recover: "cat-recover",
} as const;
type SpriteKey = "catSword" | "catArmorSword" | "catTacticalSword" | "catHackerSword";

/** Uses the supplied NOXCAT design as a frame-based sword-chopping character. */
export class CatCharacter extends Phaser.GameObjects.Container {
  private readonly sprite: Phaser.GameObjects.Sprite;

  constructor(scene: Phaser.Scene, x: number, y: number, spriteKey: SpriteKey = "catSword") {
    super(scene, x, y);
    this.createAnimations(scene, spriteKey);
    this.sprite = scene.add.sprite(0, -53, spriteKey, 0);
    this.sprite.setDisplaySize(116, 116);
    this.add(this.sprite);
    scene.add.existing(this);
    this.idle();
  }

  private createAnimations(scene: Phaser.Scene, spriteKey: SpriteKey) {
    const keys = Object.fromEntries(
      Object.entries(ANIMATIONS).map(([name, key]) => [name, `${spriteKey}-${key}`]),
    ) as typeof ANIMATIONS;
    if (scene.anims.exists(keys.idle)) return;

    scene.anims.create({
      key: keys.idle,
      frames: scene.anims.generateFrameNumbers(spriteKey, { start: 0, end: 3 }),
      frameRate: T.animation.idleFps,
      repeat: -1,
    });
    scene.anims.create({
      key: keys.prepare,
      frames: scene.anims.generateFrameNumbers(spriteKey, { start: 4, end: 7 }),
      frameRate: T.animation.prepareFps,
      repeat: 0,
    });
    scene.anims.create({
      key: keys.swing,
      frames: scene.anims.generateFrameNumbers(spriteKey, { start: 8, end: 11 }),
      frameRate: T.animation.swingFps,
      repeat: 0,
    });
    scene.anims.create({
      key: keys.recover,
      frames: scene.anims.generateFrameNumbers(spriteKey, { start: 12, end: 15 }),
      frameRate: T.animation.recoverFps,
      repeat: 0,
    });
  }

  idle() {
    this.sprite.play(this.sprite.texture.key + "-" + ANIMATIONS.idle, true);
  }

  face(side: "left" | "right") {
    // The generated attack frames swing to the character's right by default.
    this.sprite.setFlipX(side === "right");
  }

  chop() {
    const prefix = this.sprite.texture.key;
    this.sprite.play(prefix + "-" + ANIMATIONS.prepare);
    this.sprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
      this.sprite.play(prefix + "-" + ANIMATIONS.swing);
      this.sprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
        this.sprite.play(prefix + "-" + ANIMATIONS.recover);
        this.sprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
          this.idle();
        });
      });
    });
  }
}
