import { useGame } from '../state/GameContext';
import { CATALOG } from '../data/engine';
import { LANDMARKS } from '../data/cards';
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
          <span className="pp__name">{card.name}</span>
          <span className="pp__count">×{n}</span>
        </li>
      ))}
    </ul>
  );
}

function LandmarkList({ player, isOwner }: { player: PlayerState; isOwner: boolean }) {
  const { state, dispatch } = useGame();
  const buildPhase = state.phase === 'build';
  return (
    <ul className="pp__landmarks">
      {LANDMARKS.map((lm) => {
        const built = player.landmarks[lm.id];
        const canBuy = isOwner && buildPhase && !built && player.coins >= lm.cost;
        const cls = [
          'pp__lm',
          built && 'pp__lm--built',
          canBuy && 'pp__lm--canbuy',
        ]
          .filter(Boolean)
          .join(' ');
        return (
          <li key={lm.id} className={cls}>
            <button
              type="button"
              className="pp__lmBtn"
              disabled={!canBuy}
              onClick={() => dispatch({ type: 'BUY_LANDMARK', landmarkId: lm.id })}
              title={lm.description}
            >
              <span className="pp__lmName">{lm.name}</span>
              <span className="pp__lmCost">
                {built ? '✓ 已建成' : `${lm.cost} 币`}
              </span>
              <span className="pp__lmDesc">{lm.description}</span>
              {canBuy && <span className="pp__lmHint">点击建造</span>}
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
