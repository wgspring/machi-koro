import { useGame } from '../state/GameContext';
import { CATALOG } from '../data/engine';
import './ChoiceModal.css';

/**
 * 百万富翁扩展:resolve 阶段需要玩家选择时弹出的模态框
 * 根据 state.pendingChoices[0] 渲染对应交互
 */
export default function ChoiceModal() {
  const { state, dispatch } = useGame();
  const pending = state.pendingChoices;
  if (!pending || pending.length === 0) return null;
  const head = pending[0];
  const me = state.players[head.playerId];
  const myName = me.name;

  // 进度提示(同种选择多次时显示 "1/N")
  const sameKindTotal = pending.filter((c) => c.kind === head.kind).length;
  const allKindCount = (() => {
    // 总数 = 当前队列 + 已经在 resolved 里的同类
    const rc = state._resolvedChoices ?? {};
    if (head.kind === 'demolish') return sameKindTotal + (rc.demolishLandmarkIds?.length ?? 0);
    if (head.kind === 'moving') return sameKindTotal + (rc.movingGiveIds?.length ?? 0);
    return 1;
  })();
  const doneCount = allKindCount - sameKindTotal;

  /* ------------------------- 拆迁公司:选地标 ------------------------- */
  if (head.kind === 'demolish') {
    return (
      <div className="cm__overlay">
        <div className="cm__modal cm__modal--demolish">
          <h3>🚧 拆迁公司 · {myName} 请选择要拆除的地标</h3>
          <p className="cm__hint">银行将支付你 8 币 / 座 · 进度 {doneCount + 1}/{allKindCount}</p>
          <div className="cm__list">
            {head.options.map((id) => {
              const lm = CATALOG.landmarkById[id];
              if (!lm) return null;
              return (
                <button
                  key={id}
                  className="cm__btn cm__btn--landmark"
                  onClick={() => dispatch({ type: 'RESOLVE_CHOICE', payload: { kind: 'demolish', landmarkId: id } })}
                >
                  <span className="cm__btnTitle">{lm.name}</span>
                  <span className="cm__btnMeta">造价 {lm.cost} 币</span>
                  <span className="cm__btnDesc">{lm.description}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  /* ------------------------- 搬家公司:选送出哪张非紫卡 ------------------------- */
  if (head.kind === 'moving') {
    return (
      <div className="cm__overlay">
        <div className="cm__modal cm__modal--moving">
          <h3>🏢 搬家公司 · {myName} 请选择要送出的卡牌</h3>
          <p className="cm__hint">送出后从对手处获得 4 币 · 进度 {doneCount + 1}/{allKindCount}</p>
          <div className="cm__list cm__list--grid">
            {head.options.map((id) => {
              const c = CATALOG.byId[id];
              if (!c) return null;
              return (
                <button
                  key={id}
                  className={`cm__btn cm__btn--card cm__btn--${c.color}`}
                  onClick={() => dispatch({ type: 'RESOLVE_CHOICE', payload: { kind: 'moving', buildingId: id } })}
                >
                  <span className="cm__btnTitle">{c.name}</span>
                  <span className="cm__btnMeta">{c.color === 'blue' ? '🟦' : c.color === 'green' ? '🟩' : '🟥'} · 成本 {c.cost} 币 · 你有 {me.buildings[id] ?? 0} 张</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  /* ------------------------- 装修公司:选要装修的对手卡 ------------------------- */
  if (head.kind === 'renovation') {
    const opp = state.players[head.playerId === 0 ? 1 : 0];
    return (
      <div className="cm__overlay">
        <div className="cm__modal cm__modal--reno">
          <h3>🛠️ 装修公司 · {myName} 请选择要装修的对手卡牌</h3>
          <p className="cm__hint">从该对手收 1 币/张;这些卡<strong>进入装修态</strong>,下次它的触发点命中时自动恢复(那一次仍不结算)</p>
          <div className="cm__list cm__list--grid">
            {head.options.map((id) => {
              const c = CATALOG.byId[id];
              if (!c) return null;
              const total = opp.buildings[id] ?? 0;
              const reno = opp.underRenovation?.[id] ?? 0;
              const eff = Math.max(0, total - reno);
              return (
                <button
                  key={id}
                  className={`cm__btn cm__btn--card cm__btn--${c.color}`}
                  onClick={() => dispatch({ type: 'RESOLVE_CHOICE', payload: { kind: 'renovation', buildingId: id } })}
                >
                  <span className="cm__btnTitle">{c.name}</span>
                  <span className="cm__btnMeta">对手有效 ×{eff}{reno > 0 ? ` · 装修中 ${reno}` : ''} · 收 {eff} 币</span>
                  <span className="cm__btnDesc">{c.description}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  /* ------------------------- 会展中心:选己方哪种非紫卡来激活全部张数 ------------------------- */
  if (head.kind === 'exhibit') {
    return (
      <div className="cm__overlay">
        <div className="cm__modal cm__modal--exhibit">
          <h3>🏟️ 会展中心 · {myName} 请选择要激活的己方建筑</h3>
          <p className="cm__hint">
            激活该建筑的<strong>全部张数</strong>(蓝/绿色按银行收益,红色不抢钱);本卡随后被放回市场卡库。
          </p>
          <div className="cm__list cm__list--grid">
            {head.options.map((id) => {
              const c = CATALOG.byId[id];
              if (!c) return null;
              const n = me.buildings[id] ?? 0;
              const colorIcon = c.color === 'blue' ? '🟦' : c.color === 'green' ? '🟩' : c.color === 'red' ? '🟥' : '🟪';
              return (
                <button
                  key={id}
                  className={`cm__btn cm__btn--card cm__btn--${c.color}`}
                  onClick={() => dispatch({ type: 'RESOLVE_CHOICE', payload: { kind: 'exhibit', buildingId: id } })}
                >
                  <span className="cm__btnTitle">{c.name}</span>
                  <span className="cm__btnMeta">{colorIcon} · 你有 ×{n} · 触发点 {c.activation.join('/')}</span>
                  <span className="cm__btnDesc">{c.description}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  /* ------------------------- 商业中心 · 第一步:选要从对手处拿走的卡 ------------------------- */
  if (head.kind === 'business_take') {
    const opp = state.players[head.playerId === 0 ? 1 : 0];
    return (
      <div className="cm__overlay">
        <div className="cm__modal cm__modal--business">
          <h3>🏢 商业中心 · {myName} 第 1 步:选择要从对手处拿走的卡牌</h3>
          <p className="cm__hint">下一步你将从自己手中选 1 张非紫卡作为交换</p>
          <div className="cm__list cm__list--grid">
            {head.options.map((id) => {
              const c = CATALOG.byId[id];
              if (!c) return null;
              const n = opp.buildings[id] ?? 0;
              return (
                <button
                  key={id}
                  className={`cm__btn cm__btn--card cm__btn--${c.color}`}
                  onClick={() => dispatch({ type: 'RESOLVE_CHOICE', payload: { kind: 'business_take', buildingId: id } })}
                >
                  <span className="cm__btnTitle">{c.name}</span>
                  <span className="cm__btnMeta">{c.color === 'blue' ? '🟦' : c.color === 'green' ? '🟩' : '🟥'} · 成本 {c.cost} 币 · 对手 ×{n}</span>
                  <span className="cm__btnDesc">{c.description}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  /* ------------------------- 商业中心 · 第二步:选要送出去的己方卡 ------------------------- */
  if (head.kind === 'business_give') {
    const rc = state._resolvedChoices ?? {};
    const takeId = rc.businessTakeId;
    const takeName = takeId ? CATALOG.byId[takeId]?.name ?? '?' : '?';
    return (
      <div className="cm__overlay">
        <div className="cm__modal cm__modal--business">
          <h3>🏢 商业中心 · {myName} 第 2 步:选择要送出去的卡牌</h3>
          <p className="cm__hint">你将获得「{takeName}」并送出 1 张自己的非紫卡</p>
          <div className="cm__list cm__list--grid">
            {head.options.map((id) => {
              const c = CATALOG.byId[id];
              if (!c) return null;
              const n = me.buildings[id] ?? 0;
              return (
                <button
                  key={id}
                  className={`cm__btn cm__btn--card cm__btn--${c.color}`}
                  onClick={() => dispatch({ type: 'RESOLVE_CHOICE', payload: { kind: 'business_give', buildingId: id } })}
                >
                  <span className="cm__btnTitle">{c.name}</span>
                  <span className="cm__btnMeta">{c.color === 'blue' ? '🟦' : c.color === 'green' ? '🟩' : '🟥'} · 成本 {c.cost} 币 · 你有 ×{n}</span>
                  <span className="cm__btnDesc">{c.description}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
