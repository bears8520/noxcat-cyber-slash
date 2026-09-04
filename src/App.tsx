import { useCallback, useRef, useState } from "react";
import { useGameServer } from "@agent8/gameserver";
import GameComponent from "./components/GameComponent";
import GameOverOverlay from "./components/GameOverOverlay";
import LeaderboardModal from "./components/LeaderboardModal";
import "./App.css";

function App() {
  const { connected, server, connect } = useGameServer();
  const gameRef = useRef<Phaser.Game | null>(null);
  const [phase, setPhase] = useState<"playing" | "gameover">("playing");
  const [finalScore, setFinalScore] = useState(0);
  const [reason, setReason] = useState<string>("branch");
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  const handleGameOver = useCallback((score: number, r: string) => {
    setFinalScore(score);
    setReason(r);
    setPhase("gameover");
  }, []);

  const handleRestart = useCallback(() => {
    setPhase("playing");
    const game = gameRef.current;
    if (game) {
      const scene = game.scene.getScene("TimbermanScene");
      scene?.scene.restart({ skipMenu: true });
    }
  }, []);

  const handleMenu = useCallback(() => {
    setPhase("playing");
    const game = gameRef.current;
    if (game) {
      const scene = game.scene.getScene("TimbermanScene");
      scene?.scene.restart({ skipMenu: false });
    }
  }, []);

  const handleShowLeaderboard = useCallback(() => setShowLeaderboard(true), []);
  const handleCloseLeaderboard = useCallback(() => setShowLeaderboard(false), []);

  return (
    <div className="app">
      <GameComponent
        gameRef={gameRef}
        onGameOver={handleGameOver}
        onShowLeaderboard={handleShowLeaderboard}
      />
      {phase === "gameover" && (
        <GameOverOverlay
          score={finalScore}
          reason={reason}
          connected={connected}
          server={server}
          connect={connect}
          onRestart={handleRestart}
          onMenu={handleMenu}
          onShowLeaderboard={handleShowLeaderboard}
        />
      )}
      {showLeaderboard && (
        <LeaderboardModal
          connected={connected}
          server={server}
          connect={connect}
          onClose={handleCloseLeaderboard}
        />
      )}
    </div>
  );
}

export default App;
