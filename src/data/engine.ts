/**
 * 游戏引擎:纯函数实现的状态变换
 * 所有 reducer-style 函数都返回新 state,不修改入参
 */
import { BUILDINGS, LANDMARKS, STARTING_HAND } from './cards';
import type {
  GameState,
  PlayerState,
  DiceResult,
  CatalogIndex,
} from './types';

/* -------------------------------------------------------------------------- */
/*                                  目录索引                                  */
/* -------------------------------------------------------------------------- */

export const CATALOG: CatalogIndex = {
  byId: Object.fromEntries(BUILDINGS.map((b) => [b.id, b])),
  landmarkById: Object.fromEntries(LANDMARKS.map((l) => [l.id, l])),
};

/* -------------------------------------------------------------------------- */
/*                                  初始化                                    */
/* -------------------------------------------------------------------------- */

const makePlayer = (id: 0 | 1, name: string): PlayerState => {
  const buildings: Record<string, number> = {};
  for (const cid of STARTING_HAND) buildings[cid] = 1;
  const landmarks: Record<string, boolean> = {};
  for (const l of LANDMARKS) landmarks[l.id] = false;
  return { id, name, coins: 3, buildings, landmarks };
};

export function createInitialState(name1 = '玩家 1', name2 = '玩家 2'): GameState {
  const supply: Record<string, number> = {};
  for (const b of BUILDINGS) supply[b.id] = b.supply;

  return {
    turn: 1,
    active: 0,
    phase: 'roll',
    players: [makePlayer(0, name1), makePlayer(1, name2)],
    supply,
    lastRoll: null,
    rerollUsedThisTurn: false,
    extraTurnPending: false,
    winner: null,
    log: [
      {
        id: 0,
        turn: 1,
        playerId: 0,
        text: `游戏开始!${name1} 先手。`,
      },
    ],
    _logSeq: 1,
  };
}

/* -------------------------------------------------------------------------- */
/*                                  工具函数                                  */
/* -------------------------------------------------------------------------- */

const rand6 = () => 1 + Math.floor(Math.random() * 6);

const cloneState = (s: GameState): GameState => ({
  ...s,
  players: [
    { ...s.players[0], buildings: { ...s.players[0].buildings }, landmarks: { ...s.players[0].landmarks } },
    { ...s.players[1], buildings: { ...s.players[1].buildings }, landmarks: { ...s.players[1].landmarks } },
  ],
  supply: { ...s.supply },
  log: [...s.log],
});

const pushLog = (s: GameState, playerId: 0 | 1, text: string): GameState => {
  s.log.push({ id: s._logSeq, turn: s.turn, playerId, text });
  s._logSeq += 1;
  return s;
};

/* -------------------------------------------------------------------------- */
/*                                  掷骰子                                    */
/* -------------------------------------------------------------------------- */

export function rollDice(state: GameState, count: 1 | 2): GameState {
  if (state.phase !== 'roll') return state;
  const s = cloneState(state);
  const d1 = rand6();
  const d2 = count === 2 ? rand6() : 0;
  const sum = d1 + d2;
  const result: DiceResult = {
    d1,
    d2,
    count,
    sum,
    isDouble: count === 2 && d1 === d2,
    rerolled: false,
  };
  s.lastRoll = result;
  pushLog(
    s,
    s.active,
    `掷骰:${count === 2 ? `${d1}+${d2}=${sum}` : `${d1}`}${result.isDouble ? '(豹子!)' : ''}`,
  );
  s.phase = 'resolve';
  return s;
}

/** 电波塔重投 */
export function rerollDice(state: GameState): GameState {
  if (state.phase !== 'resolve' || !state.lastRoll) return state;
  const player = state.players[state.active];
  if (!player.landmarks.radio_tower || state.rerollUsedThisTurn) return state;
  const s = cloneState(state);
  s.rerollUsedThisTurn = true;
  const count = s.lastRoll!.count;
  const d1 = rand6();
  const d2 = count === 2 ? rand6() : 0;
  const sum = d1 + d2;
  s.lastRoll = {
    d1,
    d2,
    count,
    sum,
    isDouble: count === 2 && d1 === d2,
    rerolled: true,
  };
  pushLog(s, s.active, `电波塔重投:${count === 2 ? `${d1}+${d2}=${sum}` : `${d1}`}`);
  return s;
}

