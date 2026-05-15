/**
 * 《骰子街》卡牌数据
 *   - 'base'        : 2012 基础版(15 种建筑 + 4 座地标)
 *   - 'harbor'      : 2016 港口扩展(港扩重制版,10 堆市场)
 *   - 'millionaire' : 2016 Millionaire's Row 百万富翁(基础 + 14 张新卡 + 公园)
 *   - 'all'         : 三合一(基础 + 港口 + 百万富翁)
 *
 * 用于游戏逻辑实现与 UI 展示的单一数据源 (Single Source of Truth)
 */

export type CardColor = 'blue' | 'green' | 'red' | 'purple';

/** 游戏模式 */
export type GameMode = 'base' | 'harbor' | 'millionaire' | 'all';

/** 一张卡所属的"扩展归属"(决定它在哪些 GameMode 下可用) */
export type CardOrigin = 'base' | 'harbor' | 'millionaire';

/**
 * 港扩里部分卡牌带"图标分类",作为其它卡的加成判定依据。
 *  - cup    ☕ 餐饮:咖啡馆、家庭餐厅、披萨店、汉堡店、寿司店、法国餐厅、会员俱乐部
 *  - bread  🥐 面包(房屋型 🏠):面包店、便利店、花店、杂货店
 *  - factory🏭 工厂:起司工厂、家具工厂、蔬果市场、食品仓库、葡萄酒庄、饮料工厂
 *  - wheat  🌾 麦穗:麦田、苹果园、花田、玉米田、葡萄园
 *  - fish   🐟 鱼:鲭鱼船、金枪鱼船
 *  - cow    🐄 牛:牧场
 *  - gear   ⚙️ 齿轮:森林、矿山
 *  - business 🏢 公司:拆迁公司、借贷公司、搬家公司
 *  - major  🌆 大型(紫色)
 */
export type CardSymbol =
  | 'wheat' | 'cow' | 'gear'
  | 'cup' | 'bread' | 'factory' | 'fish'
  | 'business'
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
  /** 卡牌所属扩展(决定它在哪些 GameMode 下可用) */
  mode: CardOrigin;
  /** 是否需要"港口"才能生效(港口扩展 中港口默认建成,但保留字段以便规则书展示) */
  requiresHarbor?: boolean;
}

export interface LandmarkCard {
  id: string;
  name: string;
  cost: number;
  description: string;
  mode: CardOrigin;
  /** 港口扩展 / Millionaire's Row:部分地标默认建成,不算入"需要建造"的胜利目标 */
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
 * 港口扩展:在基础 4 座之上加入
 *  - 1 座**默认建成**的隐形地标:市政厅(免费、永久生效、不计入胜利目标)
 *  - 2 座**需要购买**的可购地标:港口、机场
 * 胜利条件:建成全部 6 座可购地标(基础 4 + 港口 + 机场)。
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
];

/** 港口扩展新增的**可购买**地标(港口、机场) */
const HARBOR_BUYABLE_LANDMARKS: LandmarkCard[] = [
  {
    id: 'harbor',
    name: '港口',
    cost: 2,
    description: '掷出 ≥10 时,可选择给点数 +2(仅双骰)',
    mode: 'harbor',
  },
  {
    id: 'airport',
    name: '机场',
    cost: 30,
    description: '若本回合没有建造任何建筑(跳过建造),从银行获得 10 币',
    mode: 'harbor',
  },
];

/**
 * Millionaire's Row(百万富翁)单独模式:不引入额外地标,
 * 仅扩充建筑池;胜利目标仍为基础 4 座。
 */
const MILLIONAIRE_DEFAULT_LANDMARKS: LandmarkCard[] = [];

export const LANDMARKS: LandmarkCard[] = [...BASE_LANDMARKS, ...HARBOR_DEFAULT_LANDMARKS, ...HARBOR_BUYABLE_LANDMARKS];

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
  { id: 'market',        name: '蔬果市场', color: 'green', activation: [11,12], cost: 2, supply: 6, description: '每张 🌾 麦穗型建筑 +3 币',          symbol: 'factory', mode: 'base' },

  // 🟥 红色 · 餐饮业(别人骰出时,从该玩家身上抢钱)
  { id: 'cafe',          name: '咖啡馆',   color: 'red',   activation: [3],     cost: 2, supply: 6, description: '抢 1 币(购物中心 +1)',            symbol: 'cup',     mode: 'base' },
  { id: 'restaurant',    name: '家庭餐厅', color: 'red',   activation: [9,10],  cost: 3, supply: 6, description: '抢 2 币(购物中心 +1)',            symbol: 'cup',     mode: 'base' },

  // 🟪 紫色 · 大型设施(仅自己骰出时触发,每位玩家上限 1 张)
  { id: 'stadium',       name: '体育馆',   color: 'purple',activation: [6],     cost: 6, supply: 4, description: '从所有其他玩家各抢 2 币',          symbol: 'major',   mode: 'base' },
  { id: 'tv_station',    name: '电视台',   color: 'purple',activation: [6],     cost: 7, supply: 4, description: '指定一名玩家抢 5 币',              symbol: 'major',   mode: 'base' },
  { id: 'business_ctr',  name: '商业中心', color: 'purple',activation: [6],     cost: 8, supply: 4, description: '与一名玩家交换 1 张非紫色建筑',    symbol: 'major',   mode: 'base' },
];

