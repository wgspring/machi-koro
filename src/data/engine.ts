/**
 * 游戏引擎:纯函数实现的状态变换
 * 所有 reducer-style 函数都返回新 state,不修改入参
 *
 * 支持两种模式:
 *   - 'base'    : 基础版(15 种建筑 + 4 座地标)
 *   - 'harbor'  : Bright Lights, Big City 合订版(2016 重制版)
 *               · 市政厅 / 港口 默认建成(builtByDefault)
 *               · 10 堆市场(low / high / purple,场上保持 5/5/2 种)
 *               · 鲭鱼船改为🟦蓝色;无渔船;无机场;无公园
 *               · 出版社按「☕ + 🥐」抢币;税务局对 ≥10 币对手抽税
 */
import {
  BUILDINGS,
  LANDMARKS,
  STARTING_HAND,
  MARKET_DISPLAY_KINDS,
  getBuildings,
  getLandmarks,
  getBuyableLandmarks,
} from './cards';
import type { BuildingCard } from './cards';
import type {
  GameState,
  PlayerState,
  DiceResult,
  CatalogIndex,
  GameMode,
  MarketDecks,
} from './types';
import { initialCoins } from './testMode';

/* -------------------------------------------------------------------------- */
/*                                  目录索引                                  */
/* -------------------------------------------------------------------------- */

/** 包含所有模式的全局目录,用于按 id 查找(展示用) */
export const CATALOG: CatalogIndex = {
  byId: Object.fromEntries(BUILDINGS.map((b) => [b.id, b])),
  landmarkById: Object.fromEntries(LANDMARKS.map((l) => [l.id, l])),
};

/** 模式专属可用建筑(用于结算逻辑) */
function buildingsFor(mode: GameMode): BuildingCard[] {
  return getBuildings(mode);
}

/* -------------------------------------------------------------------------- */
/*                          10 种统一市场工具函数                              */
/* -------------------------------------------------------------------------- */

/** Fisher-Yates 洗牌(返回新数组) */
function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** 初始化 10 种统一市场:所有卡按 supply 入唯一牌库,洗牌后翻出前 10 种 */
export function initMarket(mode: GameMode): MarketDecks | null {
  if (mode !== 'harbor') return null;
  const cards = buildingsFor(mode);
  const deck: string[] = [];
  for (const card of cards) {
    for (let i = 0; i < card.supply; i++) deck.push(card.id);
  }
  const shuffled = shuffle(deck);
  const displayed: string[] = [];
  refillMarket(shuffled, displayed);
  return { deck: shuffled, displayed };
}

/** 翻牌补足到 MARKET_DISPLAY_KINDS 种(去重展示);重复的卡牌默默叠到对应 supply */
function refillMarket(deck: string[], displayed: string[]): void {
  while (displayed.length < MARKET_DISPLAY_KINDS && deck.length > 0) {
    const top = deck.shift()!;
    if (!displayed.includes(top)) {
      displayed.push(top);
    }
    // 若与已展示重复,则等同于"摸到现有堆叠的下一张",不增加种类。
    // 重复的卡通过 supply 数量来表达"还能买多少张"。
  }
}

/**
 * 在市场上"买掉"一张卡:
 *  - 若 supply 已为 0,则从 displayed 移除该 id;
 *  - 然后从牌库顶部补到 10 种。
 * 该函数直接修改传入的 market 对象(已是 cloneState 后的副本)
 */
function takeFromMarket(market: MarketDecks, supply: Record<string, number>, cardId: string): void {
  if ((supply[cardId] ?? 0) <= 0) {
    market.displayed = market.displayed.filter((x) => x !== cardId);
  }
  refillMarket(market.deck, market.displayed);
}

/** 给 UI 用:返回当前市场上展示的卡 id 列表 */
export function marketDisplayIds(state: GameState): string[] {
  if (state.mode === 'harbor' && state.market) return state.market.displayed;
  // base 模式:全部 15 种都视为展示
  return buildingsFor(state.mode).map((c) => c.id);
}

/* -------------------------------------------------------------------------- */
/*                                  初始化                                    */
/* -------------------------------------------------------------------------- */

const makePlayer = (id: 0 | 1, name: string, mode: GameMode): PlayerState => {
  const buildings: Record<string, number> = {};
  for (const cid of STARTING_HAND) buildings[cid] = 1;
  const landmarks: Record<string, boolean> = {};
  for (const l of getLandmarks(mode)) landmarks[l.id] = !!l.builtByDefault;
  return { id, name, coins: initialCoins(), buildings, landmarks };
};

