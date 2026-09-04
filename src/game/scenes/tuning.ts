const DebugPanel = (window as any).DebugPanel ?? {
  // Local Vite runs without the platform-injected tuning panel.
  define: (schema: Record<string, any>) => {
    const resolve = (node: Record<string, any>): Record<string, any> =>
      Object.fromEntries(
        Object.entries(node)
          .filter(([key]) => key !== "_label")
          .map(([key, value]) => [
            key,
            value && typeof value === "object" && "value" in value ? value.value : resolve(value),
          ]),
      );
    return resolve(schema);
  },
};

/* TUNABLES CONTRACT — read before editing this file.
   1. Every gameplay/UI constant lives in the DebugPanel.define schema below. Never inline new literals.
   2. Tuning requests and [TUNING] pastes edit these defaults ONLY — never restructure other code.
   3. The panel library is platform-injected; never add a local copy or a script tag for it.
   4. New feature => add its constants to the schema; the panel picks them up automatically. */
export const T = DebugPanel.define({
  player: {
    _label: "Player",
    gap: { value: 6, min: -40, max: 90, label: "Gap from trunk (px)", restart: true },
    lift: { value: 0, min: -80, max: 120, label: "Vertical nudge (px)", restart: true },
    scale: { value: 1.3, min: 0.7, max: 2, step: 0.1, label: "Character size multiplier", restart: true },
  },
  animation: {
    _label: "Cat Sword Animation",
    idleFps: { value: 6, min: 1, max: 18, step: 1, label: "Idle animation speed (fps)" },
    prepareFps: { value: 12, min: 1, max: 24, step: 1, label: "Sword preparation speed (fps)" },
    swingFps: { value: 18, min: 1, max: 30, step: 1, label: "Sword swing speed (fps)" },
    recoverFps: { value: 12, min: 1, max: 24, step: 1, label: "Sword recovery speed (fps)" },
  },
  unlocks: {
    _label: "Character Unlocks",
    armorScore: { value: 50, min: 0, max: 1000, step: 10, label: "NOXCAT Armor unlock score", restart: true },
    tacticalScore: { value: 150, min: 0, max: 1000, step: 10, label: "NOXCAT Tactical unlock score", restart: true },
    hackerScore: { value: 300, min: 0, max: 1000, step: 10, label: "NOXCAT Hacker unlock score", restart: true },
  },
  tree: {
    _label: "Tree",
    trunkWidth: { value: 190, min: 120, max: 340, label: "Trunk width (px)", restart: true },
    segmentHeight: { value: 100, min: 60, max: 160, label: "Segment height (px)", restart: true },
    hazardLow: { value: 0.5, min: 0, max: 1, step: 0.05, label: "Hazard rate (score 0-30)" },
    hazardMid: { value: 0.7, min: 0, max: 1, step: 0.05, label: "Hazard rate (score 31-80)" },
    hazardHigh: { value: 0.85, min: 0, max: 1, step: 0.05, label: "Hazard rate (score 81+)" },
    maxSafeStreak: { value: 2, min: 1, max: 5, step: 1, label: "Max consecutive safe blocks" },
    maxSideStreak: { value: 3, min: 1, max: 6, step: 1, label: "Max same-side hazards" },
    dropMs: { value: 90, min: 20, max: 300, label: "Drop animation (ms)" },
    stackGlow: { value: 0.35, min: 0.1, max: 1, step: 0.05, label: "Central block glow intensity", restart: true },
  },
  time: {
    _label: "Time Bar",
    max: { value: 100, min: 40, max: 200, label: "Max time" },
    drain: { value: 10, min: 2, max: 40, label: "Drain per sec (warm-up)" },
    replenish: { value: 8, min: 1, max: 30, label: "Replenish per chop (warm-up)" },
    drainMid: { value: 1.5, min: 1, max: 4, step: 0.1, label: "Drain multiplier (score 31-80)" },
    drainHigh: { value: 2.2, min: 1, max: 6, step: 0.1, label: "Drain multiplier (score 81+)" },
    replenishHigh: { value: 0.7, min: 0.3, max: 1, step: 0.05, label: "Replenish factor (score 81+)" },
    lowTimePct: { value: 0.3, min: 0.1, max: 0.5, step: 0.05, label: "Low-time warning threshold" },
  },
  audio: {
    _label: "Audio",
    volume: { value: 0.7, min: 0, max: 1, step: 0.05, label: "Master volume" },
  },
  ui: {
    _label: "Buttons",
    btnW: { value: 110, min: 60, max: 200, label: "Button width (px)" },
    btnH: { value: 110, min: 60, max: 200, label: "Button height (px)" },
    btnInset: { value: 26, min: 0, max: 200, label: "Button inset from edge (px)" },
    btnLift: { value: 0, min: -320, max: 320, label: "Button vertical offset (px)" },
    logoX: { value: 18, min: 0, max: 100, label: "Logo left position (px)" },
    logoY: { value: 18, min: 0, max: 100, label: "Logo top position (px)" },
    logoW: { value: 132, min: 60, max: 220, label: "Logo width (px)" },
    logoH: { value: 34, min: 20, max: 80, label: "Logo height (px)" },
    arrowColor: { value: "#ffffff", label: "Character arrow color" },
    resultW: { value: 460, min: 320, max: 620, label: "Result panel width (px)", cssVar: "--result-w", unit: "px" },
    resultScoreSize: { value: 64, min: 40, max: 96, label: "Result score size (px)", cssVar: "--result-score-size", unit: "px" },
    resultButtonH: { value: 52, min: 40, max: 72, label: "Result button height (px)", cssVar: "--result-button-h", unit: "px" },
  },
});

// internal constants — a builder would not plausibly ask about these
export const DEPTH = {
  far: 1,
  mid: 2,
  near: 3,
  ground: 5,
  trunk: 10,
  player: 50,
  hud: 1000,
} as const;

export const FONT_PLAYFUL =
  '"Chalkboard SE", "Comic Sans MS", "Arial Rounded MT Bold", "Trebuchet MS", sans-serif';

// Layout constants. Ground sits above the bottom touch buttons.
export const GROUND_MARGIN = 150;

// Target height (px) every character is normalized to so gameplay is fair.
export const TARGET_CHARACTER_HEIGHT = 85;

// Moonlit grove palette, cycled through the trunk segments.
export const BLOCK_COLORS = [0x00ffc8, 0x9b5cff, 0x22ff66, 0xff4dff] as const;

export type BranchSide = "none" | "left" | "right";

export interface SegmentData {
  branch: BranchSide;
  colorIndex: number;
}

export interface SceneHandlers {
  onGameOver?: (score: number, reason: string) => void;
  onShowLeaderboard?: () => void;
}

export function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function lighten(hex: number, amount = 46): number {
  const r = Math.min(255, ((hex >> 16) & 0xff) + amount);
  const g = Math.min(255, ((hex >> 8) & 0xff) + amount);
  const b = Math.min(255, (hex & 0xff) + amount);
  return (r << 16) | (g << 8) | b;
}