/**
 * 港口扩展**新增**建筑(在基础 15 种之上)。
 *  - 鲭鱼船改为🟦蓝色,任何人投出 8 时触发(需港口);
 *  - 删除 fish_boat(渔船)/ flower_orch(独立花田 - 在 港口扩展 中花田与花店成套,本实现保留花田);
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

/**
 * Millionaire's Row(2016 百万富翁街/百万富翁之路)新增建筑(14 张)
 * 与基础 / 港扩共用「10 种统一市场」机制。
 *
 * 特殊机制说明:
 *  - 拆迁公司:自己骰 4 触发,自动拆掉 1 座地标(若有可拆),银行付 8 币
 *  - 借贷公司:购买时 cost=-5(银行付你 5 币);自己骰 5-6 时,付每位对手 2 币
 *  - 葡萄酒庄:触发后**永久翻面停用**(不可恢复)
 *  - 装修公司:触发后令"被指定的那种建筑"对**所有玩家**翻面停用,直到此卡再次被触发
 *  - 科技公司:每次触发可自愿放 1 个投资标记;别人骰特定点时按累计标记数 ×1 抽取
 *  - 玉米田 / 杂货店:仅在你尚有 ≤2 / ≤1 地标时生效
 *  - 法国餐厅 / 会员俱乐部:仅当对方已建 ≥2 / ≥3 地标时生效
 *  - 公园:作为紫色大型建筑(非地标),自己骰 11-13 触发,所有玩家金币重新均分(向上取整)
 */
const MILLIONAIRE_BUILDINGS: BuildingCard[] = [
  // 🟦 蓝色
  { id: 'corn_field',    name: '玉米田',   color: 'blue',  activation: [3, 4],  cost: 2, supply: 6, description: '+1 币(仅在你 ≤1 地标时)',                              symbol: 'wheat',    mode: 'millionaire' },
  { id: 'vineyard',      name: '葡萄园',   color: 'blue',  activation: [7],     cost: 3, supply: 6, description: '+3 币',                                                  symbol: 'wheat',    mode: 'millionaire' },

  // 🟥 红色
  { id: 'french_rest',   name: '法国餐厅', color: 'red',   activation: [5],     cost: 3, supply: 6, description: '从掷骰者抢 5 币(对方需 ≥2 地标;购物中心 +1)',          symbol: 'cup',      mode: 'millionaire' },
  { id: 'members_club',  name: '会员俱乐部', color: 'red', activation: [12,13,14], cost: 4, supply: 6, description: '抢光对方所有钱(对方需 ≥3 地标;购物中心 +1)',         symbol: 'cup',      mode: 'millionaire' },

  // 🟩 绿色
  { id: 'general_store', name: '杂货店',   color: 'green', activation: [2],     cost: 0, supply: 6, description: '+2 币(仅在你 ≤1 地标时;购物中心 +1)',                  symbol: 'bread',    mode: 'millionaire' },
  { id: 'demolition',    name: '拆迁公司', color: 'green', activation: [4],     cost: 2, supply: 6, description: '强制拆掉 1 座自己的地标,银行支付 8 币',                  symbol: 'business', mode: 'millionaire' },
  { id: 'loan_office',   name: '借贷公司', color: 'green', activation: [5, 6],  cost: -5, supply: 6, description: '购买时获得 5 币;之后骰 5-6,付每位对手 2 币',           symbol: 'business', mode: 'millionaire' },
  { id: 'winery',        name: '葡萄酒庄', color: 'green', activation: [9],     cost: 3, supply: 6, description: '每张葡萄园 +6 币;触发后此卡永久翻面停用',                symbol: 'factory',  mode: 'millionaire' },
  { id: 'moving_co',     name: '搬家公司', color: 'green', activation: [9, 10], cost: 2, supply: 6, description: '送一张自己的非紫色建筑给指定对手,然后从他处拿 4 币',     symbol: 'business', mode: 'millionaire' },
  { id: 'soda_factory',  name: '饮料工厂', color: 'green', activation: [11],    cost: 5, supply: 6, description: '所有玩家每张 ☕ 杯型建筑 +1 币',                          symbol: 'factory',  mode: 'millionaire' },

  // 🟪 紫色 · 大型(每位玩家上限 1 张)
  { id: 'renovation',    name: '装修公司', color: 'purple',activation: [8],     cost: 4, supply: 4, description: '指定对手某种非紫色建筑,从所有持有者收 1 币/张;该种全员翻面停用,直到本卡再次触发', symbol: 'major', mode: 'millionaire' },
  { id: 'tech_startup',  name: '科技公司', color: 'purple',activation: [10],    cost: 1, supply: 4, description: '可自愿在此卡上放 1 个投资标记;别人骰 10 时,按累计标记数 ×1 从掷骰者抽取',     symbol: 'major', mode: 'millionaire' },
  { id: 'exhibit_hall',  name: '会展中心', color: 'purple',activation: [11, 12], cost: 7, supply: 4, description: '激活己方一种非紫色建筑的全部张数,然后将本卡放回市场卡库',                       symbol: 'major', mode: 'millionaire' },
  { id: 'park',          name: '公园',     color: 'purple',activation: [11, 12, 13], cost: 3, supply: 4, description: '所有玩家金币重新均分(向上取整)',                                  symbol: 'major', mode: 'millionaire' },
];

