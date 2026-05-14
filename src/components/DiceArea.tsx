import { useState } from 'react';
import { useGame } from '../state/GameContext';
import { previewIncome, type IncomeItem } from '../data/engine';
import { IS_TEST_MODE } from '../data/testMode';
import './DiceArea.css';

const FACES = ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
function DieFace({ value }: { value: number }) {
  return <span className="dice__face">{FACES[value] ?? value}</span>;
}

const CAT_CLASS: Record<IncomeItem['category'], string> = {
  red: 'pv__item--red',
  blue: 'pv__item--blue',
  green: 'pv__item--green',
  'purple-coin': 'pv__item--purple',
  'purple-trade': 'pv__item--trade',
};

function PreviewPanel({
  side,
  playerName,
  items,
  delta,
}: {
  side: 'left' | 'right';
  playerName: string;
  items: IncomeItem[];
  delta: number;
}) {
  const sign = delta > 0 ? '+' : '';
  const cls =
    delta > 0 ? 'pv__delta pv__delta--up'
    : delta < 0 ? 'pv__delta pv__delta--down'
    : 'pv__delta';

  return (
    <div className={`pv pv--${side}`}>
      <div className="pv__head">
        <span className="pv__name">{playerName}</span>
        <span className={cls}>{sign}{delta} 币</span>
      </div>
      {items.length === 0 ? (
        <div className="pv__empty">本轮无收益</div>
      ) : (
        <ul className="pv__list">
          {items.map((it, idx) => (
            <li key={idx} className={`pv__item ${CAT_CLASS[it.category]}`}>
              <span className="pv__itemName">{it.cardName}</span>
              {it.delta !== 0 && (
                <span className="pv__itemDelta">
                  {it.delta > 0 ? '+' : ''}{it.delta}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function DiceArea() {
  const { state, dispatch } = useGame();
  const { phase, lastRoll, players, active, rerollUsedThisTurn } = state;
  const me = players[active];
  const canTwoDice = me.landmarks.station;
  const canReroll = me.landmarks.radio_tower && phase === 'resolve' && !rerollUsedThisTurn;

  const preview = previewIncome(state); // resolve 阶段才非空

  // ────────────── 测试模式:指定骰点 ──────────────
  const [forceD1, setForceD1] = useState<string>('');
  const [forceD2, setForceD2] = useState<string>('');
  const parseFace = (s: string): number | undefined => {
    if (!s.trim()) return undefined;
    const n = Number(s);
    return Number.isFinite(n) && n >= 1 && n <= 6 ? Math.floor(n) : undefined;
  };
  const buildForced = () => ({ d1: parseFace(forceD1), d2: parseFace(forceD2) });

  return (
    <div className="dice">
      {/* 三栏:左玩家预览 | 骰子主体 | 右玩家预览 */}
      <div className="dice__main">
        {preview ? (
          <PreviewPanel
            side="left"
            playerName={players[0].name}
            items={preview.items[0]}
            delta={preview.delta[0]}
          />
        ) : (
          <div className="pv pv--placeholder" />
        )}

        <div className="dice__center">
          <div className="dice__display">
            {lastRoll ? (
              <>
                <DieFace value={lastRoll.d1} />
                {lastRoll.count === 2 && <DieFace value={lastRoll.d2} />}
                <span className="dice__sum">
                  = {lastRoll.sum}
                  {lastRoll.isDouble && <em className="dice__double"> (豹子)</em>}
                  {lastRoll.rerolled && <em className="dice__re"> (重投)</em>}
                  {lastRoll.harborBoosted && <em className="dice__re"> (⚓+2)</em>}
                </span>
              </>
            ) : (
              <span className="dice__placeholder">— 等待掷骰 —</span>
            )}
          </div>

          <div className="dice__actions">
            {IS_TEST_MODE && phase === 'roll' && (
              <div className="dice__test">
                <span className="dice__testTag">🧪 测试</span>
                <label>
                  d1
                  <input
                    type="number"
                    min={1}
                    max={6}
                    placeholder="随机"
                    value={forceD1}
                    onChange={(e) => setForceD1(e.target.value)}
                  />
                </label>
                {canTwoDice && (
                  <label>
                    d2
                    <input
                      type="number"
                      min={1}
                      max={6}
                      placeholder="随机"
                      value={forceD2}
                      onChange={(e) => setForceD2(e.target.value)}
                    />
                  </label>
                )}
                {(forceD1 || forceD2) && (
                  <button
                    type="button"
                    className="dice__testClear"
                    onClick={() => { setForceD1(''); setForceD2(''); }}
                  >
                    清空
                  </button>
                )}
              </div>
            )}
            {phase === 'roll' && (
              <>
                <button onClick={() => dispatch({ type: 'ROLL', count: 1, forced: IS_TEST_MODE ? buildForced() : undefined })}>
                  🎲 投 1 颗
                </button>
                {canTwoDice && (
                  <button onClick={() => dispatch({ type: 'ROLL', count: 2, forced: IS_TEST_MODE ? buildForced() : undefined })}>
                    🎲🎲 投 2 颗
                  </button>
                )}
              </>
            )}
            {phase === 'pending-harbor' && (
              <>
                <span className="dice__hint">⚓ 港口:点数 ≥10,是否 +2?</span>
                <button
                  className="primary"
                  onClick={() => dispatch({ type: 'HARBOR_BOOST', accept: true })}
                >
                  ⚓ +2(变 {(lastRoll?.sum ?? 0) + 2})
                </button>
                <button onClick={() => dispatch({ type: 'HARBOR_BOOST', accept: false })}>
                  保持原点数
                </button>
              </>
            )}
            {phase === 'resolve' && (
              <>
                {canReroll && (
                  <button onClick={() => dispatch({ type: 'REROLL', forced: IS_TEST_MODE ? buildForced() : undefined })}>
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

        {preview ? (
          <PreviewPanel
            side="right"
            playerName={players[1].name}
            items={preview.items[1]}
            delta={preview.delta[1]}
          />
        ) : (
          <div className="pv pv--placeholder" />
        )}
      </div>

      {preview && preview.extraTurn && (
        <div className="dice__extra">🎡 游乐园触发:本回合结束后再行动一次</div>
      )}
    </div>
  );
}