export function createInitialState(
  name1 = '玩家 1',
  name2 = '玩家 2',
  mode: GameMode = 'base',
): GameState {
  const supply: Record<string, number> = {};
  for (const b of buildingsFor(mode)) supply[b.id] = b.supply;

  const modeLabel = mode === 'harbor' ? 'Bright Lights 合订版' : '基础版';
  return {
    mode,
    turn: 1,
    active: 0,
    phase: 'roll',
    players: [makePlayer(0, name1, mode), makePlayer(1, name2, mode)],
    supply,
    market: initMarket(mode),
    lastRoll: null,
    rerollUsedThisTurn: false,
    extraTurnPending: false,
    builtThisTurn: false,
    winner: null,
    log: [
      {
        id: 0,
        turn: 1,
        playerId: 0,
        text: `游戏开始(${modeLabel})!${name1} 先手。`,
      },
    ],
    _logSeq: 1,
  };
}

/* -------------------------------------------------------------------------- */
/*                                  工具函数                                  */
/* -------------------------------------------------------------------------- */

const rand6 = () => 1 + Math.floor(Math.random() * 6);

const cloneMarket = (m: MarketDecks | null): MarketDecks | null => {
  if (!m) return null;
  return {
    deck: [...m.deck],
    displayed: [...m.displayed],
  };
};

