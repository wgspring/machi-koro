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
  /** 已拥有的建筑:卡牌 id -> 数量 */
  buildings: Record<string, number>;
  /** 已建成的地标 id 集合(含默认建成的 city_hall / harbor) */
  landmarks: Record<string, boolean>;
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
   *  - harbor 模式(Bright Lights):**摊位上当前堆叠的张数**(忠于原版桌游);
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
  log: LogEntry[];
  _logSeq: number;
}

export interface CatalogIndex {
  byId: Record<string, BuildingCard>;
  landmarkById: Record<string, LandmarkCard>;
}
