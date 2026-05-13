/**
 * 《骰子街》基础版卡牌数据
 * 用于游戏逻辑实现与 UI 展示的单一数据源 (Single Source of Truth)
 */

export type CardColor = 'blue' | 'green' | 'red' | 'purple';

export interface BuildingCard {
  /** 卡牌唯一 ID */
  id: string;
  /** 中文名称 */
  name: string;
  /** 颜色（决定触发逻辑） */
  color: CardColor;
  /** 触发的骰子点数（可能多个,如 2-3、9-10） */
  activation: number[];
  /** 购买造价 */
  cost: number;
  /** 效果说明（中文,用于 UI 展示） */
  description: string;
  /** 公共卡池中的初始数量 */
  supply: number;
}

export interface LandmarkCard {
  id: string;
  name: string;
  cost: number;
  description: string;
}

/* -------------------------------------------------------------------------- */
/*                                  地标建筑                                  */
/* -------------------------------------------------------------------------- */

export const LANDMARKS: LandmarkCard[] = [
  { id: 'station',     name: '火车站',   cost: 4,  description: '可选择掷 1 或 2 颗骰子' },
  { id: 'mall',        name: '购物中心', cost: 10, description: '自己的"杯型"绿色建筑每次多收 1 币' },
  { id: 'amusement',   name: '游乐园',   cost: 16, description: '双骰掷出豹子时,可再行动一次' },
  { id: 'radio_tower', name: '电波塔',   cost: 22, description: '每回合可选择重掷一次骰子' },
];

/* -------------------------------------------------------------------------- */
/*                                  建筑卡池                                  */
/* -------------------------------------------------------------------------- */

export const BUILDINGS: BuildingCard[] = [
  // 🟦 蓝色 · 初级产业(任何人骰出都触发)
  { id: 'wheat_field',   name: '麦田',     color: 'blue',  activation: [1],     cost: 1, supply: 6, description: '+1 币' },
  { id: 'ranch',         name: '牧场',     color: 'blue',  activation: [2],     cost: 1, supply: 6, description: '+1 币' },
  { id: 'forest',        name: '森林',     color: 'blue',  activation: [5],     cost: 3, supply: 6, description: '+1 币' },
  { id: 'mine',          name: '矿山',     color: 'blue',  activation: [9],     cost: 6, supply: 6, description: '+5 币' },
  { id: 'apple_orchard', name: '苹果园',   color: 'blue',  activation: [10],    cost: 3, supply: 6, description: '+3 币' },

  // 🟩 绿色 · 商业设施(仅自己骰出时触发)
  { id: 'bakery',        name: '面包店',   color: 'green', activation: [2, 3],  cost: 1, supply: 6, description: '+1 币(购物中心 +1)' },
  { id: 'convenience',   name: '便利店',   color: 'green', activation: [4],     cost: 2, supply: 6, description: '+3 币(购物中心 +1)' },
  { id: 'cheese_factory',name: '起司工厂', color: 'green', activation: [7],     cost: 5, supply: 6, description: '每张牧场 +3 币' },
  { id: 'furniture',     name: '家具工厂', color: 'green', activation: [8],     cost: 3, supply: 6, description: '每张森林/矿山 +3 币' },
  { id: 'market',        name: '蔬果市场', color: 'green', activation: [11,12], cost: 2, supply: 6, description: '每张麦田/苹果园 +2 币' },

  // 🟥 红色 · 餐饮业(别人骰出时,从该玩家身上抢钱)
  { id: 'cafe',          name: '咖啡馆',   color: 'red',   activation: [3],     cost: 2, supply: 6, description: '抢 1 币(购物中心 +1)' },
  { id: 'restaurant',    name: '家庭餐厅', color: 'red',   activation: [9,10],  cost: 3, supply: 6, description: '抢 2 币(购物中心 +1)' },

  // 🟪 紫色 · 大型设施(仅自己骰出时触发,每位玩家上限 1 张)
  { id: 'stadium',       name: '体育馆',   color: 'purple',activation: [6],     cost: 6, supply: 4, description: '从所有其他玩家各抢 2 币' },
  { id: 'tv_station',    name: '电视台',   color: 'purple',activation: [6],     cost: 7, supply: 4, description: '指定一名玩家抢 5 币' },
  { id: 'business_ctr',  name: '商业中心', color: 'purple',activation: [6],     cost: 8, supply: 4, description: '与一名玩家交换 1 张非紫色建筑' },
];

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
