/**
 * 《骰子街》卡牌数据
 *   - 'base'   : 2012 基础版(15 种建筑 + 4 座地标)
 *   - 'harbor' : 2016 Bright Lights, Big City 合订版(港扩重制版,10 堆市场)
 *
 * 用于游戏逻辑实现与 UI 展示的单一数据源 (Single Source of Truth)
 */

export type CardColor = 'blue' | 'green' | 'red' | 'purple';

/** 游戏模式:基础版 / Bright Lights 合订版 */
export type GameMode = 'base' | 'harbor';

/**
 * 港扩里部分卡牌带"图标分类",作为其它卡的加成判定依据。
 *  - cup    ☕ 餐饮:咖啡馆、家庭餐厅、披萨店、汉堡店、寿司店
 *  - bread  🥐 面包(房屋型 🏠):面包店、便利店、花店
 *  - factory🏭 工厂:起司工厂、家具工厂、食品仓库
 *  - fruit  🍎 水果:苹果园、葡萄园、蔬果市场
 *  - fish   🐟 鱼:鲭鱼船、金枪鱼船
 *  - wheat  🌾 麦穗:麦田、苹果园、花田
 *  - cow    🐄 牛:牧场
 *  - gear   ⚙️ 齿轮:森林、矿山
 *  - major  🏢 大型(紫色)
 */
export type CardSymbol =
  | 'wheat' | 'cow' | 'gear'
  | 'cup' | 'bread' | 'factory' | 'fruit' | 'fish'
  | 'major';

export interface BuildingCard {
  id: string;
  name: string;
  color: CardColor;
  /** 触发的骰子点数(可能多个,如 2-3、9-10) */
  activation: number[];
  cost: number;
  description: string;
  /** 公共卡池中的初始数量 */
  supply: number;
  symbol: CardSymbol;
  /** 卡牌所属模式 */
  mode: 'base' | 'harbor';
  /** 是否需要"港口"才能生效(Bright Lights 中港口默认建成,但保留字段以便规则书展示) */
  requiresHarbor?: boolean;
}

export interface LandmarkCard {
  id: string;
  name: string;
  cost: number;
  description: string;
  mode: 'base' | 'harbor';
  /** Bright Lights:市政厅 / 港口默认建成,不算入"需要建造"的胜利目标 */
  builtByDefault?: boolean;
  /** 隐形地标:不在玩家面板地标格子中显示(只显示效果说明在规则页) */
  hidden?: boolean;
}

/* -------------------------------------------------------------------------- */
/*                                  地标建筑                                  */
/* -------------------------------------------------------------------------- */

/** 基础版 4 座地标 */
const BASE_LANDMARKS: LandmarkCard[] = [
  { id: 'station',     name: '火车站',   cost: 4,  description: '可选择掷 1 或 2 颗骰子',           mode: 'base' },
  { id: 'mall',        name: '购物中心', cost: 10, description: '自己的 ☕ 杯型 + 🥐 面包型建筑每张多收 1 币', mode: 'base' },
  { id: 'amusement',   name: '游乐园',   cost: 16, description: '双骰掷出豹子时,可再行动一次',     mode: 'base' },
  { id: 'radio_tower', name: '电波塔',   cost: 22, description: '每回合可选择重掷一次骰子',         mode: 'base' },
];

/**
 * Bright Lights 合订版:在基础 4 座之上额外加入 2 座**默认建成**的隐形地标。
 * 玩家不需要建造它们,但其规则永久生效。胜利条件仍为"建成全部 4 座可购买地标"。
 */
const HARBOR_DEFAULT_LANDMARKS: LandmarkCard[] = [
  {
    id: 'city_hall',
    name: '市政厅',
    cost: 0,
    description: '建造阶段开始时,若你的金币 <1,自动补到 1 币',
    mode: 'harbor',
    builtByDefault: true,
    hidden: false,
  },
  {
    id: 'harbor',
    name: '港口',
    cost: 0,
    description: '掷出 ≥10 时,可选择给点数 +2(仅双骰)',
    mode: 'harbor',
    builtByDefault: true,
    hidden: false,
  },
];

export const LANDMARKS: LandmarkCard[] = [...BASE_LANDMARKS, ...HARBOR_DEFAULT_LANDMARKS];

/* -------------------------------------------------------------------------- */
/*                                  建筑卡池                                  */
/* -------------------------------------------------------------------------- */