const cloneState = (s: GameState): GameState => ({
  ...s,
  players: [
    { ...s.players[0], buildings: { ...s.players[0].buildings }, landmarks: { ...s.players[0].landmarks } },
    { ...s.players[1], buildings: { ...s.players[1].buildings }, landmarks: { ...s.players[1].landmarks } },
  ],
  supply: { ...s.supply },
  market: cloneMarket(s.market),
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

export function rollDice(
  state: GameState,
  count: 1 | 2,
  forced?: { d1?: number; d2?: number },
): GameState {
  if (state.phase !== 'roll') return state;
  const s = cloneState(state);
  const clamp = (v: number | undefined): number | null => {
    if (v == null || Number.isNaN(v)) return null;
    const n = Math.floor(v);
    return n >= 1 && n <= 6 ? n : null;
  };
  const f1 = clamp(forced?.d1);
  const f2 = clamp(forced?.d2);
  const d1 = f1 ?? rand6();
  const d2 = count === 2 ? (f2 ?? rand6()) : 0;
  const sum = d1 + d2;
  const result: DiceResult = {
    d1,
    d2,
    count,
    sum,
    isDouble: count === 2 && d1 === d2,
    rerolled: false,
    harborBoosted: false,
  };
  s.lastRoll = result;
  pushLog(
    s,
    s.active,
    `掷骰:${count === 2 ? `${d1}+${d2}=${sum}` : `${d1}`}${result.isDouble ? '(豹子!)' : ''}`,
  );

  // Bright Lights:港口默认建成,但 +2 仅对**双骰且点数 ≥10** 提供选择
  const me = s.players[s.active];
  if (s.mode === 'harbor' && me.landmarks.harbor && count === 2 && sum >= 10) {
    s.phase = 'pending-harbor';
  } else {
    s.phase = 'resolve';
  }
  // 重置 tuna 缓存:每次掷骰都要重新算
  delete (s as unknown as { _tunaCache?: number })._tunaCache;
  return s;
}

/** 港口 +2 决策(仅 Bright Lights · 双骰 · 点数 ≥10) */
export function applyHarborBoost(state: GameState, accept: boolean): GameState {
  if (state.phase !== 'pending-harbor' || !state.lastRoll) return state;
  const s = cloneState(state);
  if (accept) {
    s.lastRoll = { ...s.lastRoll!, sum: s.lastRoll!.sum + 2, harborBoosted: true };
    pushLog(s, s.active, `港口 +2:点数变为 ${s.lastRoll.sum}`);
  } else {
    pushLog(s, s.active, '港口加成:本次不使用');
  }
  s.phase = 'resolve';
  return s;
}

/** 电波塔重投 */
export function rerollDice(
  state: GameState,
  forced?: { d1?: number; d2?: number },
): GameState {
  if (state.phase !== 'resolve' && state.phase !== 'pending-harbor') return state;
  if (!state.lastRoll) return state;
  const player = state.players[state.active];
  if (!player.landmarks.radio_tower || state.rerollUsedThisTurn) return state;
  const s = cloneState(state);
  s.rerollUsedThisTurn = true;
  const count = s.lastRoll!.count;
  const clamp = (v: number | undefined): number | null => {
    if (v == null || Number.isNaN(v)) return null;
    const n = Math.floor(v);
    return n >= 1 && n <= 6 ? n : null;
  };
  const f1 = clamp(forced?.d1);
  const f2 = clamp(forced?.d2);
  const d1 = f1 ?? rand6();
  const d2 = count === 2 ? (f2 ?? rand6()) : 0;
  const sum = d1 + d2;
  s.lastRoll = {
    d1,
    d2,
    count,
    sum,
    isDouble: count === 2 && d1 === d2,
    rerolled: true,
    harborBoosted: false,
  };
  pushLog(s, s.active, `电波塔重投:${count === 2 ? `${d1}+${d2}=${sum}` : `${d1}`}`);

  // 重投后港口同样需要重新判定(仍要求双骰且 ≥10)
  const me = s.players[s.active];
  if (s.mode === 'harbor' && me.landmarks.harbor && count === 2 && sum >= 10) {
    s.phase = 'pending-harbor';
  } else {
    s.phase = 'resolve';
  }
  delete (s as unknown as { _tunaCache?: number })._tunaCache;
  return s;
}

/* -------------------------------------------------------------------------- */
/*                                  结算收益                                  */
/* -------------------------------------------------------------------------- */

const countOf = (p: PlayerState, id: string) => p.buildings[id] ?? 0;
/** 购物中心对绿色"杯型"建筑(面包店、便利店、咖啡馆、家庭餐厅、披萨店、汉堡店、寿司店、花店)的加成 */
const CUP_BONUS_IDS = new Set([
  'bakery', 'convenience', 'cafe', 'restaurant',
  'pizza_joint', 'hamburger', 'sushi_bar', 'flower_shop',
]);
const cupBonus = (p: PlayerState, id: string) =>
  p.landmarks.mall && CUP_BONUS_IDS.has(id) ? 1 : 0;

/** Bright Lights 出版社规则:对手「☕ cup + 🥐 bread(房屋)」建筑数量之和 */
const CUP_LIKE_SYMBOLS: ReadonlySet<string> = new Set(['cup', 'bread']);
const cupLikeSymbolCount = (p: PlayerState): number => {
  let n = 0;
  for (const [id, cnt] of Object.entries(p.buildings)) {
    const sym = CATALOG.byId[id]?.symbol;
    if (cnt > 0 && sym && CUP_LIKE_SYMBOLS.has(sym)) n += cnt;
  }
  return n;
};

/** Bright Lights 食品仓库规则:仅 ☕ cup 杯型建筑数量 */
const cupSymbolCount = (p: PlayerState): number => {
  let n = 0;
  for (const [id, cnt] of Object.entries(p.buildings)) {
    if (cnt > 0 && CATALOG.byId[id]?.symbol === 'cup') n += cnt;
  }
  return n;
};

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
  /** 金枪鱼船本回合的"额外两骰之和"(若触发) */
  tunaRoll?: number;
}

/**
 * 金枪鱼船:全员投 2 颗骰子,所有持有者按这两颗骰之和收币(每张 +sum)。
 * 为了让 preview 与 resolve 保持一致,本回合只投一次,缓存到 state._tunaCache。
 */
function getTunaRoll(state: GameState): number {
  type WithCache = GameState & { _tunaCache?: number };
  const ws = state as WithCache;
  if (typeof ws._tunaCache === 'number') return ws._tunaCache;
  const v = rand6() + rand6();
  ws._tunaCache = v;
  return v;
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
  const cards = buildingsFor(state.mode);

  // 模拟金币池(用于红/紫色"钱不够时给到 0 为止"判定)
  const coins: [number, number] = [players[0].coins, players[1].coins];
  const items: [IncomeItem[], IncomeItem[]] = [[], []];

  const tryTransfer = (from: 0 | 1, to: 0 | 1, amount: number) => {
    const actual = Math.min(amount, coins[from]);
    coins[from] -= actual;
    coins[to] += actual;
    return actual;
  };

  // 检查任何人是否会触发金枪鱼船(决定是否需要骰额外两颗)
  let tunaRoll: number | undefined;
  const tunaCard = cards.find((c) => c.id === 'tuna_boat');
  if (tunaCard && tunaCard.activation.includes(sum)) {
    const anyHas = (players[0].landmarks.harbor && countOf(players[0], 'tuna_boat') > 0)
      || (players[1].landmarks.harbor && countOf(players[1], 'tuna_boat') > 0);
    if (anyHas) tunaRoll = getTunaRoll(state);
  }

  // 1. 红色:对手的红色建筑从主动玩家身上抢钱
  for (const card of cards) {
    if (card.color !== 'red' || !card.activation.includes(sum)) continue;
    if (card.requiresHarbor && !players[opponent].landmarks.harbor) continue;
    const owner = opponent;
    const cnt = countOf(players[owner], card.id);
    if (cnt === 0) continue;
    let per: number;
    if (card.id === 'cafe') per = 1;
    else if (card.id === 'restaurant') per = 2;
    else if (card.id === 'pizza_joint') per = 1;
    else if (card.id === 'hamburger') per = 1;
    else if (card.id === 'sushi_bar') per = 3;
    else per = 1;
    const total = (per + cupBonus(players[owner], card.id)) * cnt;
    const got = tryTransfer(active, owner, total);
    if (got > 0) {
      items[owner].push({ cardName: card.name, count: cnt, delta: got, category: 'red' });
      items[active].push({ cardName: `被「${card.name}」抢走`, count: cnt, delta: -got, category: 'red' });
    }
  }

  // 2. 蓝色:任何人触发,所有人收钱
  for (const pid of [0, 1] as const) {
    for (const card of cards) {
      if (card.color !== 'blue' || !card.activation.includes(sum)) continue;
      if (card.requiresHarbor && !players[pid].landmarks.harbor) continue;
      const cnt = countOf(players[pid], card.id);
      if (cnt === 0) continue;
      let per = 0;
      if (card.id === 'wheat_field' || card.id === 'ranch' || card.id === 'forest') per = 1;
      else if (card.id === 'mine') per = 5;
      else if (card.id === 'apple_orchard') per = 3;
      else if (card.id === 'flower_orch') per = 1;
      else if (card.id === 'mackerel_boat') per = 3;
      else if (card.id === 'tuna_boat') {
        // Bright Lights 金枪鱼船:全员另投 2 颗骰子,按其和收币(每张 +sum)
        per = tunaRoll ?? 0;
      }
      const gain = per * cnt;
      if (gain > 0) {
        coins[pid] += gain;
        const label = card.id === 'tuna_boat' ? `${card.name}(额外2骰=${tunaRoll})` : card.name;
        items[pid].push({ cardName: label, count: cnt, delta: gain, category: 'blue' });
      }
    }
  }

  // 3. 绿色:仅主动玩家触发
  for (const card of cards) {
    if (card.color !== 'green' || !card.activation.includes(sum)) continue;
    if (card.requiresHarbor && !players[active].landmarks.harbor) continue;
    const me = players[active];
    const cnt = countOf(me, card.id);
    if (cnt === 0) continue;
    let perCardBase = 0;
    if (card.id === 'bakery') perCardBase = 1;
    else if (card.id === 'convenience') perCardBase = 3;
    else if (card.id === 'cheese_factory') perCardBase = 3 * countOf(me, 'ranch');
    else if (card.id === 'furniture') perCardBase = 3 * (countOf(me, 'forest') + countOf(me, 'mine'));
    else if (card.id === 'market') perCardBase = 2 * (countOf(me, 'wheat_field') + countOf(me, 'apple_orchard'));
    else if (card.id === 'flower_shop') perCardBase = 1 * countOf(me, 'flower_orch');
    else if (card.id === 'food_warehouse') perCardBase = 2 * cupSymbolCount(me);
    const perCard = perCardBase + cupBonus(me, card.id);
    const gain = perCard * cnt;
    if (gain > 0) {
      coins[active] += gain;
      items[active].push({ cardName: card.name, count: cnt, delta: gain, category: 'green' });
    }
  }

  // 4. 紫色:仅主动玩家触发
  let trade: IncomeBreakdown['trade'];
  for (const card of cards) {
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
    } else if (card.id === 'publisher') {
      // Bright Lights 出版社(修订版):对手每张「☕ cup + 🥐 bread」建筑各让你抢 1 币
      const cupN = cupLikeSymbolCount(players[opponent]);
      if (cupN > 0) {
        const got = tryTransfer(opponent, active, cupN);
        if (got > 0) {
          items[active].push({ cardName: '出版社', count: 1, delta: got, category: 'purple-coin' });
          items[opponent].push({ cardName: '被出版社抽税', count: cupN, delta: -got, category: 'purple-coin' });
        }
      }
    } else if (card.id === 'tax_office') {
      // 税务局:对手 ≥10 币时,拿走其一半(向下取整)
      if (coins[opponent] >= 10) {
        const half = Math.floor(coins[opponent] / 2);
        const got = tryTransfer(opponent, active, half);
        if (got > 0) {
          items[active].push({ cardName: '税务局', count: 1, delta: got, category: 'purple-coin' });
          items[opponent].push({ cardName: '被税务局抽税', count: 1, delta: -got, category: 'purple-coin' });
        }
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
    tunaRoll,
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

  if (breakdown.tunaRoll !== undefined) {
    pushLog(s, active, `🐟 金枪鱼船:额外投 2 骰 = ${breakdown.tunaRoll}`);
  }

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

  // Bright Lights 市政厅:进入建造阶段时,若 <1 币则补到 1
  applyCityHall(s, active);

  s.phase = 'build';
  return s;
}

/** Bright Lights 市政厅:若进入建造阶段时金币 <1,自动补到 1 */
function applyCityHall(s: GameState, pid: 0 | 1): void {
  if (s.mode !== 'harbor') return;
  const p = s.players[pid];
  if (!p.landmarks.city_hall) return;
  if (p.coins < 1) {
    const need = 1 - p.coins;
    p.coins = 1;
    pushLog(s, pid, `🏛️ 市政厅:金币不足,自动补 ${need} 币`);
  }
}

/* -------------------------------------------------------------------------- */
/*                                  购买阶段                                  */
/* -------------------------------------------------------------------------- */

export function buyBuilding(state: GameState, cardId: string): GameState {
  if (state.phase !== 'build') return state;
  const card = CATALOG.byId[cardId];
  if (!card) return state;
  // 只有当前模式可用的卡才能买
  if (card.mode === 'harbor' && state.mode !== 'harbor') return state;
  if ((state.supply[cardId] ?? 0) <= 0) return state;
  // Bright Lights:必须在 10 种统一市场展示位上才能购买
  if (state.mode === 'harbor' && state.market) {
    if (!state.market.displayed.includes(cardId)) return state;
  }

  const me = state.players[state.active];
  if (me.coins < card.cost) return state;
  // 紫色每位玩家上限 1 张
  if (card.color === 'purple' && (me.buildings[cardId] ?? 0) >= 1) return state;

  const s = cloneState(state);
  s.players[s.active].coins -= card.cost;
  s.players[s.active].buildings[cardId] = (s.players[s.active].buildings[cardId] ?? 0) + 1;
  s.supply[cardId] -= 1;
  s.builtThisTurn = true;
  pushLog(s, s.active, `购买了「${card.name}」(花费 ${card.cost} 币)`);
  // 市场补牌
  if (s.market) takeFromMarket(s.market, s.supply, cardId);
  return endTurnInternal(s);
}

export function buyLandmark(state: GameState, landmarkId: string): GameState {
  if (state.phase !== 'build') return state;
  const lm = CATALOG.landmarkById[landmarkId];
  if (!lm) return state;
  if (lm.mode === 'harbor' && state.mode !== 'harbor') return state;
  if (lm.builtByDefault) return state; // 默认建成的不能再"购买"
  const me = state.players[state.active];
  if (me.landmarks[landmarkId]) return state;
  if (me.coins < lm.cost) return state;

  const s = cloneState(state);
  s.players[s.active].coins -= lm.cost;
  s.players[s.active].landmarks[landmarkId] = true;
  s.builtThisTurn = true;
  pushLog(s, s.active, `建成地标「${lm.name}」!`);

  // 胜利判定:建成全部"可购买"地标(Bright Lights 中默认建成的不计入目标)
  const target = getBuyableLandmarks(s.mode);
  const all = target.every((l) => s.players[s.active].landmarks[l.id]);
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
    s.builtThisTurn = false;
    s.phase = 'roll';
    pushLog(s, s.active, '游乐园:再行动一次');
    return s;
  }
  s.active = s.active === 0 ? 1 : 0;
  s.turn += 1;
  s.lastRoll = null;
  s.rerollUsedThisTurn = false;
  s.builtThisTurn = false;
  s.phase = 'roll';
  return s;
}
