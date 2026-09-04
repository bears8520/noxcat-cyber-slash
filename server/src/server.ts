/**
 * Agent8 GameServer
 *
 * Install types: npm install -D @agent8/gameserver-node
 * Types are automatically available: $global, $sender, $room, $asset
 */

interface LeaderboardEntry {
  rank: number;
  name: string;
  score: number;
  date: string;
}

export class Server {
  async ping(): Promise<string> {
    return "pong";
  }

  async getMyAccount(): Promise<string> {
    return $sender.account;
  }

  /** Top 20 leaderboard from global shared state (sorted desc by score). */
  async getTopRankings(): Promise<LeaderboardEntry[]> {
    const state = await $global.getGlobalState();
    return (state.leaderboard || []) as LeaderboardEntry[];
  }

  /**
   * Submit a run to the global leaderboard with unique-name deduplication.
   * - If the (case-insensitive) name already exists, update it only when the
   *   new score is higher (otherwise keep the existing higher score).
   * - If the name is new, append it when the board has < 20 entries or the
   *   score beats the current #20.
   * Then re-sorts desc and truncates to the top 20.
   */
  async submitScore(
    name: string,
    score: number,
  ): Promise<{ qualified: boolean; leaderboard: LeaderboardEntry[] }> {
    const trimmedName = (typeof name === "string" ? name.trim() : "").slice(0, 12);
    if (!trimmedName) {
      throw new Error("Name is required.");
    }
    if (typeof score !== "number" || !isFinite(score) || score < 0) {
      throw new Error("Invalid score.");
    }

    return $lock("leaderboard", async () => {
      const state = await $global.getGlobalState();
      const board: LeaderboardEntry[] = (state.leaderboard || []).slice();

      let qualified = false;
      const idx = board.findIndex(
        (e) => e.name.toLowerCase() === trimmedName.toLowerCase(),
      );

      if (idx >= 0) {
        // Existing name — only upgrade if the new score is higher.
        if (score > board[idx].score) {
          board[idx] = {
            ...board[idx],
            score,
            date: new Date().toLocaleDateString(),
          };
          qualified = true;
        }
      } else {
        const last = board.length > 0 ? board[board.length - 1] : null;
        if (board.length < 20 || (last ? score > last.score : true)) {
          board.push({
            name: trimmedName,
            score,
            date: new Date().toLocaleDateString(),
          });
          qualified = true;
        }
      }

      if (!qualified) {
        return { qualified: false, leaderboard: board };
      }

      board.sort((a, b) => b.score - a.score);
      const top20 = board.slice(0, 20);
      top20.forEach((e, i) => (e.rank = i + 1));
      await $global.updateGlobalState({ leaderboard: top20 });
      return { qualified: true, leaderboard: top20 };
    });
  }
}