/** 基础版建筑(15 种) */
const BASE_BUILDINGS: BuildingCard[] = [
  // 🟦 蓝色 · 初级产业(任何人骰出都触发)
  { id: 'wheat_field',   name: '麦田',     color: 'blue',  activation: [1],     cost: 1, supply: 6, description: '+1 币',                            symbol: 'wheat',   mode: 'base' },
  { id: 'ranch',         name: '牧场',     color: 'blue',  activation: [2],     cost: 1, supply: 6, description: '+1 币',                            symbol: 'cow',     mode: 'base' },
  { id: 'forest',        name: '森林',     color: 'blue',  activation: [5],     cost: 3, supply: 6, description: '+1 币',                            symbol: 'gear',    mode: 'base' },
  { id: 'mine',          name: '矿山',     color: 'blue',  activation: [9],     cost: 6, supply: 6, description: '+5 币',                            symbol: 'gear',    mode: 'base' },
  { id: 'apple_orchard', name: '苹果园',   color: 'blue',  activation: [10],    cost: 3, supply: 6, description: '+3 币',                            symbol: 'wheat',   mode: 'base' },

  // 🟩 绿色 · 商业设施(仅自己骰出时触发)
  { id: 'bakery',        name: '面包店',   color: 'green', activation: [2, 3],  cost: 1, supply: 6, description: '+1 币(购物中心 +1)',              symbol: 'bread',   mode: 'base' },
  { id: 'convenience',   name: '便利店',   color: 'green', activation: [4],     cost: 2, supply: 6, description: '+3 币(购物中心 +1)',              symbol: 'bread',   mode: 'base' },
  { id: 'cheese_factory',name: '起司工厂', color: 'green', activation: [7],     cost: 5, supply: 6, description: '每张 🐄 牛型建筑 +3 币',           symbol: 'factory', mode: 'base' },
  { id: 'furniture',     name: '家具工厂', color: 'green', activation: [8],     cost: 3, supply: 6, description: '每张 ⚙️ 齿轮型建筑 +3 币',          symbol: 'factory', mode: 'base' },
  { id: 'market',        name: '蔬果市场', color: 'green', activation: [11,12], cost: 2, supply: 6, description: '每张 🌾 麦穗型建筑 +2 币',          symbol: 'fruit',   mode: 'base' },

  // 🟥 红色 · 餐饮业(别人骰出时,从该玩家身上抢钱)
  { id: 'cafe',          name: '咖啡馆',   color: 'red',   activation: [3],     cost: 2, supply: 6, description: '抢 1 币(购物中心 +1)',            symbol: 'cup',     mode: 'base' },
  { id: 'restaurant',    name: '家庭餐厅', color: 'red',   activation: [9,10],  cost: 3, supply: 6, description: '抢 2 币(购物中心 +1)',            symbol: 'cup',     mode: 'base' },

  // 🟪 紫色 · 大型设施(仅自己骰出时触发,每位玩家上限 1 张)
  { id: 'stadium',       name: '体育馆',   color: 'purple',activation: [6],     cost: 6, supply: 4, description: '从所有其他玩家各抢 2 币',          symbol: 'major',   mode: 'base' },
  { id: 'tv_station',    name: '电视台',   color: 'purple',activation: [6],     cost: 7, supply: 4, description: '指定一名玩家抢 5 币',              symbol: 'major',   mode: 'base' },
  { id: 'business_ctr',  name: '商业中心', color: 'purple',activation: [6],     cost: 8, supply: 4, description: '与一名玩家交换 1 张非紫色建筑',    symbol: 'major',   mode: 'base' },
];

/**
 * Bright Lights 合订版**新增**建筑(在基础 15 种之上)。
 *  - 鲭鱼船改为🟦蓝色,任何人投出 8 时触发(需港口);
 *  - 删除 fish_boat(渔船)/ flower_orch(独立花田 - 在 Bright Lights 中花田与花店成套,本实现保留花田);
 *  - 出版社的"杯型"含义扩大为 cup + bread(房屋型也含)。
 */
