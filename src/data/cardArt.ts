/**
 * 卡牌专属插画背景 (WebP) 映射
 * 每个建筑 / 地标对应一张 AI 生成的卡通手绘 WebP 插画
 * Vite 会将 import 的资源转换为最终 URL 字符串
 */

// === 基础版建筑 ===
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

// === 港口扩展建筑 ===
import flowerOrch     from '../assets/cardbg/buildings/flower_orch.webp';
import mackerelBoat   from '../assets/cardbg/buildings/mackerel_boat.webp';
import tunaBoat       from '../assets/cardbg/buildings/tuna_boat.webp';
import flowerShop     from '../assets/cardbg/buildings/flower_shop.webp';
import foodWarehouse  from '../assets/cardbg/buildings/food_warehouse.webp';
import sushiBar       from '../assets/cardbg/buildings/sushi_bar.webp';
import pizzaJoint     from '../assets/cardbg/buildings/pizza_joint.webp';
import hamburger      from '../assets/cardbg/buildings/hamburger.webp';
import publisher      from '../assets/cardbg/buildings/publisher.webp';
import taxOffice      from '../assets/cardbg/buildings/tax_office.webp';

// === 百万富翁扩展建筑 ===
import cornField      from '../assets/cardbg/buildings/corn_field.webp';
import vineyard       from '../assets/cardbg/buildings/vineyard.webp';
import frenchRest     from '../assets/cardbg/buildings/french_rest.webp';
import membersClub    from '../assets/cardbg/buildings/members_club.webp';
import generalStore   from '../assets/cardbg/buildings/general_store.webp';
import demolition     from '../assets/cardbg/buildings/demolition.webp';
import loanOffice     from '../assets/cardbg/buildings/loan_office.webp';
import winery         from '../assets/cardbg/buildings/winery.webp';
import movingCo       from '../assets/cardbg/buildings/moving_co.webp';
import sodaFactory    from '../assets/cardbg/buildings/soda_factory.webp';
import renovation     from '../assets/cardbg/buildings/renovation.webp';
import techStartup    from '../assets/cardbg/buildings/tech_startup.webp';
import exhibitHall    from '../assets/cardbg/buildings/exhibit_hall.webp';
import park           from '../assets/cardbg/buildings/park.webp';

// === 基础版地标 ===
import station        from '../assets/cardbg/landmarks/station.webp';
import mall           from '../assets/cardbg/landmarks/mall.webp';
import amusement      from '../assets/cardbg/landmarks/amusement.webp';
import radioTower     from '../assets/cardbg/landmarks/radio_tower.webp';

// === 港口扩展地标 ===
import cityHall       from '../assets/cardbg/landmarks/city_hall.webp';
import harbor         from '../assets/cardbg/landmarks/harbor.webp';
import airport        from '../assets/cardbg/landmarks/airport.webp';

export const BUILDING_ART: Record<string, string> = {
  // 基础版
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
  // 港口扩展
  flower_orch: flowerOrch,
  mackerel_boat: mackerelBoat,
  tuna_boat: tunaBoat,
  flower_shop: flowerShop,
  food_warehouse: foodWarehouse,
  sushi_bar: sushiBar,
  pizza_joint: pizzaJoint,
  hamburger,
  publisher,
  tax_office: taxOffice,
  // 百万富翁扩展
  corn_field: cornField,
  vineyard,
  french_rest: frenchRest,
  members_club: membersClub,
  general_store: generalStore,
  demolition,
  loan_office: loanOffice,
  winery,
  moving_co: movingCo,
  soda_factory: sodaFactory,
  renovation,
  tech_startup: techStartup,
  exhibit_hall: exhibitHall,
  park,
};

export const LANDMARK_ART: Record<string, string> = {
  // 基础版
  station,
  mall,
  amusement,
  radio_tower: radioTower,
  // 港口扩展
  city_hall: cityHall,
  harbor,
  airport,
};

export function getBuildingArt(id: string): string | undefined {
  return BUILDING_ART[id];
}

export function getLandmarkArt(id: string): string | undefined {
  return LANDMARK_ART[id];
}