/* -------------------------------------------------------------------------- */
/*                                  结算收益                                  */
/* -------------------------------------------------------------------------- */

const countOf = (p: PlayerState, id: string) => p.buildings[id] ?? 0;
/** 购物中心对绿色"杯型"建筑(面包店、便利店、咖啡馆、家庭餐厅)的加成 */
const CUP_BONUS_IDS = new Set(['bakery', 'convenience', 'cafe', 'restaurant']);
const cupBonus = (p: PlayerState, id: string) =>
  p.landmarks.mall && CUP_BONUS_IDS.has(id) ? 1 : 0;

/** 一条收益明细 */
export interface IncomeItem {
  cardName: string;
  count: number;
  /** 对该玩家的金币变化(可正可负) */
  delta: number;
  category: 'red' | 'blue' | 'green' | 'purple-coin' | 'purple-trade';
}

/** 单次结算对两位玩家的全部影响(纯计算,不修改 state) */
export interface IncomeBreakdown {
  /** 玩家 0 / 1 的明细 */
  items: [IncomeItem[], IncomeItem[]];
  /** 玩家 0 / 1 的金币净变化 */
  delta: [number, number];
  /** 紫色商业中心交换的卡牌(若发生) */
  trade?: { giveId: string; takeId: string };
  /** 是否触发游乐园额外回合 */
  extraTurn: boolean;
}

/**
 * 纯计算函数:基于当前 state.lastRoll,推导出本次结算对双方的影响
 * 用于"预览"和"实际结算"共用同一份逻辑
 */
