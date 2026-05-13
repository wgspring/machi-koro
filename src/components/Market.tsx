import { useGame } from '../state/GameContext';
import { BUILDINGS, type CardColor } from '../data/cards';
import { getBuildingIcon } from '../data/cardIcons';
import './Market.css';

const COLOR_CLASS: Record<CardColor, string> = {
  blue: 'card--blue',
  green: 'card--green',
  red: 'card--red',
  purple: 'card--purple',
};

/** 一个分组(占据若干列):颜色 + 标题 + 跨列数 */
interface GroupSeg {
  color: CardColor;
  label: string;
  span: number; // 占多少列
}

/** 卡池行配置:每行展示一个或多个分组 */
interface RowDef {
  segments: GroupSeg[];
}
const ROWS: RowDef[] = [
  { segments: [{ color: 'blue', label: '🟦 初级产业', span: 5 }] },
  { segments: [{ color: 'green', label: '🟩 商业设施', span: 5 }] },
  {
    segments: [
      { color: 'red', label: '🟥 餐饮业', span: 2 },
      { color: 'purple', label: '🟪 大型设施', span: 3 },
    ],
  },
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

  const renderCard = (b: (typeof BUILDINGS)[number]) => {
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
        <div className="card__head">
          <span className="card__icon" aria-hidden>{getBuildingIcon(b.id)}</span>
          <span className="card__title">{b.name}</span>
        </div>
        <div className="card__desc">{b.description}</div>
        <div className="card__bottom">
          <span className="card__cost">{b.cost} 币</span>
          <span className="card__supply">剩 {left}</span>
        </div>
      </button>
    );
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

      <div className="market__scroll">
        {ROWS.map((row, idx) => (
          <section key={idx} className="market__row">
            {/* 标题行:与卡片网格使用同样的 5 列布局,标题按 span 跨列 */}
            <div className="market__titles">
              {row.segments.map((seg) => (
                <h4
                  key={seg.color}
                  className="market__title"
                  style={{ gridColumn: `span ${seg.span}` }}
                >
                  {seg.label}
                </h4>
              ))}
            </div>
            {/* 卡片行:固定 5 列,按 segments 顺序铺卡 */}
            <div className="market__grid">
              {row.segments.flatMap((seg) =>
                BUILDINGS.filter((b) => b.color === seg.color)
                  .sort((a, b) => a.activation[0] - b.activation[0])
                  .map(renderCard),
              )}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
