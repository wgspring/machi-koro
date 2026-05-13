/**
 * 游戏核心类型定义
 */
import type { BuildingCard, LandmarkCard } from './cards';

export type Phase = 'roll' | 'resolve' | 'build' | 'gameover';

export interface PlayerState {
  id: 0 | 1;
  name: string;
  coins: number;
  /** 已拥有的建筑:卡牌 id -> 数量 */
  buildings: Record<string, number>;
  /** 已建成的地标 id 集合 */
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
}

export interface LogEntry {
  id: number;
  turn: number;
  playerId: 0 | 1;
  text: string;
}

export interface GameState {
  turn: number;
  /** 当前操作玩家 id */
  active: 0 | 1;
  phase: Phase;
  players: [PlayerState, PlayerState];
  /** 公共卡池剩余:卡牌 id -> 数量 */
  supply: Record<string, number>;
  lastRoll: DiceResult | null;
  /** 本回合是否已用过电波塔重投 */
  rerollUsedThisTurn: boolean;
  /** 本回合是否已通过游乐园获得额外行动 */
  extraTurnPending: boolean;
  winner: 0 | 1 | null;
  log: LogEntry[];
  _logSeq: number;
}

export interface CatalogIndex {
  byId: Record<string, BuildingCard>;
  landmarkById: Record<string, LandmarkCard>;
}
