import { useState } from 'react';
import { GameProvider, useGame } from '../state/GameContext';
import PlayerPanel from './PlayerPanel';
import DiceArea from './DiceArea';
import Market from './Market';
import LogPanel from './LogPanel';
import Rules from './Rules';
import type { GameMode } from '../data/types';
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
      : state.phase === 'pending-harbor'
      ? '⚓ 港口加成:是否给点数 +2?'
      : state.phase === 'resolve'
      ? '点击"结算收益"应用本轮效果'
      : '请购买建筑/地标,或跳过';
  return (
    <div className="phase">
      <strong>第 {state.turn} 回合 · {me.name}</strong> · {hint}
    </div>
  );
}

function GameBoardInner({
  onShowRules,
  onBackToStart,
}: {
  onShowRules: () => void;
  onBackToStart: () => void;
}) {
  const { state, dispatch } = useGame();
  const modeLabel = state.mode === 'harbor' ? 'Bright Lights 合订版' : '基础版';
  return (
    <div className={`board board--p${state.active}`}>
      <header className="board__top">
        <h1>
          骰子街 · Machi Koro
          <span className="board__modeBadge">{modeLabel}</span>
        </h1>
        <PhaseHint />
        <div className="board__topActions">
          <button onClick={onShowRules}>📖 规则</button>
          <button onClick={() => dispatch({ type: 'RESTART' })}>🔄 重开</button>
          <button onClick={onBackToStart}>🏠 返回首页</button>
        </div>
      </header>

      <div className="board__body">
        <aside className="board__side board__side--left">
          <PlayerPanel playerId={0} />
        </aside>

        <main className="board__center">
          <div className="board__dice">
            <DiceArea />
          </div>
          <div className="board__market">
            <Market />
          </div>
          <div className="board__log">
            <LogPanel />
          </div>
        </main>

        <aside className="board__side board__side--right">
          <PlayerPanel playerId={1} />
        </aside>
      </div>
    </div>
  );
}

export default function GameBoard({
  mode,
  onBackToStart,
}: {
  mode: GameMode;
  onBackToStart: () => void;
}) {
  const [showRules, setShowRules] = useState(false);
  // key={mode} 确保切换模式时 GameProvider 重新挂载,初始 state 用新 mode
  return (
    <GameProvider mode={mode} key={mode}>
      <GameBoardInner
        onShowRules={() => setShowRules(true)}
        onBackToStart={onBackToStart}
      />
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
