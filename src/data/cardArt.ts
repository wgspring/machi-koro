/**
 * 卡牌专属插画背景 (SVG) 映射
 * 每个建筑 / 地标对应一张独立的 SVG 插画背景
 * Vite 会将 import 的资源转换为最终 URL 字符串
 */

// 建筑 (蓝/绿/红/紫)
import wheatField     from '../assets/cardbg/buildings/wheat_field.svg';
import ranch          from '../assets/cardbg/buildings/ranch.svg';
import forest         from '../assets/cardbg/buildings/forest.svg';
import mine           from '../assets/cardbg/buildings/mine.svg';
import appleOrchard   from '../assets/cardbg/buildings/apple_orchard.svg';
import bakery         from '../assets/cardbg/buildings/bakery.svg';
import convenience    from '../assets/cardbg/buildings/convenience.svg';
import cheeseFactory  from '../assets/cardbg/buildings/cheese_factory.svg';
import furniture      from '../assets/cardbg/buildings/furniture.svg';
import marketArt      from '../assets/cardbg/buildings/market.svg';
import cafe           from '../assets/cardbg/buildings/cafe.svg';
import restaurant     from '../assets/cardbg/buildings/restaurant.svg';
import stadium        from '../assets/cardbg/buildings/stadium.svg';
import tvStation      from '../assets/cardbg/buildings/tv_station.svg';
import businessCtr    from '../assets/cardbg/buildings/business_ctr.svg';

// 地标
import station        from '../assets/cardbg/landmarks/station.svg';
import mall           from '../assets/cardbg/landmarks/mall.svg';
import amusement      from '../assets/cardbg/landmarks/amusement.svg';
import radioTower     from '../assets/cardbg/landmarks/radio_tower.svg';

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
