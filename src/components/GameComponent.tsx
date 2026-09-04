import React, { useEffect, useRef } from "react";
import { createGame } from "../game/Game";

interface GameComponentProps {
  gameRef: React.MutableRefObject<Phaser.Game | null>;
  onGameOver?: (score: number, reason: string) => void;
  onShowLeaderboard?: () => void;
}

const GameComponent: React.FC<GameComponentProps> = ({
  gameRef,
  onGameOver,
  onShowLeaderboard,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current && !gameRef.current) {
      gameRef.current = createGame(containerRef.current.id, {
        onGameOver,
        onShowLeaderboard,
      });
    }

    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      id="phaser-game"
      ref={containerRef}
      style={{ width: "100%", height: "100vh" }}
    />
  );
};

export default GameComponent;
