import { useState } from 'react';
import type { GameMode } from '../data/types';
import heroImg from '../assets/hero.png';
import './StartScreen.css';

interface ModeOption {
  id: GameMode;
  title: string;
  subtitle: string;
  badge: string;
  highlights: string[];
  accent: string;
}

const OPTIONS: ModeOption[] = [
  {
    id: 'base',
    title: '基础版',
    subtitle: 'Machi Koro · Base Game',
    badge: '15 种建筑 · 4 座地标',
    accent: '#4f7cff',
    highlights: [
      '🟦 蓝色 5 种 · 🟩 绿色 5 种 · 🟥 红色 2 种 · 🟪 紫色 3 种',
      '4 座经典地标:火车站 / 购物中心 / 游乐园 / 电波塔',
      '建成全部 4 座地标即获胜',
      '适合首次体验 · 单局 ~30 分钟',
    ],
  },
  {
    id: 'harbor',
    title: 'Bright Lights 合订版',
    subtitle: 'Machi Koro · Bright Lights, Big City (2016)',
    badge: '基础 + 港扩 · 10 种市场',
    accent: '#1aa57c',
    highlights: [
      '🏛️ 市政厅 + ⚓ 港口 默认建成,胜利目标仍为 4 座可购地标',
      '🛒 10 种市场:所有卡共用一个牌库,场上始终随机露出 10 种',
      '🐟 鲭鱼船(蓝 8) · 🐟 金枪鱼船(蓝 12-14,额外 2 骰)',
      '🟪 出版社(7,☕+🥐) · 🏛️ 税务局(8-9,对 ≥10 币抽税)',
    ],
  },
];

export default function StartScreen({ onStart }: { onStart: (mode: GameMode) => void }) {
  const [hover, setHover] = useState<GameMode | null>(null);

  return (
    <div className="start">
      <div className="start__inner">
        <header className="start__hero">
          <img className="start__heroImg" src={heroImg} alt="" aria-hidden />
          <div className="start__heroText">
            <h1 className="start__title">骰子街</h1>
            <p className="start__subtitle">Machi Koro · 轻策略骰子桌游</p>
            <p className="start__intro">
              掷骰子、收金币、建城市。
              率先建成全部地标的玩家获胜。
            </p>
          </div>
        </header>

        <h2 className="start__pickHint">选择游戏模式</h2>

        <div className="start__cards">
          {OPTIONS.map((opt) => (
            <button
              key={opt.id}
              className={`start__card start__card--${opt.id} ${hover === opt.id ? 'is-hover' : ''}`}
              style={{ ['--accent' as string]: opt.accent }}
              onMouseEnter={() => setHover(opt.id)}
              onMouseLeave={() => setHover(null)}
              onClick={() => onStart(opt.id)}
            >
              <div className="start__cardHead">
                <span className="start__cardTitle">{opt.title}</span>
                <span className="start__cardBadge">{opt.badge}</span>
              </div>
              <div className="start__cardSub">{opt.subtitle}</div>
              <ul className="start__cardList">
                {opt.highlights.map((h, idx) => (
                  <li key={idx}>{h}</li>
                ))}
              </ul>
              <div className="start__cardCta">
                <span>开始游戏 →</span>
              </div>
            </button>
          ))}
        </div>

        <footer className="start__footer">
          <small>Tips:进入游戏后,可点击右上角「📖 规则」查看完整玩法说明。</small>
        </footer>
      </div>
    </div>
  );
}
