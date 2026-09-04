import { T } from "../scenes/tuning";

export interface CharacterProfile {
  id: string;
  name: string;
  unlockScore: number;
  kind: "cat";
  spriteKey: "catSword" | "catArmorSword" | "catTacticalSword" | "catHackerSword";
}

export const ROSTER: CharacterProfile[] = [
  { id: "mooncat", name: "NOXCAT", unlockScore: 0, kind: "cat", spriteKey: "catSword" },
  { id: "noxcat-armor", name: "NOXCAT Armor", unlockScore: T.unlocks.armorScore, kind: "cat", spriteKey: "catArmorSword" },
  { id: "noxcat-tactical", name: "NOXCAT Tactical", unlockScore: T.unlocks.tacticalScore, kind: "cat", spriteKey: "catTacticalSword" },
  { id: "noxcat-hacker", name: "NOXCAT Hacker", unlockScore: T.unlocks.hackerScore, kind: "cat", spriteKey: "catHackerSword" },
];

export function findCharacter(id: string): CharacterProfile {
  return ROSTER.find((c) => c.id === id) ?? ROSTER[0];
}

const KEY = "mooncat_grove_save_v1";

export interface SaveState {
  bestScore: number;
  unlocked: string[];
  selected: string;
}

function loadState(): SaveState {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const state = JSON.parse(raw);
      if (state && typeof state.bestScore === "number") return state;
    }
  } catch {}
  return { bestScore: 0, unlocked: ["mooncat"], selected: "mooncat" };
}

function persist(state: SaveState): void {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {}
}

export function getBestScore(): number { return loadState().bestScore; }
export function getSelectedId(): string { return loadState().selected; }
export function isUnlocked(profile: CharacterProfile): boolean {
  const state = loadState();
  return profile.unlockScore <= state.bestScore || state.unlocked.includes(profile.id);
}
export function selectCharacter(id: string): void {
  const state = loadState();
  state.selected = id;
  persist(state);
}
export function recordScore(score: number): void {
  const state = loadState();
  if (score > state.bestScore) state.bestScore = score;
  persist(state);
}
