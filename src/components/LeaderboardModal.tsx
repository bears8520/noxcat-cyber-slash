import React, { useEffect, useState } from "react";
import Text from "../locales/en.json";
import "./LeaderboardModal.css";

interface ScoreEntry {
  rank: number;
  name: string;
  score: number;
  date: string;
}

interface Props {
  connected: boolean;
  server: any;
  connect: () => Promise<any>;
  onClose: () => void;
}

const MEDALS = ["🥇", "🥈", "🥉"];

const LeaderboardModal: React.FC<Props> = ({ connected, server, connect, onClose }) => {
  const [topRanks, setTopRanks] = useState<ScoreEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        if (!connected) await connect();
        let top: ScoreEntry[] = [];
        try {
          top = (await server.remoteFunction("getTopRankings")) as ScoreEntry[];
        } catch (e) {
          const m = String(e?.message || "").toLowerCase();
          if (m.includes("disposed") || m.includes("closed")) {
            await connect();
            top = (await server.remoteFunction("getTopRankings")) as ScoreEntry[];
          } else {
            throw e;
          }
        }
        if (alive) setTopRanks(top || []);
      } catch (e) {
        // offline — leave the list empty
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [connected, server, connect]);

  return (
    <div className="lb-overlay">
      <div className="lb-panel">
        <div className="lb-header">
          <h2 className="lb-title">🏆 {Text.ui.leaderboard}</h2>
          <button className="lb-close" onClick={onClose} aria-label={Text.ui.close}>
            ✕
          </button>
        </div>

        {loading ? (
          <p className="lb-msg">{Text.ui.loading}</p>
        ) : !connected ? (
          <p className="lb-msg">{Text.ui.offline}</p>
        ) : topRanks.length === 0 ? (
          <p className="lb-msg">{Text.ui.noScores}</p>
        ) : (
          <div className="lb-list">
            {topRanks.map((entry, i) => (
              <div
                key={i}
                className={`lb-row ${i < 3 ? "lb-row-top" : ""} ${i % 2 ? "lb-row-alt" : ""}`}
              >
                <span className="lb-rank">{MEDALS[i] || i + 1}</span>
                <span className="lb-name">{entry.name}</span>
                <span className="lb-score">{entry.score.toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}

        <button className="lb-btn-close" onClick={onClose}>
          {Text.ui.close}
        </button>
      </div>
    </div>
  );
};

export default LeaderboardModal;
