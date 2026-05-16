import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
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

const fmtAct = (a: number[]) =>
  a.length === 1 ? `${a[0]}` : `${a[0]}-${a[a.length - 1]}`;

interface HoverState {
  id: string;
  /** li 的 right 坐标(用于默认右侧锚定) */
  x: number;
  /** li 的 top 坐标 */
  y: number;
  /** li 的 left 坐标(用于"放不下时翻到左侧") */
  leftX: number;
}

function BuildingList({ player }: { player: PlayerState }) {
  const [hover, setHover] = useState<HoverState | null>(null);
  const tipRef = useRef<HTMLDivElement | null>(null);

  const owned = Object.entries(player.buildings)
    .filter(([, n]) => n > 0)
    .map(([id, n]) => ({ id, n, card: CATALOG.byId[id] }))
    .filter((x) => x.card) // 防御:跨模式下未识别卡牌
    .sort((a, b) => a.card.activation[0] - b.card.activation[0]);

  const hoverCard = hover ? CATALOG.byId[hover.id] : null;
  // 文本气泡尺寸估算
  const tipMaxW = 220;
  // 默认放在 li 右侧;若右侧放不下则放在 li 左侧
  let tx = 0;
  let ty = 0;
  let placeLeft = false;
  if (hover) {
    const rightX = hover.x + 8;
    const fitsRight = rightX + tipMaxW + 8 <= window.innerWidth;
    if (fitsRight) {
      tx = rightX;
    } else {
      placeLeft = true;
      // 占位:渲染后由 useEffect 用真实宽度修正
      tx = Math.max(8, hover.leftX - tipMaxW - 8);
    }
    ty = Math.max(8, hover.y - 4);
  }

  // 通过 li 元素自身的 boundingRect 计算坐标,避免任何祖先 transform/坐标系问题
  const handleHover = (id: string, target: HTMLElement) => {
    const rect = target.getBoundingClientRect();
    setHover({ id, x: rect.right, y: rect.top, leftX: rect.left });
  };

  // 渲染后:命令式强制位置,且左侧模式按真实宽度精确贴近 li
  useEffect(() => {
    const el = tipRef.current;
    if (!el || !hover) return;
    let left = tx;
    if (placeLeft) {
      const realW = el.offsetWidth;
      left = Math.max(8, hover.leftX - realW - 8);
    }
    el.style.setProperty('left', `${left}px`, 'important');
    el.style.setProperty('top', `${ty}px`, 'important');
    el.style.setProperty('right', 'auto', 'important');
    el.style.setProperty('bottom', 'auto', 'important');
    el.style.setProperty('transform', 'none', 'important');
  }, [hover, tx, ty, placeLeft]);

  // 当持有列表变化(如拆迁/搬家导致某张卡消失)时,若当前 hover 的卡已不存在,清掉 hover
  useEffect(() => {
    if (hover && !owned.some((o) => o.id === hover.id)) {
      setHover(null);
    }
  }, [owned, hover]);

  // 卸载时确保清理 hover(避免 portal 残留)
  useEffect(() => {
    return () => setHover(null);
  }, []);

  if (!owned.length) return <div className="pp__empty">暂无建筑</div>;

  return (
    <>
      <ul className="pp__buildings">
        {owned.map(({ id, n, card }) => {
          const renoCnt = player.underRenovation?.[id] ?? 0;
          const tag = renoCnt > 0 ? `🛠️ 装修中 ${renoCnt}/${n}` : null;
          const techCnt = id === 'tech_startup' ? (player.techMarkers ?? 0) : 0;
          return (
            <li
              key={id}
              className={`${COLOR_CLASS[card.color]} ${renoCnt >= n ? 'pp__bld--off' : ''}`}
              onMouseEnter={(e) => handleHover(id, e.currentTarget)}
              onMouseLeave={() => setHover(null)}
            >
              <span className="pp__act">{fmtAct(card.activation)}</span>
              <span
                className="pp__icon"
                aria-label={SYMBOL_META[card.symbol].label}
                title={SYMBOL_META[card.symbol].label}
              >
                {SYMBOL_META[card.symbol].emoji}
              </span>
              <span className="pp__name">{card.name}</span>
              {card.color !== 'purple' && n > 1 && <span className="pp__count">×{n}</span>}
              {techCnt > 0 && <span className="pp__count pp__count--tech" title="科技标记">💻×{techCnt}</span>}
              {tag && <span className="pp__count pp__count--off">{tag}</span>}
            </li>
          );
        })}
      </ul>
      {hover && hoverCard && createPortal(
        <div
          ref={tipRef}
          className="pp__bldTip"
          style={{ left: tx, top: ty, maxWidth: tipMaxW }}
        >
          {hoverCard.description}
        </div>,
        document.body,
      )}
    </>
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
                {lm.mode === 'harbor' && !lm.builtByDefault && (
                  <span className="pp__lmTag pp__lmTag--harbor" title="港口扩展">港扩</span>
                )}
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
