import React, { useEffect, useState } from "react";
import Text from "../locales/en.json";
import "./GameOverOverlay.css";

interface ScoreEntry {
  rank: number;
  name: string;
  score: number;
  date: string;
}

interface GameOverOverlayProps {
  score: number;
  reason: string;
  connected: boolean;
  server: any;
  connect: () => Promise<any>;
  onRestart: () => void;
  onMenu: () => void;
  onShowLeaderboard: () => void;
}

function isConnectionGone(e: any): boolean {
  const m = String(e?.message || e || "").toLowerCase();
  return m.includes("isolate is disposed") || m.includes("disposed") || m.includes("closed");
}

const NAME_KEY = "lastPlayerName";

function getStoredName(): string {
  try {
    const storedName = localStorage.getItem(NAME_KEY) || "";
    return !storedName || storedName === "Mooncat" ? Text.ui.defaultName : storedName;
  } catch {
    return Text.ui.defaultName;
  }
}

function setStoredName(name: string): void {
  try {
    localStorage.setItem(NAME_KEY, name);
  } catch {}
}

async function fetchLeaderboard(
  server: any,
  connect: () => Promise<any>,
): Promise<ScoreEntry[] | null> {
  try {
    return (await server.remoteFunction("getTopRankings")) as ScoreEntry[];
  } catch (e) {
    // Long-idle sessions drop the server isolate — reconnect once and retry.
    if (isConnectionGone(e)) {
      try {
        await connect();
        return (await server.remoteFunction("getTopRankings")) as ScoreEntry[];
      } catch {
        return null;
      }
    }
    return null;
  }
}

const GameOverOverlay: React.FC<GameOverOverlayProps> = ({
  score,
  reason,
  connected,
  server,
  connect,
  onRestart,
  onMenu,
  onShowLeaderboard,
}) => {
  const [qualified, setQualified] = useState(false);
  const [loading, setLoading] = useState(true);
  const [nickname, setNickname] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [fetchFailed, setFetchFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        if (!connected) await connect();
        const board = await fetchLeaderboard(server, connect);
        if (!alive) return;
        if (board) {
          // Pure score-based qualification — independent of any cached identity.
          setQualified(board.length < 20 || score > (board[board.length - 1]?.score ?? 0));
           setNickname(getStoredName());
          setFetchFailed(false);
        } else {
          setFetchFailed(true);
        }
      } catch {
        if (alive) setFetchFailed(true);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [connected, server, connect, score]);

  const handleSubmit = async () => {
    const finalName = nickname.trim() || Text.ui.defaultName;
    setSubmitting(true);
    setError("");
    try {
      try {
        await server.remoteFunction("submitScore", [finalName, score]);
      } catch (e) {
        if (isConnectionGone(e)) {
          await connect();
          await server.remoteFunction("submitScore", [finalName, score]);
        } else {
          throw e;
        }
      }
      setStoredName(finalName);
      setSubmitted(true);
      onShowLeaderboard();
    } catch (e: any) {
      setError(e?.message || Text.ui.submitFailed);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="gmo-overlay gmo-overlay-v2">
      <div className="gmo-panel gmo-panel-v2">
        <div className="gmo-header">
          <div>
            <p className="gmo-kicker">{Text.ui.runComplete}</p>
            <h1 className="gmo-title">{Text.ui.gameOver}</h1>
          </div>
          <div className="gmo-status-dot" aria-hidden="true" />
        </div>
        <p className="gmo-reason">
          {reason === "timeout" ? Text.ui.timeUp : Text.ui.branchHit}
        </p>

        <div className="gmo-scorebox">
          <div className="gmo-scorelabel">{Text.ui.finalScore}</div>
          <div className="gmo-score">{score.toLocaleString()}</div>
          <div className="gmo-scoreline">{Text.ui.scoreRecorded}</div>
        </div>

        {!connected && loading ? (
          <p className="gmo-offline">{Text.ui.connecting}</p>
        ) : fetchFailed ? (
          <p className="gmo-offline">{Text.ui.offline}</p>
        ) : loading ? null : qualified && !submitted ? (
          <div>
            <div className="gmo-newhigh">{Text.ui.newHighScore}</div>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder={Text.ui.enterName}
              maxLength={12}
              className="gmo-input"
            />
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="gmo-btn gmo-btn-submit"
            >
              {submitting ? Text.ui.submitting : Text.ui.submit}
            </button>
            {error && <p className="gmo-error">{error}</p>}
          </div>
        ) : submitted ? (
          <p className="gmo-submitted">{Text.ui.scoreSaved}</p>
        ) : (
          <p className="gmo-nothigher">{Text.ui.notTop20}</p>
        )}

        <div className="gmo-actions">
          <button onClick={onRestart} className="gmo-btn gmo-btn-play">
            {Text.ui.playAgain}
          </button>
          <button onClick={onShowLeaderboard} className="gmo-btn gmo-btn-lb">
            🏆 {Text.ui.leaderboard}
          </button>
          <button onClick={onMenu} className="gmo-btn gmo-btn-menu">
            {Text.ui.mainMenu}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameOverOverlay;
