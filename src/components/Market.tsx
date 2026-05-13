import { useGame } from '../state/GameContext';
import { BUILDINGS, LANDMARKS, type CardColor } from '../data/cards';
import './Market.css';

const COLOR_CLASS: Record<CardColor, string> = {
  blue: 'card--blue',
  green: 'card--green',
  red: 'card--red',
  purple: 'card--purple',
};
const COLOR_GROUPS: { color: CardColor; label: string }[] = [
  { color: 'blue', label: '🟦 初级产业' },
  { color: 'green', label: '🟩 商业设施' },
  { color: 'red', label: '🟥 餐饮业' },
  { color: 'purple', label: '🟪 大型设施' },
];

const fmtAct = (a: number[]) => (a.length === 1 ? `${a[0]}` : `${a[0]}-${a[a.length - 1]}`);

export default function Market() {
  const { state, dispatch } = useGame();
  const { phase, players, active, supply } = state;
  const me = players[active];
  const buildPhase = phase === 'build';

  const canBuyBuilding = (id: string) => {
    if (!buildPhase) return false;
    const card = BUILDINGS.find((b) => b.id === id)!;
    if ((supply[id] ?? 0) <= 0) return false;
    if (me.coins < card.cost) return false;
    if (card.color === 'purple' && (me.buildings[id] ?? 0) >= 1) return false;
    return true;
  };
  const canBuyLandmark = (id: string) => {
    if (!buildPhase) return false;
    const lm = LANDMARKS.find((l) => l.id === id)!;
    if (me.landmarks[id]) return false;
    if (me.coins < lm.cost) return false;
    return true;
  };

  return (
    <div className="market">
      <div className="market__head">
        <h3>卡池</h3>
        {buildPhase && (
          <button className="market__skip" onClick={() => dispatch({ type: 'SKIP_BUILD' })}>
            跳过建造
          </button>
        )}
      </div>

      <section className="market__group">
        <h4>地标(本玩家专属)</h4>
        <div className="market__grid">
          {LANDMARKS.map((lm) => {
            const built = me.landmarks[lm.id];
            const enabled = canBuyLandmark(lm.id);
            return (
              <button
                key={lm.id}
                className={`card card--landmark ${built ? 'card--built' : ''}`}
                disabled={!enabled}
                onClick={() => dispatch({ type: 'BUY_LANDMARK', landmarkId: lm.id })}
                title={lm.description}
              >
                <div className="card__title">{lm.name}</div>
                <div className="card__desc">{lm.description}</div>
                <div className="card__cost">{built ? '已建成' : `${lm.cost} 币`}</div>
              </button>
            );
          })}
        </div>
      </section>

      {COLOR_GROUPS.map(({ color, label }) => (
        <section key={color} className="market__group">
          <h4>{label}</h4>
          <div className="market__grid">
            {BUILDINGS.filter((b) => b.color === color).map((b) => {
              const left = supply[b.id] ?? 0;
              const enabled = canBuyBuilding(b.id);
              return (
                <button
                  key={b.id}
                  className={`card ${COLOR_CLASS[b.color]}`}
                  disabled={!enabled}
                  onClick={() => dispatch({ type: 'BUY_BUILDING', cardId: b.id })}
                  title={b.description}
                >
                  <div className="card__act">{fmtAct(b.activation)}</div>
                  <div className="card__title">{b.name}</div>
                  <div className="card__desc">{b.description}</div>
                  <div className="card__bottom">
                    <span className="card__cost">{b.cost} 币</span>
                    <span className="card__supply">剩 {left}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
