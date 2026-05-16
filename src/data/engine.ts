/**
 * 游戏引擎:纯函数实现的状态变换
 * 所有 reducer-style 函数都返回新 state,不修改入参
 *
 * 支持两种模式:
 *   - 'base'    : 基础版(15 种建筑 + 4 座地标)
 *   - 'harbor'  : 港口扩展(2016 重制版)
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
  usesUnifiedMarket,
  hasHarborLandmark,
} from './cards';
import type { BuildingCard } from './cards';
import type {
  GameState,
  PlayerState,
  DiceResult,
  CatalogIndex,
  GameMode,
  MarketDecks,
  PendingChoice,
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

/** 初始化 10 种统一市场:所有卡按 supply 入唯一牌库,洗牌后翻出前 10 种;
 *  此处会把 `supply[id]` 重置为该种在摊位上**实际堆叠的张数**(忠于原版桌游)。
 *  超出 10 种以外的同名卡会留在 deck 里,等到摊位上这一摞被买光、该种类槽被新种类替换、
 *  未来再次被翻到牌顶时才会重新出现。
 */
export function initMarket(mode: GameMode, supply: Record<string, number>): MarketDecks | null {
  if (!usesUnifiedMarket(mode)) return null;
  const cards = buildingsFor(mode);
  const deck: string[] = [];
  for (const card of cards) {
    for (let i = 0; i < card.supply; i++) deck.push(card.id);
  }
  const shuffled = shuffle(deck);
  const displayed: string[] = [];
  // 启用 10 种市场的模式:把 supply 全部清零,补牌时按"实际翻到的次数"累加
  for (const card of cards) supply[card.id] = 0;
  refillMarket(shuffled, displayed, supply);
  // 初始铺面不算"新补",避免开局每张都闪
  return { deck: shuffled, displayed, freshIds: [], freshSetTurn: -1 };
}

/** 翻牌补足到 MARKET_DISPLAY_KINDS 种;
 *  从牌堆顶逐张翻:
 *   - 若该 id 已在 displayed:不增加种类槽,但 supply[id] +1(同名堆叠);
 *   - 若该 id 不在 displayed:加入 displayed 作为新种类,supply[id] +1。
 *  循环直到种类数达到 10 或牌库翻空。
 */
function refillMarket(deck: string[], displayed: string[], supply: Record<string, number>): void {
  while (displayed.length < MARKET_DISPLAY_KINDS && deck.length > 0) {
    const top = deck.shift()!;
    if (!displayed.includes(top)) {
      displayed.push(top);
    }
    supply[top] = (supply[top] ?? 0) + 1;
  }
}

/**
 * 在市场上"买掉"一张卡:
 *  - 调用前 buyBuilding 已把 supply[cardId] -= 1;
 *  - 若 supply 已为 0,则从 displayed 移除该 id;
 *  - 然后从牌库顶部补到 10 种;
 *  - 把因补牌新增的 id 累加到 market.freshIds(用于 UI 闪光),已存在的不重复加入。
 * 该函数直接修改传入的 market 对象(已是 cloneState 后的副本)
 */
function takeFromMarket(market: MarketDecks, supply: Record<string, number>, cardId: string, turn: number): void {
  if ((supply[cardId] ?? 0) <= 0) {
    market.displayed = market.displayed.filter((x) => x !== cardId);
  }
  const before = new Set(market.displayed);
  refillMarket(market.deck, market.displayed, supply);
  // 若 freshIds 仍是上一回合的旧值(回合切换还没把它清掉就又买卡了,理论上不应发生),
  // 这里直接用本回合覆盖,避免跨回合污染
  if (market.freshSetTurn !== turn) {
    market.freshIds = [];
    market.freshSetTurn = turn;
  }
  for (const id of market.displayed) {
    if (!before.has(id) && !market.freshIds.includes(id)) {
      market.freshIds.push(id);
    }
  }
}

/** 给 UI 用:返回当前市场上展示的卡 id 列表 */
export function marketDisplayIds(state: GameState): string[] {
  if (usesUnifiedMarket(state.mode) && state.market) return state.market.displayed;
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
  return {
    id, name, coins: initialCoins(), buildings, landmarks,
    underRenovation: {},
    techMarkers: 0,
  };
};

export function createInitialState(
  name1 = '玩家 1',
  name2 = '玩家 2',
  mode: GameMode = 'base',
): GameState {
  const supply: Record<string, number> = {};
  for (const b of buildingsFor(mode)) supply[b.id] = b.supply;

  const modeLabel =
    mode === 'harbor' ? '港口扩展'
    : mode === 'millionaire' ? '百万富翁'
    : mode === 'all' ? '三合一(基础+港口+百万富翁)'
    : '基础版';
  return {
    mode,
    turn: 1,
    active: 0,
    phase: 'roll',
    players: [makePlayer(0, name1, mode), makePlayer(1, name2, mode)],
    supply,
    market: initMarket(mode, supply),
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
    freshIds: [...m.freshIds],
    freshSetTurn: m.freshSetTurn,
  };
};

