/**
 * Example Test File
 *
 * Test framework API:
 * - describe(name, fn) - Group tests
 * - test(name, fn) - Define test
 * - expect(value) - Assertions
 * - server.connect(sender) - Change user context
 */

describe("Server", () => {
  test("ping returns pong", async (server) => {
    const result = await server.ping();
    expect(result).toBe("pong");
  });

  test("getMyAccount returns account", async (server) => {
    const result = await server.getMyAccount();
    expect(result).toBeTruthy();
  });

  test("connect changes user", async (server) => {
    server.connect({ account: "user-alice" });
    const account = await server.getMyAccount();
    expect(account).toBe("user-alice");
  });

  test("submitScore rejects invalid name", async (server) => {
    let threw = false;
    try {
      await server.submitScore("  ", 10);
    } catch (e) {
      threw = true;
    }
    expect(threw).toBe(true);
  });

  test("submitScore deduplicates by name (case-insensitive) and keeps highest", async (server) => {
    server.connect({ account: "user-bob" });

    const first = await server.submitScore("Alice", 10);
    expect(first.qualified).toBe(true);

    // Higher score with the same name → upgrade, no duplicate.
    const up = await server.submitScore("Alice", 20);
    expect(up.qualified).toBe(true);
    expect(up.leaderboard.length).toBe(1);
    expect(up.leaderboard[0].name).toBe("Alice");
    expect(up.leaderboard[0].score).toBe(20);

    // Lower score with the same name (different case) → keep 20, not qualified.
    const down = await server.submitScore("alice", 15);
    expect(down.qualified).toBe(false);
    const top = await server.getTopRankings();
    expect(top.length).toBe(1);
    expect(top[0].score).toBe(20);
  });

  test("submitScore appends new names, caps at 20, and rejects low scores", async (server) => {
    server.connect({ account: "user-carol" });
    for (let i = 1; i <= 20; i++) {
      await server.submitScore("P" + i, i * 10);
    }
    const top = await server.getTopRankings();
    expect(top.length).toBe(20);

    // A new name with a score below #20 does not qualify.
    const low = await server.submitScore("Loser", 1);
    expect(low.qualified).toBe(false);
    expect((await server.getTopRankings()).length).toBe(20);

    // A new name with a score above #20 qualifies and evicts the last entry.
    const high = await server.submitScore("Winner", 999);
    expect(high.qualified).toBe(true);
    const final = await server.getTopRankings();
    expect(final.length).toBe(20);
    expect(final[0].name).toBe("Winner");
    expect(final[0].score).toBe(999);
  });
});
