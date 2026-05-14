/**
 * 测试模式开关
 *
 * 通过 Vite 环境变量 `VITE_TEST_MODE` 控制。在项目根目录创建
 * `.env.local`(或 `.env.development.local`)并写入:
 *
 *     VITE_TEST_MODE=1
 *
 * 重新启动 `npm run dev` 后即进入测试模式:
 *   1. 双方初始金币变为 500;
 *   2. 掷骰区出现"指定点数"输入框,可强制设定 d1 / d2 的值。
 *
 * 不设置或值为空 / 0 / false 时保持普通游戏体验。
 */
const raw = import.meta.env.VITE_TEST_MODE;
export const IS_TEST_MODE: boolean = raw === '1' || raw === 'true';

/** 测试模式下的初始金币 */
export const TEST_INITIAL_COINS = 500;
/** 正式模式下的初始金币 */
export const NORMAL_INITIAL_COINS = 3;

export const initialCoins = (): number =>
  IS_TEST_MODE ? TEST_INITIAL_COINS : NORMAL_INITIAL_COINS;