const cloneState = (s: GameState): GameState => ({
  ...s,
  players: [
    {
      ...s.players[0],
      buildings: { ...s.players[0].buildings },
      landmarks: { ...s.players[0].landmarks },
      underRenovation: { ...(s.players[0].underRenovation ?? {}) },
    },
    {
      ...s.players[1],
      buildings: { ...s.players[1].buildings },
      landmarks: { ...s.players[1].landmarks },
      underRenovation: { ...(s.players[1].underRenovation ?? {}) },
    },
  ],
  supply: { ...s.supply },
  market: cloneMarket(s.market),
  pendingChoices: s.pendingChoices
    ? s.pendingChoices.map((c) => {
        const cloned: PendingChoice = { ...c };
        if ('options' in cloned && Array.isArray((cloned as { options?: unknown }).options)) {
          (cloned as { options: string[] }).options = [
            ...((cloned as { options: string[] }).options),
          ];
        }
        return cloned;
      })
    : undefined,
  _resolvedChoices: s._resolvedChoices ? { ...s._resolvedChoices } : undefined,
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

  // 港口 +2:仅在该模式启用港口机制、且玩家已建成港口、双骰且点数 ≥10 时可选
  const me = s.players[s.active];
  if (hasHarborLandmark(s.mode) && me.landmarks.harbor && count === 2 && sum >= 10) {
    s.phase = 'pending-harbor';
  } else {
    s.phase = 'resolve';
  }
  // 重置 tuna 缓存:每次掷骰都要重新算
  delete (s as unknown as { _tunaCache?: number })._tunaCache;
  return s;
}

/** 港口 +2 决策(仅当玩家已建成港口) */
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
  if (hasHarborLandmark(s.mode) && me.landmarks.harbor && count === 2 && sum >= 10) {
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

/** 该卡**有效**张数(排除装修态)— 用于触发收益和符号统计 */
const countOf = (p: PlayerState, id: string) => {
  const total = p.buildings[id] ?? 0;
  const off = p.underRenovation?.[id] ?? 0;
  return Math.max(0, total - off);
};
/** 该卡有效张数(等同 countOf,保留旧名兼容) */
const effectiveCountOf = (_s: GameState, p: PlayerState, id: string) =>
  countOf(p, id);

/** 玩家已建成的"非默认建成"地标数量(用于百万富翁的"地标数前置条件") */
const builtLandmarkCount = (p: PlayerState): number => {
  let n = 0;
  for (const id of Object.keys(p.landmarks)) {
    if (!p.landmarks[id]) continue;
    const lm = CATALOG.landmarkById[id];
    if (lm && !lm.builtByDefault) n += 1;
  }
  return n;
};

/** 购物中心对绿色"杯型"建筑(面包店、便利店、咖啡馆、家庭餐厅、披萨店、汉堡店、寿司店、花店、杂货店、法国餐厅、会员俱乐部)的加成 */
const CUP_BONUS_IDS = new Set([
  'bakery', 'convenience', 'cafe', 'restaurant',
  'pizza_joint', 'hamburger', 'sushi_bar', 'flower_shop',
  'general_store', 'french_rest', 'members_club',
]);
const cupBonus = (p: PlayerState, id: string) =>
  p.landmarks.mall && CUP_BONUS_IDS.has(id) ? 1 : 0;

/** 港口扩展 出版社规则:对手「☕ cup + 🥐 bread(房屋)」建筑数量之和(排除翻面停用) */
const CUP_LIKE_SYMBOLS: ReadonlySet<string> = new Set(['cup', 'bread']);
const cupLikeSymbolCount = (s: GameState, p: PlayerState): number => {
  let n = 0;
  for (const [id, cnt] of Object.entries(p.buildings)) {
    if (cnt <= 0) continue;
    const sym = CATALOG.byId[id]?.symbol;
    if (sym && CUP_LIKE_SYMBOLS.has(sym)) n += effectiveCountOf(s, p, id);
  }
  return n;
};

/** 港口扩展 食品仓库规则:仅 ☕ cup 杯型建筑数量(排除翻面停用) */
const cupSymbolCount = (s: GameState, p: PlayerState): number => {
  let n = 0;
  for (const [id, cnt] of Object.entries(p.buildings)) {
    if (cnt <= 0) continue;
    if (CATALOG.byId[id]?.symbol === 'cup') n += effectiveCountOf(s, p, id);
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
  /** 百万富翁副作用集合 */
  effects?: {
    /** 拆迁公司:本次结算需拆掉主动玩家的几座地标 */
    demolish?: number;
    /** 拆迁公司:具体拆掉的地标 id 列表(由 choices 指定或默认推断) */
    demolishLandmarkIds?: string[];
    /** 葡萄酒庄:本次结算后,主动玩家所有 winery 进入装修态 */
    wineryRenovate?: boolean;
    /** 搬家公司:主动玩家送给对手的卡牌 id 列表(简化为送最低成本的非紫卡各 1) */
    movingGiveIds?: string[];
    /** 装修公司:把哪些卡放入装修态 — 包含目标对手 id 与卡牌 id */
    renovationTarget?: { playerId: 0 | 1; buildingId: string };
    /** 公园:本次结算后,两人金币池均分 */
    parkRedistribute?: boolean;
    /** 会展中心:本次触发后,主动玩家手中 exhibit_hall -1,1 张放回市场 deck */
    exhibitConsumed?: boolean;
    /** 装修态恢复:本回合根据触发条件应自动恢复的"装修中"卡张数(此次仍不结算) */
    renovationRestores?: { playerId: 0 | 1; buildingId: string; count: number }[];
  };
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
/**
 * 玩家在 resolve 阶段做出的所有选择(由 UI 通过 RESOLVE_CHOICE 累计填入)
 *  - demolishLandmarkIds:拆迁公司:依次要拆的地标 id 列表(长度 = demolish 触发次数)
 *  - movingGiveIds      :搬家公司:依次要送出的非紫卡 id 列表
 *  - renovationLockId   :装修公司:要锁定的对手非紫卡 id
 *  - exhibitActivateId  :会展中心:要激活的己方非紫卡 id(用于触发其全部张数收益)
 */
export interface ResolveChoices {
  demolishLandmarkIds?: string[];
  movingGiveIds?: string[];
  renovationLockId?: string;
  exhibitActivateId?: string;
  /** 商业中心:玩家选定要从对手处拿走的非紫卡 id */
  businessTakeId?: string;
  /** 商业中心:玩家选定要送出去的己方非紫卡 id(在 take 之后产生) */
  businessGiveId?: string;
}

export function computeIncomeBreakdown(state: GameState, choices?: ResolveChoices): IncomeBreakdown {
  const empty: IncomeBreakdown = { items: [[], []], delta: [0, 0], extraTurn: false };
  if (!state.lastRoll) return empty;

  const sum = state.lastRoll.sum;
  const active = state.active;
  const opponent: 0 | 1 = active === 0 ? 1 : 0;
  const players = state.players;
  const cards = buildingsFor(state.mode);
  const ch: ResolveChoices = choices ?? {};

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

  // 副作用集合(贯穿整个结算)
  let trade: IncomeBreakdown['trade'];
  const effects: NonNullable<IncomeBreakdown['effects']> = {};

  // 装修态恢复:对每张"装修中"的卡,只要本次触发条件命中,就排在 effects.renovationRestores
  // 中等待 finalize 时减计;本回合该卡仍不结算(等同 countOf 自动过滤,无需额外判定)
  {
    const restores: NonNullable<IncomeBreakdown['effects']>['renovationRestores'] = [];
    for (const pid of [0, 1] as const) {
      const p = players[pid];
      const ur = p.underRenovation ?? {};
      for (const [bid, n] of Object.entries(ur)) {
        if (!n || n <= 0) continue;
        const c = CATALOG.byId[bid];
        if (!c) continue;
        if (!c.activation.includes(sum)) continue;
        // 颜色触发条件:绿/紫=自骰命中,蓝=任何人,红=对手骰
        let triggered = false;
        if (c.color === 'green' || c.color === 'purple') triggered = pid === active;
        else if (c.color === 'blue') triggered = true;
        else if (c.color === 'red') triggered = pid !== active;
        if (!triggered) continue;
        restores.push({ playerId: pid, buildingId: bid, count: n });
        const ownerName = pid === active ? '己方' : '对手';
        items[active].push({
          cardName: `🛠️ ${ownerName}「${c.name}」装修恢复 ×${n}(本回合不结算)`,
          count: n,
          delta: 0,
          category: 'purple-coin',
        });
      }
    }
    if (restores.length > 0) effects.renovationRestores = restores;
  }

  // 1. 红色:对手的红色建筑从主动玩家身上抢钱
  for (const card of cards) {
    if (card.color !== 'red' || !card.activation.includes(sum)) continue;
    if (card.requiresHarbor && !players[opponent].landmarks.harbor) continue;
    const owner = opponent;
    const cnt = countOf(players[owner], card.id);
    if (cnt === 0) continue;
    // 百万富翁 · 法国餐厅:对方需 ≥2 地标才生效
    if (card.id === 'french_rest' && builtLandmarkCount(players[active]) < 2) continue;
    // 百万富翁 · 会员俱乐部:对方需 ≥3 地标才生效
    if (card.id === 'members_club' && builtLandmarkCount(players[active]) < 3) continue;
    let per: number;
    if (card.id === 'cafe') per = 1;
    else if (card.id === 'restaurant') per = 2;
    else if (card.id === 'pizza_joint') per = 1;
    else if (card.id === 'hamburger') per = 1;
    else if (card.id === 'sushi_bar') per = 3;
    else if (card.id === 'french_rest') per = 5;
    else if (card.id === 'members_club') per = -1; // 特殊:抢光对方所有钱(下面单独处理)
    else per = 1;
    if (card.id === 'members_club') {
      // 抢光对方所有钱(只能抢一次,无视 cnt 张数 — 但若有多张,理论上只触发一次"抢光")
      const got = tryTransfer(active, owner, coins[active]);
      if (got > 0) {
        items[owner].push({ cardName: card.name, count: cnt, delta: got, category: 'red' });
        items[active].push({ cardName: `被「${card.name}」抢光`, count: cnt, delta: -got, category: 'red' });
      }
      continue;
    }
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
      // 百万富翁 · 玉米田:仅在该玩家 ≤1 地标时生效
      if (card.id === 'corn_field' && builtLandmarkCount(players[pid]) > 1) continue;
      let per = 0;
      if (card.id === 'wheat_field' || card.id === 'ranch' || card.id === 'forest') per = 1;
      else if (card.id === 'mine') per = 5;
      else if (card.id === 'apple_orchard') per = 3;
      else if (card.id === 'flower_orch') per = 1;
      else if (card.id === 'mackerel_boat') per = 3;
      else if (card.id === 'tuna_boat') {
        // 港口扩展 金枪鱼船:全员另投 2 颗骰子,按其和收币(每张 +sum)
        per = tunaRoll ?? 0;
      }
      else if (card.id === 'corn_field') per = 1;
      else if (card.id === 'vineyard') per = 3;
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
    // 百万富翁 · 杂货店:仅在你 ≤1 地标时生效
    if (card.id === 'general_store' && builtLandmarkCount(me) > 1) continue;
    let perCardBase = 0;
    if (card.id === 'bakery') perCardBase = 1;
    else if (card.id === 'convenience') perCardBase = 3;
    else if (card.id === 'cheese_factory') perCardBase = 3 * countOf(me, 'ranch');
    else if (card.id === 'furniture') perCardBase = 3 * (countOf(me, 'forest') + countOf(me, 'mine'));
    else if (card.id === 'market') perCardBase = 3 * (
      countOf(me, 'wheat_field') + countOf(me, 'apple_orchard')
      + countOf(me, 'flower_orch') + countOf(me, 'corn_field') + countOf(me, 'vineyard')
    );
    else if (card.id === 'flower_shop') perCardBase = 1 * countOf(me, 'flower_orch');
    else if (card.id === 'food_warehouse') perCardBase = 2 * cupSymbolCount(state, me);
    // 百万富翁 · 杂货店 +2 币
    else if (card.id === 'general_store') perCardBase = 2;
    // 百万富翁 · 葡萄酒庄:每张葡萄园 +6 币;触发后此卡进入装修态(在 resolve 中处理)
    else if (card.id === 'winery') perCardBase = 6 * countOf(me, 'vineyard');
    // 百万富翁 · 饮料工厂:仅自己骰 11,从银行获得"全场杯型总数 × ownerCnt"金币(由下面专门分支处理,这里不出钱)
    else if (card.id === 'soda_factory') perCardBase = 0;
    // 百万富翁 · 拆迁公司 / 借贷公司 / 搬家公司:这些不走"标准 perCard × cnt" — 在下面专门处理
    else if (card.id === 'demolition' || card.id === 'loan_office' || card.id === 'moving_co') perCardBase = 0;
    const perCard = perCardBase + cupBonus(me, card.id);
    const gain = perCard * cnt;
    if (gain > 0) {
      coins[active] += gain;
      items[active].push({ cardName: card.name, count: cnt, delta: gain, category: 'green' });
      // 葡萄酒庄触发后所有 winery 进入装修态
      if (card.id === 'winery') effects.wineryRenovate = true;
    }
  }

  // 3.5 百万富翁特殊绿/蓝色机制
  // 拆迁公司(自骰 4):每张让你拆 1 座地标 + 银行付 8 币
  for (const card of cards) {
    if (card.id !== 'demolition' || !card.activation.includes(sum)) continue;
    const me = players[active];
    const cnt = countOf(me, card.id);
    if (cnt === 0) continue;
    // 计算最多能拆几座(可拆 = 自建非默认地标 数)
    const demolishable = Object.entries(me.landmarks)
      .filter(([id, built]) => built && CATALOG.landmarkById[id] && !CATALOG.landmarkById[id].builtByDefault)
      .map(([id]) => id);
    const triggers = Math.min(cnt, demolishable.length);
    if (triggers === 0) continue;
    // 玩家未做出全部选择前,只显示占位,不真正应用拆除/收益
    const userPicks = ch.demolishLandmarkIds ?? [];
    if (userPicks.length < triggers) {
      items[active].push({
        cardName: `${card.name}:等待选择要拆除的地标…`,
        count: cnt,
        delta: 0,
        category: 'green',
      });
      continue;
    }
    const chosen = userPicks.slice(0, triggers);
    const actualCount = chosen.length;
    if (actualCount === 0) continue;
    const gain = actualCount * 8;
    coins[active] += gain;
    items[active].push({
      cardName: `${card.name}(拆 ${chosen.map((id) => `「${CATALOG.landmarkById[id]?.name ?? id}」`).join('')})`,
      count: cnt,
      delta: gain,
      category: 'green',
    });
    effects.demolish = (effects.demolish ?? 0) + actualCount;
    effects.demolishLandmarkIds = chosen.slice(0, actualCount);
  }
  // 借贷公司(自骰 5-6):每张付每位对手 2 币
  for (const card of cards) {
    if (card.id !== 'loan_office' || !card.activation.includes(sum)) continue;
    const me = players[active];
    const cnt = countOf(me, card.id);
    if (cnt === 0) continue;
    const total = 2 * cnt;
    const got = tryTransfer(active, opponent, total);
    if (got > 0) {
      items[active].push({ cardName: card.name, count: cnt, delta: -got, category: 'green' });
      items[opponent].push({ cardName: `对手「${card.name}」补贴`, count: cnt, delta: got, category: 'green' });
    }
  }
  // 搬家公司(自骰 9-10):每张让你送一张非紫给对手 → 从他拿 4 币
  for (const card of cards) {
    if (card.id !== 'moving_co' || !card.activation.includes(sum)) continue;
    const me = players[active];
    const cnt = countOf(me, card.id);
    if (cnt === 0) continue;
    // 检查是否有可送出的非紫卡;没有则跳过(detect 阶段也会跳过)
    const myNonPurple = Object.entries(me.buildings)
      .filter(([id, n]) => n > 0 && CATALOG.byId[id] && CATALOG.byId[id].color !== 'purple');
    if (myNonPurple.length === 0) continue;
    // 玩家未做出全部选择前,只显示占位
    const userPicks = ch.movingGiveIds ?? [];
    if (userPicks.length < cnt) {
      items[active].push({
        cardName: `${card.name}:等待选择要送出的卡牌…`,
        count: cnt,
        delta: 0,
        category: 'green',
      });
      continue;
    }
    // 玩家已选;校验持有性,过滤无效项
    const owned: Record<string, number> = {};
    for (const [id, n] of myNonPurple) {
      owned[id] = n;
    }
    const giveIds: string[] = [];
    for (const id of userPicks.slice(0, cnt)) {
      if ((owned[id] ?? 0) > 0) {
        owned[id]! -= 1;
        giveIds.push(id);
      }
    }
    if (giveIds.length === 0) continue;
    const got = tryTransfer(opponent, active, 4 * giveIds.length);
    items[active].push({
      cardName: `${card.name}:送出 ${giveIds.map((id) => `「${CATALOG.byId[id].name}」`).join('')}`,
      count: giveIds.length,
      delta: got,
      category: 'green',
    });
    items[opponent].push({
      cardName: `对手「${card.name}」送来 ${giveIds.map((id) => `「${CATALOG.byId[id].name}」`).join('')}`,
      count: giveIds.length,
      delta: -got,
      category: 'green',
    });
    effects.movingGiveIds = (effects.movingGiveIds ?? []).concat(giveIds);
  }
  // 饮料工厂(自骰 11):仅主动玩家(掷骰者)结算,从银行获得 (全场所有玩家 ☕杯型总数) × ownerCnt 金币
  for (const card of cards) {
    if (card.id !== 'soda_factory' || !card.activation.includes(sum)) continue;
    const ownerCnt = countOf(players[active], card.id);
    if (ownerCnt === 0) continue;
    const allCup = cupSymbolCount(state, players[0]) + cupSymbolCount(state, players[1]);
    const gain = ownerCnt * allCup * 1;
    if (gain > 0) {
      coins[active] += gain;
      items[active].push({ cardName: `${card.name}(全场 ☕×${allCup})`, count: ownerCnt, delta: gain, category: 'green' });
    }
  }

  // 4. 紫色:仅主动玩家触发
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
        // 仅当玩家两步选择都已落定,才生成真正的交换;否则在预览中显示占位,等待玩家决策
        const giveOk =
          ch.businessGiveId
          && (me.buildings[ch.businessGiveId] ?? 0) > 0
          && CATALOG.byId[ch.businessGiveId]?.color !== 'purple';
        const takeOk =
          ch.businessTakeId
          && (players[opponent].buildings[ch.businessTakeId] ?? 0) > 0
          && CATALOG.byId[ch.businessTakeId]?.color !== 'purple';
        if (giveOk && takeOk) {
          const give = ch.businessGiveId!;
          const take = ch.businessTakeId!;
          trade = { giveId: give, takeId: take };
          items[active].push({
            cardName: `商业中心:换得「${CATALOG.byId[take].name}」,送出「${CATALOG.byId[give].name}」`,
            count: 1,
            delta: 0,
            category: 'purple-trade',
          });
          items[opponent].push({
            cardName: `被商业中心交换:失去「${CATALOG.byId[take].name}」,获得「${CATALOG.byId[give].name}」`,
            count: 1,
            delta: 0,
            category: 'purple-trade',
          });
        } else {
          // 等待玩家决策的占位条目(仅用于预览,不影响真实状态)
          items[active].push({
            cardName: '商业中心:等待选择交换的卡牌…',
            count: 1,
            delta: 0,
            category: 'purple-trade',
          });
          items[opponent].push({
            cardName: '商业中心:等待对方选择…',
            count: 1,
            delta: 0,
            category: 'purple-trade',
          });
        }
      }
    } else if (card.id === 'publisher') {
      // 港口扩展 出版社(修订版):对手每张「☕ cup + 🥐 bread」建筑各让你抢 1 币
      const cupN = cupLikeSymbolCount(state, players[opponent]);
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
    } else if (card.id === 'renovation') {
      // 装修公司(自骰 8):选定一名对手某种非紫卡;从该对手收 1 币/张;这些卡进入装修态
      const oppNonPurple = Object.entries(players[opponent].buildings)
        .filter(([id, n]) => {
          if (n <= 0) return false;
          const c = CATALOG.byId[id];
          if (!c || c.color === 'purple') return false;
          // 只列出还有"非装修态"张数可锁的卡
          return countOf(players[opponent], id) > 0;
        })
        .map(([id]) => ({ id, n: countOf(players[opponent], id) }));
      if (oppNonPurple.length === 0) continue;
      // 玩家未选定锁定目标前,只显示占位,不收税也不进入装修态
      if (!ch.renovationLockId || !oppNonPurple.some((x) => x.id === ch.renovationLockId)) {
        items[active].push({
          cardName: `${card.name}:等待选择要装修的卡牌…`,
          count: 1,
          delta: 0,
          category: 'purple-coin',
        });
        continue;
      }
      const lockId = ch.renovationLockId;
      const targetN = oppNonPurple.find((x) => x.id === lockId)!.n;
      const owe = targetN * 1;
      const got = tryTransfer(opponent, active, owe);
      if (got > 0) {
        items[active].push({
          cardName: `${card.name}(装修「${CATALOG.byId[lockId].name}」×${targetN})`,
          count: targetN,
          delta: got,
          category: 'purple-coin',
        });
        items[opponent].push({
          cardName: `被${card.name}装修 ${targetN} 张「${CATALOG.byId[lockId].name}」`,
          count: targetN,
          delta: -got,
          category: 'purple-coin',
        });
      } else {
        items[active].push({
          cardName: `${card.name}(装修「${CATALOG.byId[lockId].name}」×${targetN})`,
          count: targetN,
          delta: 0,
          category: 'purple-coin',
        });
      }
      effects.renovationTarget = { playerId: opponent, buildingId: lockId };
    } else if (card.id === 'tech_startup') {
      // 科技公司:自骰 10 不再产生主动效果(投资行为已迁移到 build 阶段);
      // 真正的"抽税"逻辑在下面"对手骰 10 时主动玩家收钱"分支
      // 这里什么也不做
    } else if (card.id === 'exhibit_hall') {
      // 会展中心(自骰 10):激活己方一种非紫色建筑的全部张数,然后将本卡放回市场卡库
      // 收益按"该卡平时一次完整触发"计算(蓝/绿正常 +币;红色因主动触发者=自己,跳过抢钱)
      const me = players[active];
      const myNonPurple = Object.entries(me.buildings)
        .filter(([id, n]) => n > 0 && CATALOG.byId[id] && CATALOG.byId[id].color !== 'purple')
        .map(([id, n]) => ({ id, n, cost: CATALOG.byId[id].cost, color: CATALOG.byId[id].color }));
      if (myNonPurple.length === 0) continue;
      // 玩家未选定要激活的卡前,只显示占位
      if (!ch.exhibitActivateId || !myNonPurple.some((x) => x.id === ch.exhibitActivateId)) {
        items[active].push({
          cardName: `${card.name}:等待选择要激活的己方建筑…`,
          count: 1,
          delta: 0,
          category: 'purple-coin',
        });
        continue;
      }
      const actId = ch.exhibitActivateId;
      const targetCard = CATALOG.byId[actId];
      const targetN = myNonPurple.find((x) => x.id === actId)!.n;
      // 计算"按 targetN 张该卡触发一次"的单张产出
      let perCardBase = 0;
      if (targetCard.color === 'blue') {
        if (actId === 'wheat_field' || actId === 'ranch' || actId === 'forest' || actId === 'flower_orch') perCardBase = 1;
        else if (actId === 'mine') perCardBase = 5;
        else if (actId === 'apple_orchard' || actId === 'vineyard') perCardBase = 3;
        else if (actId === 'mackerel_boat') perCardBase = me.landmarks.harbor ? 3 : 0;
        else if (actId === 'tuna_boat') perCardBase = me.landmarks.harbor ? (getTunaRoll(state)) : 0;
        else if (actId === 'corn_field') perCardBase = builtLandmarkCount(me) <= 1 ? 1 : 0;
      } else if (targetCard.color === 'green') {
        if (actId === 'bakery') perCardBase = 1;
        else if (actId === 'convenience') perCardBase = 3;
        else if (actId === 'cheese_factory') perCardBase = 3 * countOf(me, 'ranch');
        else if (actId === 'furniture') perCardBase = 3 * (countOf(me, 'forest') + countOf(me, 'mine'));
        else if (actId === 'market') perCardBase = 3 * (
          countOf(me, 'wheat_field') + countOf(me, 'apple_orchard')
          + countOf(me, 'flower_orch') + countOf(me, 'corn_field') + countOf(me, 'vineyard')
        );
        else if (actId === 'flower_shop') perCardBase = 1 * countOf(me, 'flower_orch');
        else if (actId === 'food_warehouse') perCardBase = 2 * cupSymbolCount(state, me);
        else if (actId === 'general_store') perCardBase = builtLandmarkCount(me) <= 1 ? 2 : 0;
        else if (actId === 'winery') perCardBase = 6 * countOf(me, 'vineyard');
        // demolition / loan_office / moving_co / soda_factory:有特殊结构,会展中心简化为不触发,避免循环依赖
      }
      // 红色不抢钱(用户确认:激活红卡不抢)
      const perCard = perCardBase + cupBonus(me, actId);
      const gain = perCard * targetN;
      if (gain > 0) {
        coins[active] += gain;
        items[active].push({
          cardName: `${card.name}(激活「${targetCard.name}」×${targetN})`,
          count: targetN,
          delta: gain,
          category: 'purple-coin',
        });
      } else {
        items[active].push({
          cardName: `${card.name}(激活「${targetCard.name}」×${targetN})`,
          count: targetN,
          delta: 0,
          category: 'purple-coin',
        });
      }
      // 标记本次会展中心被消耗
      effects.exhibitConsumed = true;
    } else if (card.id === 'park') {
      // 公园(自骰 11-13):全场金币均分(向上取整)
      effects.parkRedistribute = true;
      items[active].push({
        cardName: `${card.name}(均分全场金币)`,
        count: 1,
        delta: 0,
        category: 'purple-coin',
      });
    }
  }

  // 科技公司(自骰 10):**主动玩家**(active = 掷骰者)若持有此卡,按累计 techMarkers 数从对手处收钱;**标记不清零**(每次自骰 10 都按当前累计数继续抽税,可叠加)
  {
    const techCard = cards.find((c) => c.id === 'tech_startup');
    if (techCard && techCard.activation.includes(sum)) {
      const markers = players[active].techMarkers ?? 0;
      const cntT = countOf(players[active], 'tech_startup');
      if (cntT > 0 && markers > 0) {
        const got = tryTransfer(opponent, active, markers);
        if (got > 0) {
          items[active].push({
            cardName: `${techCard.name}(累计 ${markers} 标记)`,
            count: cntT,
            delta: got,
            category: 'purple-coin',
          });
          items[opponent].push({
            cardName: `被${techCard.name}抽 ${markers} 币`,
            count: cntT,
            delta: -got,
            category: 'purple-coin',
          });
          // 不再清零 techMarkers
        }
      }
    }
  }

  // 公园副作用:在 items 写完之后均分(以"结算后"金币为基准)
  if (effects.parkRedistribute) {
    const total = coins[0] + coins[1];
    const half = Math.ceil(total / 2);
    const newA = half;
    const newB = total - half;
    const da = newA - coins[0];
    const db = newB - coins[1];
    coins[0] = newA;
    coins[1] = newB;
    if (da !== 0) items[0].push({ cardName: '公园·均分调整', count: 1, delta: da, category: 'purple-coin' });
    if (db !== 0) items[1].push({ cardName: '公园·均分调整', count: 1, delta: db, category: 'purple-coin' });
  }

  const extraTurn =
    !!state.lastRoll.isDouble && !!players[active].landmarks.amusement;

  return {
    items,
    delta: [coins[0] - players[0].coins, coins[1] - players[1].coins],
    trade,
    extraTurn,
    tunaRoll,
    effects: Object.keys(effects).length > 0 ? effects : undefined,
  };
}

/** 仅在 resolve 阶段提供预览;其他阶段返回空 */
export function previewIncome(state: GameState): IncomeBreakdown | null {
  if (state.phase !== 'resolve' || !state.lastRoll) return null;
  return computeIncomeBreakdown(state, state._resolvedChoices);
}

/**
 * 检测本回合 resolve 阶段需要玩家做出的选择(百万富翁扩展)
 * 返回需要 UI 处理的 PendingChoice 数组(顺序即提示顺序)
 */
function detectPendingChoices(state: GameState): PendingChoice[] {
  const out: PendingChoice[] = [];
  if (!state.lastRoll) return out;
  const sum = state.lastRoll.sum;
  const active = state.active;
  const opponent: 0 | 1 = active === 0 ? 1 : 0;
  const me = state.players[active];
  const opp = state.players[opponent];
  const cards = buildingsFor(state.mode);

  const has = (id: string) => cards.find((c) => c.id === id);

  // 拆迁公司:自骰 4,且至少有一座可拆地标
  if (has('demolition') && has('demolition')!.activation.includes(sum)
     
      && countOf(me, 'demolition') > 0) {
    const demolishable = Object.entries(me.landmarks)
      .filter(([id, built]) => built && CATALOG.landmarkById[id] && !CATALOG.landmarkById[id].builtByDefault)
      .map(([id]) => id);
    if (demolishable.length > 0) {
      // 多张拆迁:每张一个选择
      const triggers = Math.min(countOf(me, 'demolition'), demolishable.length);
      for (let i = 0; i < triggers; i++) {
        out.push({ kind: 'demolish', playerId: active, options: [...demolishable] });
      }
    }
  }

  // 搬家公司:自骰 9-10,且自有非紫卡
  if (has('moving_co') && has('moving_co')!.activation.includes(sum)
     
      && countOf(me, 'moving_co') > 0) {
    const myNonPurple = Object.entries(me.buildings)
      .filter(([id, n]) => n > 0 && CATALOG.byId[id] && CATALOG.byId[id].color !== 'purple')
      .map(([id]) => id);
    if (myNonPurple.length > 0) {
      const triggers = countOf(me, 'moving_co');
      for (let i = 0; i < triggers; i++) {
        out.push({ kind: 'moving', playerId: active, options: myNonPurple });
      }
    }
  }

  // 装修公司:自骰 8,且对手有可装修(非紫且仍有"非装修态"张数)的卡
  if (has('renovation') && has('renovation')!.activation.includes(sum)
      && countOf(me, 'renovation') > 0) {
    const oppNonPurple = Object.entries(opp.buildings)
      .filter(([id, n]) => {
        if (n <= 0) return false;
        const c = CATALOG.byId[id];
        if (!c || c.color === 'purple') return false;
        return countOf(opp, id) > 0;
      })
      .map(([id]) => id);
    if (oppNonPurple.length > 0) {
      out.push({ kind: 'renovation', playerId: active, options: oppNonPurple });
    }
  }

  // 会展中心:自骰 10,且己方有非紫卡可激活
  if (has('exhibit_hall') && has('exhibit_hall')!.activation.includes(sum)
      && countOf(me, 'exhibit_hall') > 0) {
    const myNonPurpleForExhibit = Object.entries(me.buildings)
      .filter(([id, n]) => n > 0 && CATALOG.byId[id] && CATALOG.byId[id].color !== 'purple')
      .map(([id]) => id);
    if (myNonPurpleForExhibit.length > 0) {
      out.push({ kind: 'exhibit', playerId: active, options: myNonPurpleForExhibit });
    }
  }

  // 科技公司:已迁移到 build 阶段主动投资,不再通过 PendingChoice 处理

  // 商业中心(基础紫 6):双方都有非紫卡时,主动玩家选要换的双方卡牌
  if (has('business_ctr') && has('business_ctr')!.activation.includes(sum)
     
      && countOf(me, 'business_ctr') > 0) {
    const myNonPurple = Object.entries(me.buildings)
      .filter(([id, n]) => n > 0 && CATALOG.byId[id] && CATALOG.byId[id].color !== 'purple')
      .map(([id]) => id);
    const oppNonPurple = Object.entries(opp.buildings)
      .filter(([id, n]) => n > 0 && CATALOG.byId[id] && CATALOG.byId[id].color !== 'purple')
      .map(([id]) => id);
    if (myNonPurple.length > 0 && oppNonPurple.length > 0) {
      out.push({ kind: 'business_take', playerId: active, options: oppNonPurple });
      // give 步骤动态填充:在 submit business_take 时再 push,避免 stale options
    }
  }

  return out;
}

/** UI 调用:玩家提交一个选择,推进 pendingChoices 队列;空了则真正应用收益 */
export function submitChoice(
  state: GameState,
  payload:
    | { kind: 'demolish'; landmarkId: string }
    | { kind: 'moving'; buildingId: string }
    | { kind: 'renovation'; buildingId: string }
    | { kind: 'exhibit'; buildingId: string }
    | { kind: 'business_take'; buildingId: string }
    | { kind: 'business_give'; buildingId: string }
): GameState {
  if (state.phase !== 'resolve' || !state.pendingChoices || state.pendingChoices.length === 0) return state;
  const head = state.pendingChoices[0];
  if (head.kind !== payload.kind) return state;
  const s = cloneState(state);
  const rc: ResolveChoices = s._resolvedChoices ?? {};
  // 把选择写入累加器
  if (payload.kind === 'demolish') {
    rc.demolishLandmarkIds = (rc.demolishLandmarkIds ?? []).concat(payload.landmarkId);
  } else if (payload.kind === 'moving') {
    rc.movingGiveIds = (rc.movingGiveIds ?? []).concat(payload.buildingId);
  } else if (payload.kind === 'renovation') {
    rc.renovationLockId = payload.buildingId;
  } else if (payload.kind === 'exhibit') {
    rc.exhibitActivateId = payload.buildingId;
  } else if (payload.kind === 'business_take') {
    rc.businessTakeId = payload.buildingId;
    // 追加第二步:从己方非紫卡里选一张送出去
    const me = s.players[s.active];
    const myNonPurple = Object.entries(me.buildings)
      .filter(([id, n]) => n > 0 && CATALOG.byId[id] && CATALOG.byId[id].color !== 'purple')
      .map(([id]) => id);
    s.pendingChoices = s.pendingChoices!.slice(1);
    s.pendingChoices.unshift({ kind: 'business_give', playerId: s.active, options: myNonPurple });
    s._resolvedChoices = rc;
    return s;
  } else if (payload.kind === 'business_give') {
    rc.businessGiveId = payload.buildingId;
  }
  s._resolvedChoices = rc;
  s.pendingChoices = s.pendingChoices!.slice(1);
  if (s.pendingChoices.length === 0) {
    return finalizeResolve(s);
  }
  return s;
}

/** 内部:已无 pendingChoices,执行真正的收益结算 */
function finalizeResolve(state: GameState): GameState {
  const breakdown = computeIncomeBreakdown(state, state._resolvedChoices);
  const s = cloneState(state);
  const active = s.active;
  const opponent: 0 | 1 = active === 0 ? 1 : 0;

  // 应用金币变化
  s.players[0].coins += breakdown.delta[0];
  s.players[1].coins += breakdown.delta[1];

  if (breakdown.tunaRoll !== undefined) {
    pushLog(s, active, `🐟 金枪鱼船:额外投 2 骰 = ${breakdown.tunaRoll}`);
  }

  // 写日志
  for (const pid of [0, 1] as const) {
    for (const item of breakdown.items[pid]) {
      if (item.category === 'purple-trade' || item.delta !== 0) {
        const sign = item.delta > 0 ? `+${item.delta}` : item.delta < 0 ? `${item.delta}` : '';
        const text = item.delta === 0 ? item.cardName : `${item.cardName} ×${item.count} ${sign} 币`;
        pushLog(s, pid, text);
      }
    }
  }

  // 商业中心交换
  if (breakdown.trade) {
    const { giveId, takeId } = breakdown.trade;
    const me = s.players[active];
    const opp = s.players[opponent];
    me.buildings[giveId] = (me.buildings[giveId] ?? 0) - 1;
    me.buildings[takeId] = (me.buildings[takeId] ?? 0) + 1;
    opp.buildings[takeId] = (opp.buildings[takeId] ?? 0) - 1;
    opp.buildings[giveId] = (opp.buildings[giveId] ?? 0) + 1;
  }

  // 百万富翁副作用
  if (breakdown.effects) {
    const eff = breakdown.effects;
    const me = s.players[active];
    const opp = s.players[opponent];

    // 装修态恢复:把装修中的卡张数减回去(本回合该卡未结算)
    if (eff.renovationRestores && eff.renovationRestores.length > 0) {
      for (const r of eff.renovationRestores) {
        const tp = s.players[r.playerId];
        if (!tp.underRenovation) continue;
        const cur = tp.underRenovation[r.buildingId] ?? 0;
        const dec = Math.min(cur, r.count);
        if (dec > 0) {
          tp.underRenovation[r.buildingId] = cur - dec;
          if (tp.underRenovation[r.buildingId] === 0) delete tp.underRenovation[r.buildingId];
          const cName = CATALOG.byId[r.buildingId]?.name ?? r.buildingId;
          pushLog(s, active, `🛠️ ${tp.name}「${cName}」装修完成 ×${dec}(本回合未结算)`);
        }
      }
    }
    if (eff.wineryRenovate) {
      const cnt = me.buildings['winery'] ?? 0;
      if (cnt > 0) {
        if (!me.underRenovation) me.underRenovation = {};
        // 注:此处把"未装修的所有 winery"全部进入装修态 — 即 cnt 减去当前 underRenovation
        const already = me.underRenovation['winery'] ?? 0;
        const add = Math.max(0, cnt - already);
        me.underRenovation['winery'] = already + add;
        if (add > 0) pushLog(s, active, `🍷 葡萄酒庄触发后进入装修态 ×${add}`);
      }
    }
    if (eff.demolish && eff.demolish > 0) {
      const fallback = Object.entries(me.landmarks)
        .filter(([id, built]) => built && CATALOG.landmarkById[id] && !CATALOG.landmarkById[id].builtByDefault)
        .map(([id]) => id)
        .sort((a, b) => CATALOG.landmarkById[b].cost - CATALOG.landmarkById[a].cost);
      const list = eff.demolishLandmarkIds && eff.demolishLandmarkIds.length > 0
        ? eff.demolishLandmarkIds
        : fallback;
      const n = Math.min(eff.demolish, list.length);
      for (let i = 0; i < n; i++) {
        const id = list[i];
        if (me.landmarks[id]) {
          me.landmarks[id] = false;
          pushLog(s, active, `🚧 拆迁公司:拆除地标「${CATALOG.landmarkById[id].name}」`);
        }
      }
    }
    if (eff.movingGiveIds && eff.movingGiveIds.length > 0) {
      for (const id of eff.movingGiveIds) {
        if ((me.buildings[id] ?? 0) > 0) {
          me.buildings[id]! -= 1;
          opp.buildings[id] = (opp.buildings[id] ?? 0) + 1;
        }
      }
    }
    // 装修公司:把目标对手的对应卡牌全部"未装修张"放入装修态
    if (eff.renovationTarget) {
      const { playerId: tgt, buildingId: bid } = eff.renovationTarget;
      const tp = s.players[tgt];
      const total = tp.buildings[bid] ?? 0;
      const already = tp.underRenovation?.[bid] ?? 0;
      const add = Math.max(0, total - already);
      if (add > 0) {
        if (!tp.underRenovation) tp.underRenovation = {};
        tp.underRenovation[bid] = already + add;
        pushLog(s, active, `🛠️ 装修公司:对手「${tp.name}」的「${CATALOG.byId[bid].name}」进入装修态 ×${add}`);
      }
    }
    // 会展中心:每次触发消耗 1 张,放回市场卡库
    if (eff.exhibitConsumed && (me.buildings['exhibit_hall'] ?? 0) > 0) {
      me.buildings['exhibit_hall']! -= 1;
      if (s.market) {
        // 把 1 张放回 deck 顶部并触发补牌
        s.market.deck.push('exhibit_hall');
        s.supply['exhibit_hall'] = (s.supply['exhibit_hall'] ?? 0) + 1;
        // 重新进入"摊上若有空位则补出该卡"的判定
        // 复用 takeFromMarket 风格:先不挪 displayed,只 refill 让 deck 顶若 ≤ 10 种自然补出
        // 直接触发一次 refill:利用现有 helper(displayed 暂时移除一个最少种也行,这里简单调用 takeFromMarket 反向不合适)
        // 简化:直接把 supply ++ 即视为"已放回 deck",刷新 displayed 让其上摊:
        // —— 若 displayed 已含 exhibit_hall,supply++ 即生效;若不含,把 deck 顶部该 id 推入 displayed(若位置不满)
        if (!s.market.displayed.includes('exhibit_hall') && s.market.displayed.length < 10) {
          s.market.displayed.push('exhibit_hall');
        }
      }
      pushLog(s, active, `🏟️ 会展中心:激活后将 1 张本卡放回市场`);
    }
  }

  if (breakdown.extraTurn) {
    s.extraTurnPending = true;
    pushLog(s, active, '游乐园:豹子触发,本回合结束后再行动一次');
  }

  applyCityHall(s, active);

  // 清理 pending / resolved 缓存
  delete s.pendingChoices;
  delete s._resolvedChoices;

  s.phase = 'build';
  return s;
}

/**
 * 应用所有收益(基于 computeIncomeBreakdown 的结果)
 * 若有待用户决策项(百万富翁卡),只设置 pendingChoices,等用户决策完再 finalizeResolve
 */
export function resolveIncome(state: GameState): GameState {
  if (state.phase !== 'resolve' || !state.lastRoll) return state;
  // 第一次进入 resolve:检测是否有 pending 选择
  if (!state.pendingChoices) {
    const choices = detectPendingChoices(state);
    if (choices.length > 0) {
      const s = cloneState(state);
      s.pendingChoices = choices;
      s._resolvedChoices = {};
      return s;
    }
  } else if (state.pendingChoices.length > 0) {
    // 还有未决项,直接返回(等 UI 调 submitChoice)
    return state;
  }
  // 无任何待决项:直接执行
  return finalizeResolve(state);
}

/** 市政厅:若进入建造阶段时金币 <1,自动补到 1(harbor / millionaire / all 模式生效) */
function applyCityHall(s: GameState, pid: 0 | 1): void {
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
  if (!buildingsFor(state.mode).some((c) => c.id === cardId)) return state;
  if ((state.supply[cardId] ?? 0) <= 0) return state;
  // 启用 10 种统一市场的模式:必须在市场展示位上才能购买
  if (usesUnifiedMarket(state.mode) && state.market) {
    if (!state.market.displayed.includes(cardId)) return state;
  }

  const me = state.players[state.active];
  if (me.coins < card.cost) return state;
  // 紫色每位玩家上限 1 张
  if (card.color === 'purple' && (me.buildings[cardId] ?? 0) >= 1) return state;

  const s = cloneState(state);
  // 借贷公司:cost 为负 → 购买时获得金币(银行付玩家);其余正常扣费
  s.players[s.active].coins -= card.cost;
  s.players[s.active].buildings[cardId] = (s.players[s.active].buildings[cardId] ?? 0) + 1;
  s.supply[cardId] -= 1;
  s.builtThisTurn = true;
  // 修复:新买的一张该卡应是"非装修态"(有效张)
  // 等价于不增加 underRenovation 计数,因此不需特殊处理 — buildings ++ 就自动多 1 张有效
  const me2 = s.players[s.active];
  void me2;
  if (card.cost < 0) {
    pushLog(s, s.active, `购买了「${card.name}」(从银行获得 ${-card.cost} 币)`);
  } else {
    pushLog(s, s.active, `购买了「${card.name}」(花费 ${card.cost} 币)`);
  }
  // 市场补牌
  if (s.market) takeFromMarket(s.market, s.supply, cardId, s.turn);
  return endTurnInternal(s);
}

export function buyLandmark(state: GameState, landmarkId: string): GameState {
  if (state.phase !== 'build') return state;
  const lm = CATALOG.landmarkById[landmarkId];
  if (!lm) return state;
  // 只有当前模式拥有的地标才能买
  if (!getLandmarks(state.mode).some((l) => l.id === landmarkId)) return state;
  if (lm.builtByDefault) return state; // 默认建成的不能再"购买"
  const me = state.players[state.active];
  if (me.landmarks[landmarkId]) return state;
  if (me.coins < lm.cost) return state;

  const s = cloneState(state);
  s.players[s.active].coins -= lm.cost;
  s.players[s.active].landmarks[landmarkId] = true;
  s.builtThisTurn = true;
  pushLog(s, s.active, `建成地标「${lm.name}」!`);

  // 胜利判定:建成全部"可购买"地标(港口扩展 中默认建成的不计入目标)
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

/**
 * 科技公司:build 阶段主动投资 1 币,techMarkers +1
 *  - 仅自己 build 阶段可调用
 *  - 必须持有 ≥1 张 tech_startup 且非装修中(countOf > 0)
 *  - 必须有 ≥1 金币
 *  - 本回合最多 1 次(techInvestedThisTurn 标志)
 */
export function investTechStartup(state: GameState): GameState {
  if (state.phase !== 'build') return state;
  if (state.techInvestedThisTurn) return state;
  const me = state.players[state.active];
  if (countOf(me, 'tech_startup') <= 0) return state;
  if (me.coins < 1) return state;
  const s = cloneState(state);
  s.players[s.active].coins -= 1;
  s.players[s.active].techMarkers = (s.players[s.active].techMarkers ?? 0) + 1;
  s.techInvestedThisTurn = true;
  pushLog(s, s.active, `💻 科技公司:投资 1 币(累计 ${s.players[s.active].techMarkers})`);
  return s;
}

export function skipBuild(state: GameState): GameState {
  if (state.phase !== 'build') return state;
  const s = cloneState(state);
  pushLog(s, s.active, '跳过建造');
  // 机场:跳过建造时,从银行获得 10 币
  if (s.players[s.active].landmarks['airport']) {
    s.players[s.active].coins += 10;
    pushLog(s, s.active, `✈️ 机场:跳过建造,从银行获得 10 币`);
  }
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
    // 注意:不在这里清 freshIds — 同玩家的"再行动"等同于继续本回合,
    // 且新一回合(对手)还没开始过,该清的逻辑统一交给下面的"切手"分支
    return s;
  }
  s.active = s.active === 0 ? 1 : 0;
  s.turn += 1;
  s.lastRoll = null;
  s.rerollUsedThisTurn = false;
  s.builtThisTurn = false;
  s.techInvestedThisTurn = false;
  s.phase = 'roll';

  // 闪光生命周期:freshIds 在被写入的那一回合产生,要保留给下一位玩家看一整回合,
  // 直到 *再下一次* 切手时才清。判定:若 freshIds 已存在 ≥ 2 回合前就清空。
  if (s.market && s.market.freshIds.length && s.turn - s.market.freshSetTurn >= 2) {
    s.market.freshIds = [];
  }
  return s;
}
