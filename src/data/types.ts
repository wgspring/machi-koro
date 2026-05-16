/**
 * 游戏核心类型定义
 */
import type { BuildingCard, LandmarkCard, GameMode } from './cards';

export type Phase = 'roll' | 'pending-harbor' | 'resolve' | 'build' | 'gameover';

export type { GameMode };

export interface PlayerState {
  id: 0 | 1;
  name: string;
  coins: number;
  /** 已拥有的建筑:卡牌 id -> 数量(包含被翻面停用的) */
  buildings: Record<string, number>;
  /** 已建成的地标 id 集合(含默认建成的 city_hall / harbor) */
  landmarks: Record<string, boolean>;
  /** 百万富翁 · 翻面停用的建筑张数:卡牌 id -> 被停用的张数(<= buildings[id])
   *  - 葡萄酒庄触发后该卡所有张数永久翻面停用
   *  - 装修公司触发后,被指定的某种卡在所有玩家处全员翻面停用,直到本卡再次触发解除
   *  - 翻面停用的卡:不被符号统计计入、不触发收益、但仍占据建筑数 */
  disabled?: Record<string, number>;
  /** 百万富翁 · 科技公司累计投资标记数 */
  techMarkers?: number;
}

export interface DiceResult {
  /** 第 1 颗骰子点数(若只投 1 颗,d2 = 0) */
  d1: number;
  d2: number;
  count: 1 | 2;
  /** 点数和(实际触发点) */
  sum: number;
  /** 是否豹子(双骰且两颗相同) */
  isDouble: boolean;
  /** 是否本回合的"重投"结果 */
  rerolled: boolean;
  /** 是否使用了港口 +2 加成 */
  harborBoosted: boolean;
}

export interface LogEntry {
  id: number;
  turn: number;
  playerId: 0 | 1;
  text: string;
}

/**
 * 10 种统一市场状态(仅 harbor 模式使用):
 *  - deck         : 唯一牌库(按张计;每个 id 重复 supply 次,已洗牌)
 *  - displayed    : 当前场上"露出"的卡 id 集合(去重,最多 10 种)
 *  - freshIds     : 因购买而新补到 displayed 的卡 id(用于 UI 闪光提示)
 *  - freshSetTurn : freshIds 最后一次被写入时所在的回合号;
 *                   下一回合一进入就把它清空,确保新一手玩家能看到一整回合的高亮
 */
export interface MarketDecks {
  deck: string[];
  displayed: string[];
  freshIds: string[];
  freshSetTurn: number;
}

export interface GameState {
  /** 游戏模式 */
  mode: GameMode;
  turn: number;
  /** 当前操作玩家 id */
  active: 0 | 1;
  phase: Phase;
  players: [PlayerState, PlayerState];
  /** 公共卡池剩余:卡牌 id -> 数量
   *  - base 模式:全局可买次数(从初始 supply 递减)
   *  - harbor 模式(港口扩展):**摊位上当前堆叠的张数**(忠于原版桌游);
   *    超出的同名卡留在 deck 里,等到这一摞被买光、该种类槽被新种替换、
   *    未来再次被翻到牌顶时才会重新出现。
   */
  supply: Record<string, number>;
  /** 10 堆市场(仅 harbor 模式;base 模式为 null) */
  market: MarketDecks | null;
  lastRoll: DiceResult | null;
  /** 本回合是否已用过电波塔重投 */
  rerollUsedThisTurn: boolean;
  /** 本回合是否已通过游乐园获得额外行动 */
  extraTurnPending: boolean;
  /** 本回合是否已建造 */
  builtThisTurn: boolean;
  winner: 0 | 1 | null;
  /** 百万富翁 · 装修公司当前在全局锁定的卡 id(对所有玩家生效);null = 无锁定 */
  renovationLockedKind?: string | null;
  /** 百万富翁 · 待用户决策的项(resolve 阶段产生,逐项决完后才进入 build) */
  pendingChoices?: PendingChoice[];
  /** 百万富翁 · 玩家累计决策(逐项填入,最终传给 computeIncomeBreakdown) */
  _resolvedChoices?: import('./engine').ResolveChoices;
  log: LogEntry[];
  _logSeq: number;
}

/**
 * 待用户决策项(百万富翁扩展所需)
 *  - demolish      :拆迁公司,主动玩家选择拆掉自己哪一座地标(可拆 N 次)
 *  - moving        :搬家公司,主动玩家选择送给对手哪张非紫卡(可送 N 次)
 *  - renovation    :装修公司,主动玩家选择锁定对手的哪种非紫卡
 *  - exhibit       :会展中心,主动玩家选择对对手哪种非紫卡收税
 *  - tech          :科技公司,主动玩家选择"放标记"还是"不放"
 *  - business_take :商业中心,主动玩家选择从对手处拿走哪张非紫卡
 *  - business_give :商业中心,主动玩家选择给出去哪张非紫卡
 */
export type PendingChoice =
  | { kind: 'demolish'; playerId: 0 | 1; options: string[] /* landmark ids */ }
  | { kind: 'moving'; playerId: 0 | 1; options: string[] /* building ids */ }
  | { kind: 'renovation'; playerId: 0 | 1; options: string[] /* building ids */ }
  | { kind: 'exhibit'; playerId: 0 | 1; options: string[] /* building ids */ }
  | { kind: 'tech'; playerId: 0 | 1 /* yes / no 选择 */ }
  | { kind: 'business_take'; playerId: 0 | 1; options: string[] /* opp building ids */ }
  | { kind: 'business_give'; playerId: 0 | 1; options: string[] /* my building ids */ };

export interface CatalogIndex {
  byId: Record<string, BuildingCard>;
  landmarkById: Record<string, LandmarkCard>;
}
