# 骰子街 (Machi Koro) · Web 双人版

基于《骰子街》(Machi Koro) 基础版规则实现的双人本地热座 (hot‑seat) 网页版桌游。
两位玩家在同一台设备上轮流操作,目标是率先建成自己的全部 4 张地标。

> ⚠️ 本项目仅作个人学习与交流用途,所有卡牌名称与玩法源自原版桌游《Machi Koro》(出版方:Pandasaurus / Grounding),不做商业用途。

---

## ✨ 特性

- 🎲 **完整基础版玩法**:15 种建筑 (蓝/绿/红/紫) + 4 张地标,严格按官方规则实现 (颜色优先级、双骰豹子追加回合、电波塔重投、火车站可选骰数等)
- 👥 **本地双人热座**:同一浏览器轮流出手,无需账号、无需联网
- 🖼 **手绘插画风背景**:每张建筑卡和地标都有独立 SVG 插画背景,卡面图标 + 名称 + 编号 + 效果 + 价格清晰分层
- 🎨 **玩家主题色高亮**:行动玩家的卡池可购买卡片、地标按钮、状态徽标会自动切换到该玩家的主题色 (P1 蓝 / P2 橙)
- 📊 **掷骰收益预览**:掷骰后、结算前,在骰子两侧实时显示双方各自的预计收益明细 (来源、增减额、与对方的转账)
- 🪟 **单屏布局**:三列响应式布局 (玩家面板 | 中央区 | 玩家面板),不需要滚动页面即可看到全部信息
- 🌓 **明暗主题自适应**:跟随系统 `prefers-color-scheme`

---

## 🧩 技术栈

| 层 | 选型 |
|---|---|
| 框架 | React 19 + TypeScript |
| 构建 | Vite 8 |
| 状态 | `useReducer` + Context (`useGame()` Hook) |
| 游戏逻辑 | 纯函数引擎 (`src/data/engine.ts`),与 UI 完全解耦 |
| 样式 | 原生 CSS + CSS Variables + Grid/Flex |
| 资源 | 全部为内联 SVG (无外部图片依赖) |

---

## 🚀 快速开始
Docker 一键启动

```
# Docker 一键启动，浏览器 打开 http://localhost:3000 开玩
docker compose up -d
```

无Docker，源码编译运行：

```bash
# 安装依赖
npm install

# 本地开发 (默认 http://localhost:5173)
npm run dev

# 类型检查 + 生产构建
npm run build

# 预览生产构建
npm run preview

# 代码风格检查
npm run lint
```

---

## 📁 目录结构

```
machi-koro/
├── RULES.md                    # 完整规则中文文档
├── src/
│   ├── data/
│   │   ├── cards.ts            # 卡牌数据 (建筑/地标) — 单一数据源
│   │   ├── cardIcons.ts        # 每张卡片的 emoji 图标映射
│   │   ├── cardArt.ts          # 每张卡片的 SVG 插画映射
│   │   ├── types.ts            # GameState / PlayerState / Phase 等类型
│   │   └── engine.ts           # 纯函数游戏引擎 (掷骰/结算/购买)
│   ├── state/
│   │   └── GameContext.tsx     # useReducer + Context, 暴露 useGame()
│   ├── components/
│   │   ├── GameBoard.tsx       # 三列主布局,顶部阶段提示,主题切换
│   │   ├── PlayerPanel.tsx     # 玩家面板:地标 / 建筑 / 金币
│   │   ├── DiceArea.tsx        # 骰子区:预览 + 骰子 + 操作按钮
│   │   ├── Market.tsx          # 卡池:3 行 5 列,按颜色分组
│   │   └── LogPanel.tsx        # 行动日志,按玩家主题色着色
│   └── assets/
│       └── cardbg/             # 19 张卡牌专属插画背景 (SVG)
└── scripts/
    └── gen_card_art.py         # 一键重生成全部卡牌插画 SVG
```

---

## 🎮 玩法概览 (简版)

每位玩家初始拥有:**3 金币 + 麦田 + 面包店**。轮到自己的回合时按以下顺序进行:

1. **掷骰**:默认 1 颗;建成火车站后可选 1 或 2 颗;建成电波塔后每回合可重投 1 次
2. **结算收益**:按 红 → 蓝/绿 → 紫 的顺序结算
   - 🟦 蓝色:任何人骰出都触发 (无主收入)
   - 🟩 绿色:仅自己骰出时触发
   - 🟥 红色:别人骰出时,从掷骰者抢钱
   - 🟪 紫色:仅自己骰出时触发,每位玩家上限 1 张
3. **建造**:可花金币购买 1 张建筑 / 1 张地标,或选择跳过
4. 双骰豹子 (Double) + 已建游乐园 → 再行动一回合

率先建成全部 4 张地标 (火车站 / 购物中心 / 游乐园 / 电波塔) 的玩家获胜。

完整规则见 [`RULES.md`](./RULES.md)。

---

## 🛠 开发提示

- **添加/修改卡牌**:只改 `src/data/cards.ts` 即可,UI 与游戏引擎都从这里读取
- **替换插画风格**:编辑 `scripts/gen_card_art.py` 的 SVG 模板,运行 `python3 scripts/gen_card_art.py` 一键覆盖所有 19 张图
- **调试游戏逻辑**:`engine.ts` 是纯函数,可直接在单元测试或 REPL 中验证 `rollDice` / `resolveIncome` / `buyBuilding` 等
- **主题色自定义**:在 `GameBoard.css` 修改 `--p0-color` / `--p1-color` 及对应 `--p?-soft / --p?-strong`

---

## 🧪 测试模式

通过环境变量启用,便于复现 bug、演示卡片效果或快速验证胜利条件。

启用方式(项目根目录新建 `.env.local`):

```bash
# .env.local
VITE_TEST_MODE=1
```

然后重新启动 `npm run dev`(或重新执行 `npm run build`)。也可以在命令行临时开启:

```bash
VITE_TEST_MODE=1 npm run dev
```

启用后效果:

- 💰 **双方初始金币变为 500**(常规模式仍为 3 币),方便快速购买地标和高价建筑
- 🎲 **指定骰点**:掷骰区出现"🧪 测试"输入框,可填入 `d1`、`d2`(1–6)
  - 留空则该颗骰子保持随机
  - "投 1 颗"只读取 d1;"投 2 颗"同时读取 d1+d2
  - 电波塔重投同样会读取当前输入框的指定值
  - 如想恢复随机,清空输入或点击「清空」按钮即可

> 该开关只在构建期生效(Vite 会把 `import.meta.env.VITE_TEST_MODE` 内联到包中),
> 因此 **生产部署时不要设置该变量**,以免向真实玩家暴露测试入口。

实现细节:

- 开关定义在 `src/data/testMode.ts`(`IS_TEST_MODE` / `initialCoins()`)
- 引擎层 `rollDice` / `rerollDice` 接受可选 `forced: { d1?, d2? }` 参数,UI 仅在测试模式下传入
- 输入会被裁剪到 1–6 区间,非法值自动回退为随机

---

## 📝 License

仅作学习用途,卡牌玩法版权归原版桌游所有者《Machi Koro》(Masao Suganuma / Pandasaurus Games / Grounding Inc.) 所有。
