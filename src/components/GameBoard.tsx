import { useEffect, useState } from 'react';
import { GameProvider, useGame } from '../state/GameContext';
import PlayerPanel from './PlayerPanel';
import DiceArea from './DiceArea';
import Market from './Market';
import LogPanel from './LogPanel';
import Rules from './Rules';
import Confetti from './Confetti';
import WinModal from './WinModal';
import ChoiceModal from './ChoiceModal';
import type { GameMode } from '../data/types';
import './GameBoard.css';

function PhaseHint() {
  const { state } = useGame();
  const me = state.players[state.active];
  if (state.phase === 'gameover') {
    const win = state.players[state.winner!];
    return <div className="phase phase--win">🏆 {win.name} 获胜!</div>;
  }
  // 优先提示等待选择
  if (state.pendingChoices && state.pendingChoices.length > 0) {
    const head = state.pendingChoices[0];
    const who = state.players[head.playerId].name;
    const kindLabel: Record<string, string> = {
      demolish: '🚧 拆迁公司:选择地标',
      moving: '🏢 搬家公司:选择卡牌',
      renovation: '🛠️ 装修公司:选择要装修的对手卡牌',
      exhibit: '🏟️ 会展中心:选择要激活的己方建筑',
      business_take: '🏢 商业中心:选择对手要换的卡',
      business_give: '🏢 商业中心:选择自己要换出的卡',
    };
    return (
      <div className="phase phase--wait">
        <strong>第 {state.turn} 回合</strong> · 等待 {who}{kindLabel[head.kind] ?? '做出选择'}
      </div>
    );
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
  const modeLabel =
    state.mode === 'harbor' ? '港口扩展'
    : state.mode === 'millionaire' ? '仅百万富翁扩展'
    : state.mode === 'all' ? '三合一(基础+港口+百万富翁)'
    : '基础版';

  // 胜利弹窗:游戏结束时打开,用户点 ✕ / "关闭" 才停;新一局或返回首页时复位
  const [winDismissed, setWinDismissed] = useState(false);
  useEffect(() => {
    // winner 从有变无(重开 / 切局)→ 复位
    if (state.winner === null) setWinDismissed(false);
  }, [state.winner]);

  const winnerOpen = state.winner !== null && !winDismissed;

  return (
    <div className={`board board--p${state.active}`}>
      <Confetti active={winnerOpen} winner={state.winner} />
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

      {winnerOpen && state.winner !== null && (
        <WinModal
          winnerId={state.winner}
          winnerName={state.players[state.winner].name}
          turn={state.turn}
          onRestart={() => {
            setWinDismissed(false);
            dispatch({ type: 'RESTART' });
          }}
          onClose={() => setWinDismissed(true)}
        />
      )}

      {/* 百万富翁扩展:resolve 阶段需玩家选择时弹出 */}
      <ChoiceModal />
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
