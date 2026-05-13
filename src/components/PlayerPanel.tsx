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
          <span className="pp__act">{card.activation.length === 1 ? card.activation[0] : `${card.activation[0]}-${card.activation[card.activation.length - 1]}`}</span>
          <span className="pp__name">{card.name}</span>
          <span className="pp__count">×{n}</span>
        </li>
      ))}
    </ul>
  );
}

function LandmarkList({ player }: { player: PlayerState }) {
  return (
    <ul className="pp__landmarks">
      {LANDMARKS.map((lm) => {
        const built = player.landmarks[lm.id];
        return (
          <li key={lm.id} className={`pp__lm ${built ? 'pp__lm--built' : ''}`}>
            <span className="pp__lmName">{lm.name}</span>
            <span className="pp__lmCost">{built ? '✓' : `${lm.cost}币`}</span>
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
    <div className={`pp ${isActive ? 'pp--active' : ''}`}>
      <header className="pp__header">
        <h3>
          {player.name}
          {isActive && <span className="pp__badge">行动中</span>}
        </h3>
        <div className="pp__coins">💰 {player.coins}</div>
      </header>
      <section className="pp__section">
        <h4>地标</h4>
        <LandmarkList player={player} />
      </section>
      <section className="pp__section">
        <h4>建筑</h4>
        <BuildingList player={player} />
      </section>
    </div>
  );
}