/** 全部建筑(基础 + 港口 + 百万富翁) — 仅供 CATALOG 索引;实际可购卡牌请走 getBuildings(mode) */
export const BUILDINGS: BuildingCard[] = [...BASE_BUILDINGS, ...HARBOR_BUILDINGS, ...MILLIONAIRE_BUILDINGS];

/** 按模式获取可用建筑 */
export function getBuildings(mode: GameMode): BuildingCard[] {
  switch (mode) {
    case 'base':        return BASE_BUILDINGS;
    case 'harbor':      return [...BASE_BUILDINGS, ...HARBOR_BUILDINGS];
    case 'millionaire': return [...BASE_BUILDINGS, ...MILLIONAIRE_BUILDINGS];
    case 'all':         return [...BASE_BUILDINGS, ...HARBOR_BUILDINGS, ...MILLIONAIRE_BUILDINGS];
  }
}

/** 按模式获取地标 */
export function getLandmarks(mode: GameMode): LandmarkCard[] {
  switch (mode) {
    case 'base':        return BASE_LANDMARKS;
    case 'harbor':      return [...BASE_LANDMARKS, ...HARBOR_DEFAULT_LANDMARKS, ...HARBOR_BUYABLE_LANDMARKS];
    case 'millionaire': return [...BASE_LANDMARKS, ...MILLIONAIRE_DEFAULT_LANDMARKS];
    case 'all':         return [...BASE_LANDMARKS, ...HARBOR_DEFAULT_LANDMARKS, ...HARBOR_BUYABLE_LANDMARKS];
  }
}

/** 按模式获取需要"购买"的地标(用于胜利判定) — base 4 座 / harbor 6 座(+港口+机场) / millionaire 4 座 / all 6 座 */
export function getBuyableLandmarks(mode: GameMode): LandmarkCard[] {
  return getLandmarks(mode).filter((l) => !l.builtByDefault);
}

/** 是否启用 港口扩展 共通机制(10 种市场 + 市政厅) */
export function usesHarborMechanics(mode: GameMode): boolean {
  return mode === 'harbor' || mode === 'all' || mode === 'millionaire';
}

/** 是否启用"港口 +2"地标机制(港口可购买后激活、鱼船可激活)— 仅 harbor / all */
export function hasHarborLandmark(mode: GameMode): boolean {
  return mode === 'harbor' || mode === 'all';
}

/** 是否启用百万富翁卡牌池 */
export function usesMillionaireCards(mode: GameMode): boolean {
  return mode === 'millionaire' || mode === 'all';
}

/** 是否启用 10 种统一市场(港扩同款发牌机制)— 所有非基础模式都启用 */
export function usesUnifiedMarket(mode: GameMode): boolean {
  return mode !== 'base';
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
 * 港口扩展"10 种市场":
 *   - 所有可用建筑卡(含紫色)按 supply 数量入**单一牌库**并洗牌
 *   - 场上始终保持 **10 种**不同类型的卡;某种售罄后从牌顶补新种类
 *   - 不区分高/低/紫,纯随机出现
 */
export const MARKET_DISPLAY_KINDS = 10;

