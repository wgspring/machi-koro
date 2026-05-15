import { useGame } from '../state/GameContext';
import { getBuildings, MARKET_DISPLAY_KINDS, usesUnifiedMarket, type BuildingCard, type CardColor } from '../data/cards';
import { getBuildingArt } from '../data/cardArt';
import { marketDisplayIds } from '../data/engine';
import { SYMBOL_META } from '../data/symbols';
import './Market.css';

const COLOR_CLASS: Record<CardColor, string> = {
  blue: 'card--blue',
  green: 'card--green',
  red: 'card--red',
  purple: 'card--purple',
};

const COLOR_ORDER: Record<CardColor, number> = { blue: 0, green: 1, red: 2, purple: 3 };

interface GroupSeg {
  color: CardColor;
  label: string;
  span: number;
}
interface RowDef {
  segments: GroupSeg[];
}

/** 基础版:全部 15 种始终展示,按颜色分行 */
const ROWS_BASE: RowDef[] = [
  { segments: [{ color: 'blue', label: '🟦 初级产业', span: 5 }] },
  { segments: [{ color: 'green', label: '🟩 商业设施', span: 5 }] },
  {
    segments: [
      { color: 'red', label: '🟥 餐饮业', span: 2 },
      { color: 'purple', label: '🟪 大型设施', span: 3 },
    ],
  },
];

const fmtAct = (a: number[]) =>
  a.length === 1 ? `${a[0]}` : `${a[0]}-${a[a.length - 1]}`;

export default function Market() {
  const { state, dispatch } = useGame();
  const { phase, players, active, supply, mode, market } = state;
  const me = players[active];
  const buildPhase = phase === 'build';
  const allCards = getBuildings(mode);
  const cardById = (id: string) => allCards.find((c) => c.id === id);
  // 本回合新补到市场的卡 id(用于"闪光"动效);base 模式不会出现新补卡
  const freshSet = new Set(market?.freshIds ?? []);

  const canBuyBuilding = (id: string) => {
    if (!buildPhase) return false;
    const card = cardById(id);
    if (!card) return false;
    if ((supply[id] ?? 0) <= 0) return false;
    if (me.coins < card.cost) return false;
    if (card.color === 'purple' && (me.buildings[id] ?? 0) >= 1) return false;
    if (state.renovationLockedKind === id) return false;
    return true;
  };

  const renderCard = (b: BuildingCard) => {
    const left = supply[b.id] ?? 0;
    const enabled = canBuyBuilding(b.id);
    const harborWarn = b.requiresHarbor && !me.landmarks.harbor;
    const renovLocked = state.renovationLockedKind === b.id;
    const isFresh = freshSet.has(b.id);
    const art = getBuildingArt(b.id);
    const sym = SYMBOL_META[b.symbol];
    return (
      <button
        key={b.id}
        className={`card ${COLOR_CLASS[b.color]} ${harborWarn ? 'card--needHarbor' : ''} ${isFresh ? 'card--fresh' : ''} ${renovLocked ? 'card--locked' : ''}`}
        disabled={!enabled}
        onClick={() => dispatch({ type: 'BUY_BUILDING', cardId: b.id })}
        title={renovLocked
          ? `🛠️ 装修公司全场锁定 · 暂不可购买`
          : `${sym.label} · ${b.description}${isFresh ? ' · 新补卡' : ''}`}
        style={art ? { ['--card-art' as string]: `url("${art}")` } : undefined}
      >
        <div className="card__top">
          <div className="card__head">
            <span className="card__icon" aria-label={sym.label} title={sym.label}>{sym.emoji}</span>
            <span className="card__title">{b.name}</span>
            <span className="card__act">{fmtAct(b.activation)}</span>
          </div>
          <div className="card__desc">{b.description}</div>
          {(b.mode === 'harbor' || b.mode === 'millionaire' || b.requiresHarbor || renovLocked) && (
            <div className="card__tags">
              {b.requiresHarbor && (
                <span className="card__needHarbor">⚓ 需港口</span>
              )}
              {b.mode === 'harbor' && (
                <span className="card__modeBadge" title="Bright Lights 合订版">港扩</span>
              )}
              {b.mode === 'millionaire' && (
                <span className="card__modeBadge card__modeBadge--mil" title="百万富翁扩展">百扩</span>
              )}
              {renovLocked && (
                <span className="card__modeBadge card__modeBadge--lock" title="装修公司全场锁定">🛠️ 装修锁定</span>
              )}
            </div>
          )}
        </div>
        <div className="card__bottom">
          <span className="card__cost">{b.cost} 币</span>
          <span className="card__supply">剩 {left} 张</span>
        </div>
      </button>
    );
  };

  /* ----------- 统一市场(harbor / millionaire / all):10 种共享市场 ------------- */
  if (usesUnifiedMarket(mode)) {
    const ids = marketDisplayIds(state) as string[];
    const remaining = market ? market.deck.length : 0;
    const titleSuffix =
      mode === 'harbor' ? 'Bright Lights 合订版'
      : mode === 'millionaire' ? '仅百万富翁扩展'
      : '三合一(基础+港口+百万富翁)';
    // 按颜色 + 触发点排序,稳定布局
    const cards = ids
      .map(cardById)
      .filter((c): c is BuildingCard => !!c)
      .sort((a, b) => {
        const co = COLOR_ORDER[a.color] - COLOR_ORDER[b.color];
        if (co !== 0) return co;
        return a.activation[0] - b.activation[0];
      });
    // 5 列 × 2 行 布局
    const cols = 5;
    return (
      <div className="market">
        <div className="market__head">
          <h3>市场 · {titleSuffix}</h3>
          <span className="market__deckMeta">
            场上 {ids.length}/{MARKET_DISPLAY_KINDS} 种 · 牌库剩 {remaining} 张
          </span>
          {buildPhase && (
            <button className="market__skip" onClick={() => dispatch({ type: 'SKIP_BUILD' })}>
              跳过建造
            </button>
          )}
        </div>
        <div className="market__scroll">
          <div
            className="market__grid market__grid--harbor"
            style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
          >
            {cards.map(renderCard)}
            {Array.from({ length: Math.max(0, MARKET_DISPLAY_KINDS - cards.length) }).map((_, i) => (
              <div key={`ph-${i}`} className="card card--empty">
                <span className="card__placeholder">— 牌库已空 —</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ----------- 基础版:全部 15 张始终展示 ------------- */
  const cols = 5;
  return (
    <div className="market">
      <div className="market__head">
        <h3>卡池 · 基础版</h3>
        {buildPhase && (
          <button className="market__skip" onClick={() => dispatch({ type: 'SKIP_BUILD' })}>
            跳过建造
          </button>
        )}
      </div>

      <div className="market__scroll">
        {ROWS_BASE.map((row, idx) => (
          <section key={idx} className="market__row">
            <div
              className="market__titles"
              style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
            >
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
            <div
              className="market__grid market__grid--base"
              style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
            >
              {row.segments.flatMap((seg) =>
                allCards
                  .filter((b) => b.color === seg.color)
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
