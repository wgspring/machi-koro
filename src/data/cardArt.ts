/**
 * 卡牌专属插画背景 (WebP) 映射
 * 每个建筑 / 地标对应一张 AI 生成的卡通手绘 WebP 插画
 * Vite 会将 import 的资源转换为最终 URL 字符串
 */

// 建筑 (蓝/绿/红/紫)
import wheatField     from '../assets/cardbg/buildings/wheat_field.webp';
import ranch          from '../assets/cardbg/buildings/ranch.webp';
import forest         from '../assets/cardbg/buildings/forest.webp';
import mine           from '../assets/cardbg/buildings/mine.webp';
import appleOrchard   from '../assets/cardbg/buildings/apple_orchard.webp';
import bakery         from '../assets/cardbg/buildings/bakery.webp';
import convenience    from '../assets/cardbg/buildings/convenience.webp';
import cheeseFactory  from '../assets/cardbg/buildings/cheese_factory.webp';
import furniture      from '../assets/cardbg/buildings/furniture.webp';
import marketArt      from '../assets/cardbg/buildings/market.webp';
import cafe           from '../assets/cardbg/buildings/cafe.webp';
import restaurant     from '../assets/cardbg/buildings/restaurant.webp';
import stadium        from '../assets/cardbg/buildings/stadium.webp';
import tvStation      from '../assets/cardbg/buildings/tv_station.webp';
import businessCtr    from '../assets/cardbg/buildings/business_ctr.webp';

// 地标
import station        from '../assets/cardbg/landmarks/station.webp';
import mall           from '../assets/cardbg/landmarks/mall.webp';
import amusement      from '../assets/cardbg/landmarks/amusement.webp';
import radioTower     from '../assets/cardbg/landmarks/radio_tower.webp';

export const BUILDING_ART: Record<string, string> = {
  wheat_field: wheatField,
  ranch,
  forest,
  mine,
  apple_orchard: appleOrchard,
  bakery,
  convenience,
  cheese_factory: cheeseFactory,
  furniture,
  market: marketArt,
  cafe,
  restaurant,
  stadium,
  tv_station: tvStation,
  business_ctr: businessCtr,
};

export const LANDMARK_ART: Record<string, string> = {
  station,
  mall,
  amusement,
  radio_tower: radioTower,
};

export function getBuildingArt(id: string): string | undefined {
  return BUILDING_ART[id];
}

export function getLandmarkArt(id: string): string | undefined {
  return LANDMARK_ART[id];
}
