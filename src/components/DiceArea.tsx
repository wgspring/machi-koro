import { useGame } from '../state/GameContext';
import './DiceArea.css';

export default function DiceArea() {
  const { state, dispatch } = useGame();
  const { phase, lastRoll, players, active, rerollUsedThisTurn } = state;
  const me = players[active];
  const canTwoDice = me.landmarks.station;
  const canReroll = me.landmarks.radio_tower && phase === 'resolve' && !rerollUsedThisTurn;

  return (
    <div className="dice">
      <div className="dice__display">
        {lastRoll ? (
          <>
            <DieFace value={lastRoll.d1} />
            {lastRoll.count === 2 && <DieFace value={lastRoll.d2} />}
            <span className="dice__sum">
              = {lastRoll.sum}
              {lastRoll.isDouble && <em className="dice__double"> (豹子)</em>}
              {lastRoll.rerolled && <em className="dice__re"> (重投)</em>}
            </span>
          </>
        ) : (
          <span className="dice__placeholder">— 等待掷骰 —</span>
        )}
      </div>

      <div className="dice__actions">
        {phase === 'roll' && (
          <>
            <button onClick={() => dispatch({ type: 'ROLL', count: 1 })}>
              🎲 投 1 颗
            </button>
            {canTwoDice && (
              <button onClick={() => dispatch({ type: 'ROLL', count: 2 })}>
                🎲🎲 投 2 颗
              </button>
            )}
          </>
        )}
        {phase === 'resolve' && (
          <>
            {canReroll && (
              <button onClick={() => dispatch({ type: 'REROLL' })}>
                🔁 电波塔重投
              </button>
            )}
            <button className="primary" onClick={() => dispatch({ type: 'RESOLVE' })}>
              ✅ 结算收益
            </button>
          </>
        )}
        {phase === 'build' && (
          <span className="dice__hint">请选择要购买的卡牌,或点击"跳过建造"</span>
        )}
        {phase === 'gameover' && (
          <button className="primary" onClick={() => dispatch({ type: 'RESTART' })}>
            🔄 重新开始
          </button>
        )}
      </div>
    </div>
  );
}

const FACES = ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
function DieFace({ value }: { value: number }) {
  return <span className="dice__face">{FACES[value] ?? value}</span>;
}