export function computeIncomeBreakdown(state: GameState): IncomeBreakdown {
  const empty: IncomeBreakdown = { items: [[], []], delta: [0, 0], extraTurn: false };
  if (!state.lastRoll) return empty;

  const sum = state.lastRoll.sum;
  const active = state.active;
  const opponent: 0 | 1 = active === 0 ? 1 : 0;
  const players = state.players;

  // 模拟金币池(用于红/紫色"钱不够时给到 0 为止"判定)
  const coins: [number, number] = [players[0].coins, players[1].coins];
  const items: [IncomeItem[], IncomeItem[]] = [[], []];

  const tryTransfer = (from: 0 | 1, to: 0 | 1, amount: number) => {
    const actual = Math.min(amount, coins[from]);
    coins[from] -= actual;
    coins[to] += actual;
    return actual;
  };

  // 1. 红色:对手的红色建筑从主动玩家身上抢钱
  for (const card of BUILDINGS) {
    if (card.color !== 'red' || !card.activation.includes(sum)) continue;
    const owner = opponent;
    const cnt = countOf(players[owner], card.id);
    if (cnt === 0) continue;
    const per = card.id === 'cafe' ? 1 : 2;
    const total = (per + cupBonus(players[owner], card.id)) * cnt;
    const got = tryTransfer(active, owner, total);
    if (got > 0) {
      items[owner].push({ cardName: card.name, count: cnt, delta: got, category: 'red' });
      items[active].push({ cardName: `被「${card.name}」抢走`, count: cnt, delta: -got, category: 'red' });
    }
  }

  // 2. 蓝色:任何人触发,所有人收钱
  for (const pid of [0, 1] as const) {
    for (const card of BUILDINGS) {
      if (card.color !== 'blue' || !card.activation.includes(sum)) continue;
      const cnt = countOf(players[pid], card.id);
      if (cnt === 0) continue;
      let per = 0;
      if (card.id === 'wheat_field' || card.id === 'ranch' || card.id === 'forest') per = 1;
      else if (card.id === 'mine') per = 5;
      else if (card.id === 'apple_orchard') per = 3;
      const gain = per * cnt;
      coins[pid] += gain;
      items[pid].push({ cardName: card.name, count: cnt, delta: gain, category: 'blue' });
    }
  }

  // 3. 绿色:仅主动玩家触发
  for (const card of BUILDINGS) {
    if (card.color !== 'green' || !card.activation.includes(sum)) continue;
    const me = players[active];
    const cnt = countOf(me, card.id);
    if (cnt === 0) continue;
    let perCardBase = 0;
    if (card.id === 'bakery') perCardBase = 1;
    else if (card.id === 'convenience') perCardBase = 3;
    else if (card.id === 'cheese_factory') perCardBase = 3 * countOf(me, 'ranch');
    else if (card.id === 'furniture') perCardBase = 3 * (countOf(me, 'forest') + countOf(me, 'mine'));
    else if (card.id === 'market') perCardBase = 2 * (countOf(me, 'wheat_field') + countOf(me, 'apple_orchard'));
    const perCard = perCardBase + cupBonus(me, card.id);
    const gain = perCard * cnt;
    if (gain > 0) {
      coins[active] += gain;
      items[active].push({ cardName: card.name, count: cnt, delta: gain, category: 'green' });
    }
  }

  // 4. 紫色:仅主动玩家触发
  let trade: IncomeBreakdown['trade'];
  for (const card of BUILDINGS) {
    if (card.color !== 'purple' || !card.activation.includes(sum)) continue;
    const me = players[active];
    const cnt = countOf(me, card.id);
    if (cnt === 0) continue;

    if (card.id === 'stadium') {
      const got = tryTransfer(opponent, active, 2);
      if (got > 0) {
        items[active].push({ cardName: '体育馆', count: 1, delta: got, category: 'purple-coin' });
        items[opponent].push({ cardName: '被体育馆抢', count: 1, delta: -got, category: 'purple-coin' });
      }
    } else if (card.id === 'tv_station') {
      const got = tryTransfer(opponent, active, 5);
      if (got > 0) {
        items[active].push({ cardName: '电视台', count: 1, delta: got, category: 'purple-coin' });
        items[opponent].push({ cardName: '被电视台抢', count: 1, delta: -got, category: 'purple-coin' });
      }
    } else if (card.id === 'business_ctr') {
      const myCards = Object.entries(me.buildings)
        .filter(([id, n]) => n > 0 && CATALOG.byId[id].color !== 'purple');
      const oppCards = Object.entries(players[opponent].buildings)
        .filter(([id, n]) => n > 0 && CATALOG.byId[id].color !== 'purple');
      if (myCards.length && oppCards.length) {
        const give = myCards.sort((a, b) => CATALOG.byId[a[0]].cost - CATALOG.byId[b[0]].cost)[0][0];
        const take = oppCards.sort((a, b) => CATALOG.byId[b[0]].cost - CATALOG.byId[a[0]].cost)[0][0];
        trade = { giveId: give, takeId: take };
        items[active].push({
          cardName: `商业中心:换得「${CATALOG.byId[take].name}」`,
          count: 1,
          delta: 0,
          category: 'purple-trade',
        });
        items[opponent].push({
          cardName: `被换走「${CATALOG.byId[take].name}」`,
          count: 1,
          delta: 0,
          category: 'purple-trade',
        });
      }
    }
  }

  const extraTurn =
    !!state.lastRoll.isDouble && !!players[active].landmarks.amusement;

  return {
    items,
    delta: [coins[0] - players[0].coins, coins[1] - players[1].coins],
    trade,
    extraTurn,
  };
}

/** 仅在 resolve 阶段提供预览;其他阶段返回空 */
export function previewIncome(state: GameState): IncomeBreakdown | null {
  if (state.phase !== 'resolve' || !state.lastRoll) return null;
  return computeIncomeBreakdown(state);
}

/**
 * 应用所有收益(基于 computeIncomeBreakdown 的结果)
 */
