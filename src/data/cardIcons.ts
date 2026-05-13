/**
 * 卡牌图标映射(emoji)
 * 单一数据源:Market 卡片、PlayerPanel 建筑标签、地标按钮均从这里读取
 */

export const BUILDING_ICONS: Record<string, string> = {
  // 蓝色:初级产业
  wheat_field:    '🌾',
  ranch:          '🐄',
  forest:         '🌲',
  mine:           '⛏️',
  apple_orchard:  '🍎',
  // 绿色:商业设施
  bakery:         '🥐',
  convenience:    '🏪',
  cheese_factory: '🧀',
  furniture:      '🪑',
  market:         '🍅',
  // 红色:餐饮业
  cafe:           '☕',
  restaurant:     '🍽️',
  // 紫色:大型设施
  stadium:        '🏟️',
  tv_station:     '📺',
  business_ctr:   '🏢',
};

export const LANDMARK_ICONS: Record<string, string> = {
  station:     '🚉',
  mall:        '🛍️',
  amusement:   '🎡',
  radio_tower: '📡',
};

/** 兜底图标:未配置时返回一个通用积木 */
export const FALLBACK_ICON = '🧱';

export function getBuildingIcon(id: string): string {
  return BUILDING_ICONS[id] ?? FALLBACK_ICON;
}

export function getLandmarkIcon(id: string): string {
  return LANDMARK_ICONS[id] ?? FALLBACK_ICON;
}
