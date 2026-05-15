/**
 * 卡片类型(symbol)统一描述
 * 用于卡片角标展示 + 卡片描述文本中的"X 型"统一称谓
 */
import type { CardSymbol } from './cards';

export interface SymbolMeta {
  emoji: string;
  /** 中文术语,用于"X 型"句式,如"杯型"、"齿轮型" */
  label: string;
  /** 完整短语,如"☕ 杯型" */
  full: string;
}

export const SYMBOL_META: Record<CardSymbol, SymbolMeta> = {
  wheat:   { emoji: '🌾', label: '麦穗型', full: '🌾 麦穗型' },
  cow:     { emoji: '🐄', label: '牛型',   full: '🐄 牛型' },
  gear:    { emoji: '⚙️', label: '齿轮型', full: '⚙️ 齿轮型' },
  cup:     { emoji: '☕', label: '杯型',   full: '☕ 杯型' },
  bread:   { emoji: '🥐', label: '面包型', full: '🥐 面包型' },
  factory: { emoji: '🏭', label: '工厂型', full: '🏭 工厂型' },
  fish:    { emoji: '🐟', label: '鱼型',   full: '🐟 鱼型' },
  business:{ emoji: '🏢', label: '公司型', full: '🏢 公司型' },
  major:   { emoji: '🌆', label: '大型设施', full: '🌆 大型设施' },
};

export const symbolEmoji = (s: CardSymbol) => SYMBOL_META[s].emoji;
export const symbolLabel = (s: CardSymbol) => SYMBOL_META[s].label;
export const symbolFull  = (s: CardSymbol) => SYMBOL_META[s].full;