export function resolveIncome(state: GameState): GameState {
  if (state.phase !== 'resolve' || !state.lastRoll) return state;
  const breakdown = computeIncomeBreakdown(state);
  const s = cloneState(state);
  const active = s.active;
  const opponent: 0 | 1 = active === 0 ? 1 : 0;

  // 应用金币变化
  s.players[0].coins += breakdown.delta[0];
  s.players[1].coins += breakdown.delta[1];

  // 写日志(从明细生成)
  for (const pid of [0, 1] as const) {
    for (const item of breakdown.items[pid]) {
      if (item.category === 'purple-trade' || item.delta !== 0) {
        const sign = item.delta > 0 ? `+${item.delta}` : item.delta < 0 ? `${item.delta}` : '';
        const text = item.delta === 0
          ? item.cardName
          : `${item.cardName} ×${item.count} ${sign} 币`;
        pushLog(s, pid, text);
      }
    }
  }

  // 应用商业中心的卡牌交换
  if (breakdown.trade) {
    const { giveId, takeId } = breakdown.trade;
    const me = s.players[active];
    const opp = s.players[opponent];
    me.buildings[giveId] = (me.buildings[giveId] ?? 0) - 1;
    me.buildings[takeId] = (me.buildings[takeId] ?? 0) + 1;
    opp.buildings[takeId] = (opp.buildings[takeId] ?? 0) - 1;
    opp.buildings[giveId] = (opp.buildings[giveId] ?? 0) + 1;
  }

  // 游乐园额外回合
  if (breakdown.extraTurn) {
    s.extraTurnPending = true;
    pushLog(s, active, '游乐园:豹子触发,本回合结束后再行动一次');
  }

  s.phase = 'build';
  return s;
}

/* -------------------------------------------------------------------------- */
/*                                  购买阶段                                  */
/* -------------------------------------------------------------------------- */

export function buyBuilding(state: GameState, cardId: string): GameState {
  if (state.phase !== 'build') return state;
  const card = CATALOG.byId[cardId];
  if (!card) return state;
  if ((state.supply[cardId] ?? 0) <= 0) return state;

  const me = state.players[state.active];
  if (me.coins < card.cost) return state;
  // 紫色每位玩家上限 1 张
  if (card.color === 'purple' && (me.buildings[cardId] ?? 0) >= 1) return state;

  const s = cloneState(state);
  s.players[s.active].coins -= card.cost;
  s.players[s.active].buildings[cardId] = (s.players[s.active].buildings[cardId] ?? 0) + 1;
  s.supply[cardId] -= 1;
  pushLog(s, s.active, `购买了「${card.name}」(花费 ${card.cost} 币)`);
  return endTurnInternal(s);
}

export function buyLandmark(state: GameState, landmarkId: string): GameState {
  if (state.phase !== 'build') return state;
  const lm = CATALOG.landmarkById[landmarkId];
  if (!lm) return state;
  const me = state.players[state.active];
  if (me.landmarks[landmarkId]) return state;
  if (me.coins < lm.cost) return state;

  const s = cloneState(state);
  s.players[s.active].coins -= lm.cost;
  s.players[s.active].landmarks[landmarkId] = true;
  pushLog(s, s.active, `建成地标「${lm.name}」!`);

  // 胜利判定
  const all = Object.values(s.players[s.active].landmarks).every(Boolean);
  if (all) {
    s.winner = s.active;
    s.phase = 'gameover';
    pushLog(s, s.active, `🎉 ${s.players[s.active].name} 建成全部地标,获得胜利!`);
    return s;
  }
  return endTurnInternal(s);
}

export function skipBuild(state: GameState): GameState {
  if (state.phase !== 'build') return state;
  const s = cloneState(state);
  pushLog(s, s.active, '跳过建造');
  return endTurnInternal(s);
}

/** 结束回合,处理游乐园额外回合,或切换玩家 */
function endTurnInternal(s: GameState): GameState {
  if (s.phase === 'gameover') return s;
  if (s.extraTurnPending) {
    s.extraTurnPending = false;
    s.rerollUsedThisTurn = false;
    s.lastRoll = null;
    s.phase = 'roll';
    pushLog(s, s.active, '游乐园:再行动一次');
    return s;
  }
  s.active = s.active === 0 ? 1 : 0;
  s.turn += 1;
  s.lastRoll = null;
  s.rerollUsedThisTurn = false;
  s.phase = 'roll';
  return s;
}
