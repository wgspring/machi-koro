import { useState } from 'react';
import { GameProvider, useGame } from '../state/GameContext';
import PlayerPanel from './PlayerPanel';
import DiceArea from './DiceArea';
import Market from './Market';
import LogPanel from './LogPanel';
import Rules from './Rules';
import './GameBoard.css';

function PhaseHint() {
  const { state } = useGame();
  const me = state.players[state.active];
  if (state.phase === 'gameover') {
    const win = state.players[state.winner!];
    return <div className="phase phase--win">🏆 {win.name} 获胜!</div>;
  }
  const hint =
    state.phase === 'roll'
      ? '请掷骰子'
      : state.phase === 'resolve'
      ? '点击"结算收益"应用本轮效果'
      : '请购买建筑/地标,或跳过';
  return (
    <div className="phase">
      <strong>第 {state.turn} 回合 · {me.name}</strong> · {hint}
    </div>
  );
}

function GameBoardInner({ onShowRules }: { onShowRules: () => void }) {
  const { dispatch } = useGame();
  return (
    <div className="board">
      <header className="board__top">
        <h1>骰子街 · Machi Koro</h1>
        <div className="board__topActions">
          <button onClick={onShowRules}>📖 规则</button>
          <button onClick={() => dispatch({ type: 'RESTART' })}>🔄 重开</button>
        </div>
      </header>

      <PhaseHint />

      <div className="board__players">
        <PlayerPanel playerId={0} />
        <PlayerPanel playerId={1} />
      </div>

      <DiceArea />

      <div className="board__main">
        <div className="board__market">
          <Market />
        </div>
        <div className="board__log">
          <LogPanel />
        </div>
      </div>
    </div>
  );
}

export default function GameBoard() {
  const [showRules, setShowRules] = useState(false);
  return (
    <GameProvider>
      <GameBoardInner onShowRules={() => setShowRules(true)} />
      {showRules && (
        <div className="modal" onClick={() => setShowRules(false)}>
          <div className="modal__inner" onClick={(e) => e.stopPropagation()}>
            <button className="modal__close" onClick={() => setShowRules(false)}>✕</button>
            <Rules />
          </div>
        </div>
      )}
    </GameProvider>
  );
}
