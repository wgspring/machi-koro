import { useGame } from '../state/GameContext';
import { CATALOG } from '../data/engine';
import { getLandmarks } from '../data/cards';
import { getLandmarkIcon } from '../data/cardIcons';
import { getLandmarkArt } from '../data/cardArt';
import { SYMBOL_META } from '../data/symbols';
import type { PlayerState } from '../data/types';
import './PlayerPanel.css';

const COLOR_CLASS = {
  blue: 'tag tag--blue',
  green: 'tag tag--green',
  red: 'tag tag--red',
  purple: 'tag tag--purple',
} as const;

function BuildingList({ player }: { player: PlayerState }) {
  const owned = Object.entries(player.buildings)
    .filter(([, n]) => n > 0)
    .map(([id, n]) => ({ id, n, card: CATALOG.byId[id] }))
    .filter((x) => x.card) // 防御:跨模式下未识别卡牌
    .sort((a, b) => a.card.activation[0] - b.card.activation[0]);

  if (!owned.length) return <div className="pp__empty">暂无建筑</div>;
  return (
    <ul className="pp__buildings">
      {owned.map(({ id, n, card }) => (
        <li key={id} className={COLOR_CLASS[card.color]}>
          <span className="pp__act">
            {card.activation.length === 1
              ? card.activation[0]
              : `${card.activation[0]}-${card.activation[card.activation.length - 1]}`}
          </span>
          <span
            className="pp__icon"
            aria-label={SYMBOL_META[card.symbol].label}
            title={SYMBOL_META[card.symbol].label}
          >
            {SYMBOL_META[card.symbol].emoji}
          </span>
          <span className="pp__name">{card.name}</span>
          {card.color !== 'purple' && n > 1 && <span className="pp__count">×{n}</span>}
        </li>
      ))}
    </ul>
  );
}

function LandmarkList({ player, isOwner }: { player: PlayerState; isOwner: boolean }) {
  const { state, dispatch } = useGame();
  const buildPhase = state.phase === 'build';
  const landmarks = getLandmarks(state.mode);
  // 把"默认建成的"地标排在最前(始终显示为已建成,不可点击)
  const sorted = [...landmarks].sort((a, b) => {
    const av = a.builtByDefault ? 0 : 1;
    const bv = b.builtByDefault ? 0 : 1;
    if (av !== bv) return av - bv;
    return a.cost - b.cost;
  });
  return (
    <ul className="pp__landmarks">
      {sorted.map((lm) => {
        const built = player.landmarks[lm.id];
        const canBuy =
          isOwner && buildPhase && !built && !lm.builtByDefault && player.coins >= lm.cost;
        const cls = [
          'pp__lm',
          built && 'pp__lm--built',
          canBuy && 'pp__lm--canbuy',
          lm.mode === 'harbor' && 'pp__lm--harbor',
          lm.builtByDefault && 'pp__lm--default',
        ]
          .filter(Boolean)
          .join(' ');
        const art = getLandmarkArt(lm.id);
        const showCost = !lm.builtByDefault;
        const costLabel = built ? '✓ 已建成' : `${lm.cost} 币`;
        return (
          <li key={lm.id} className={cls}>
            <button
              type="button"
              className="pp__lmBtn"
              disabled={!canBuy}
              onClick={() => dispatch({ type: 'BUY_LANDMARK', landmarkId: lm.id })}
              title={lm.description}
              style={art ? { ['--lm-art' as string]: `url("${art}")` } : undefined}
            >
              <span className="pp__lmName">
                <span className="pp__lmIcon" aria-hidden>{getLandmarkIcon(lm.id)}</span>
                {lm.name}
                {canBuy && <span className="pp__lmHint">点击建造</span>}
              </span>
              {showCost && <span className="pp__lmCost">{costLabel}</span>}
              <span className="pp__lmDesc">{lm.description}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export default function PlayerPanel({ playerId }: { playerId: 0 | 1 }) {
  const { state } = useGame();
  const player = state.players[playerId];
  const isActive = state.active === playerId && state.phase !== 'gameover';

  return (
    <div className={`pp pp--p${playerId} ${isActive ? 'pp--active' : ''}`}>
      <header className="pp__header">
        <h3>
          {player.name}
          {isActive && <span className="pp__badge">行动中</span>}
        </h3>
        <div className="pp__coins">💰 {player.coins}</div>
      </header>
      <section className="pp__section">
        <h4>地标</h4>
        <LandmarkList player={player} isOwner={isActive} />
      </section>
      <section className="pp__section pp__section--scroll">
        <h4>建筑</h4>
        <BuildingList player={player} />
      </section>
    </div>
  );
}