const HARBOR_BUILDINGS: BuildingCard[] = [
  // 🟦 蓝色
  { id: 'flower_orch',   name: '花田',     color: 'blue',  activation: [4],     cost: 2, supply: 6, description: '+1 币',                                 symbol: 'wheat', mode: 'harbor' },
  { id: 'mackerel_boat', name: '鲭鱼船',   color: 'blue',  activation: [8],     cost: 2, supply: 6, description: '建有港口时 +3 币(任何人投 8 都触发)', symbol: 'fish',  mode: 'harbor', requiresHarbor: true },
  { id: 'tuna_boat',     name: '金枪鱼船', color: 'blue',  activation: [12,13,14], cost: 5, supply: 6, description: '建有港口时,触发时另投 2 颗骰子,所有持有者按其点数和 +币', symbol: 'fish', mode: 'harbor', requiresHarbor: true },

  // 🟩 绿色
  { id: 'flower_shop',   name: '花店',     color: 'green', activation: [6],     cost: 1, supply: 6, description: '每张 🌷 花田 +1 币(购物中心 +1)',     symbol: 'bread',   mode: 'harbor' },
  { id: 'food_warehouse',name: '食品仓库', color: 'green', activation: [12,13], cost: 2, supply: 6, description: '每张 ☕ 杯型建筑 +2 币',                symbol: 'factory', mode: 'harbor' },

  // 🟥 红色
  { id: 'sushi_bar',     name: '寿司店',   color: 'red',   activation: [1],     cost: 2, supply: 6, description: '建有港口时,从掷骰者抢 3 币(购物中心 +1)', symbol: 'cup', mode: 'harbor', requiresHarbor: true },
  { id: 'pizza_joint',   name: '披萨店',   color: 'red',   activation: [7],     cost: 1, supply: 6, description: '抢 1 币(购物中心 +1)',                  symbol: 'cup',     mode: 'harbor' },
  { id: 'hamburger',     name: '汉堡店',   color: 'red',   activation: [8],     cost: 1, supply: 6, description: '抢 1 币(购物中心 +1)',                  symbol: 'cup',     mode: 'harbor' },

  // 🟪 紫色 · 港口扩展(每位玩家上限 1 张)
  { id: 'publisher',     name: '出版社',   color: 'purple',activation: [7],     cost: 5, supply: 4, description: '对手每张 ☕ 杯型 + 🥐 面包型建筑各让你抢 1 币', symbol: 'major', mode: 'harbor' },
  { id: 'tax_office',    name: '税务局',   color: 'purple',activation: [8,9],   cost: 4, supply: 4, description: '从每个 ≥10 币的对手处拿走其一半(向下取整)',  symbol: 'major', mode: 'harbor' },
];

/** 全部建筑(基础 + 港口) — 仅供 CATALOG 索引;实际可购卡牌请走 getBuildings(mode) */
export const BUILDINGS: BuildingCard[] = [...BASE_BUILDINGS, ...HARBOR_BUILDINGS];

/** 按模式获取可用建筑 */
export function getBuildings(mode: GameMode): BuildingCard[] {
  if (mode === 'base') return BASE_BUILDINGS;
  return [...BASE_BUILDINGS, ...HARBOR_BUILDINGS];
}

/** 按模式获取地标 */
export function getLandmarks(mode: GameMode): LandmarkCard[] {
  if (mode === 'base') return BASE_LANDMARKS;
  return [...BASE_LANDMARKS, ...HARBOR_DEFAULT_LANDMARKS];
}

/** 按模式获取需要"购买"的地标(用于胜利判定) — Bright Lights 仍是 4 座 */
export function getBuyableLandmarks(mode: GameMode): LandmarkCard[] {
  return getLandmarks(mode).filter((l) => !l.builtByDefault);
}

/* -------------------------------------------------------------------------- */
/*                                  汇总数据                                  */
/* -------------------------------------------------------------------------- */

export const SUPPLY_SUMMARY = {
  blue:   { kinds: 5, total: 30 },
  green:  { kinds: 5, total: 30 },
  red:    { kinds: 2, total: 12 },
  purple: { kinds: 3, total: 12 },
  totalKinds: 15,
  totalCards: 84, // 不含地标与初始手牌
} as const;

/** 每位玩家开局自带的初始建筑(不计入公共卡池) */
export const STARTING_HAND = ['wheat_field', 'bakery'] as const;

/* -------------------------------------------------------------------------- */
/*                              10 种统一市场配置                              */
/* -------------------------------------------------------------------------- */

/**
 * Bright Lights 合订版"10 种市场":
 *   - 所有可用建筑卡(含紫色)按 supply 数量入**单一牌库**并洗牌
 *   - 场上始终保持 **10 种**不同类型的卡;某种售罄后从牌顶补新种类
 *   - 不区分高/低/紫,纯随机出现
 */
export const MARKET_DISPLAY_KINDS = 10;

