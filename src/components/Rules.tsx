import { getBuildings, getLandmarks, type CardColor } from '../data/cards';
import { useGame } from '../state/GameContext';
import { SYMBOL_META } from '../data/symbols';
import './Rules.css';

const COLOR_LABEL: Record<CardColor, string> = {
  blue: '🟦 蓝 · 初级产业',
  green: '🟩 绿 · 商业设施',
  red: '🟥 红 · 餐饮业',
  purple: '🟪 紫 · 大型设施',
};

const COLOR_ORDER: CardColor[] = ['blue', 'green', 'red', 'purple'];

const fmtActivation = (arr: number[]) =>
  arr.length === 1 ? String(arr[0]) : `${arr[0]}–${arr[arr.length - 1]}`;

/**
 * 《骰子街》(Machi Koro)游戏规则与卡牌清单
 */
export default function Rules() {
  const { state } = useGame();
  const mode = state.mode;
  const buildings = getBuildings(mode);
  const landmarks = getLandmarks(mode);
  const buyableLandmarks = landmarks.filter((l) => !l.builtByDefault);
  const defaultLandmarks = landmarks.filter((l) => l.builtByDefault);
  const modeLabel =
    mode === 'harbor' ? '港口扩展'
    : mode === 'millionaire' ? '仅百万富翁扩展'
    : mode === 'all' ? '三合一(基础+港口+百万富翁)'
    : '基础版';
  const usesUnified = mode !== 'base';
  const hasHarbor = mode === 'harbor' || mode === 'all';
  const hasMillionaire = mode === 'millionaire' || mode === 'all';

  // 汇总分组
  const grouped = COLOR_ORDER.map((c) => ({
    color: c,
    list: buildings.filter((b) => b.color === c),
    total: buildings.filter((b) => b.color === c).reduce((acc, b) => acc + b.supply, 0),
  }));
  const totalKinds = buildings.length;
  const totalCards = buildings.reduce((acc, b) => acc + b.supply, 0);

  return (
    <article className="rules">
      <header className="rules__header">
        <h1>骰子街 · Machi Koro</h1>
        <p className="rules__subtitle">
          一款由菅沼正夫设计的轻策略骰子桌游 · 当前模式:<strong>{modeLabel}</strong>
        </p>
      </header>

      <section>
        <h2>一、游戏目标</h2>
        <p>
          率先建成自己城市的<strong>全部 {buyableLandmarks.length} 座可购地标</strong>
          的玩家获胜。
          {usesUnified && defaultLandmarks.length > 0 && (
            <> 当前模式中,<strong>{defaultLandmarks.map((l) => l.name).join(' / ')}</strong> 默认建成,不计入胜利目标。</>
          )}
        </p>
      </section>

      <section>
        <h2>二、初始配置</h2>
        <ul>
          <li><strong>3 枚硬币</strong></li>
          <li><strong>2 张初始建筑</strong>:麦田(编号 1)、面包店(编号 2-3)</li>
          <li><strong>{landmarks.length} 张未建成的地标</strong>(正面朝下)</li>
        </ul>
      </section>

      <section>
        <h2>三、回合流程</h2>
        <ol>
          <li><strong>掷骰子</strong>:默认 1 颗骰子;建成"火车站"后可选 1 或 2 颗。</li>
          {hasHarbor && (
            <li><strong>港口加成</strong>:建成<strong>港口</strong>地标后,在<strong>双骰且点数 ≥10</strong> 时,可选择给点数 +2。</li>
          )}
          <li><strong>结算收益</strong>:按建筑颜色触发,顺序为 红 → 蓝/绿 → 紫。</li>
          {usesUnified && (
            <li><strong>市政厅补偿</strong>:进入建造阶段时,若你的金币 &lt; 1,自动补到 1 币。</li>
          )}
          <li><strong>建造</strong>:可购买 1 张新建筑或建造 1 座地标,也可不建。</li>
        </ol>
      </section>

      <section>
        <h2>四、地标建筑</h2>
        <table className="rules__table">
          <thead>
            <tr><th>地标</th><th>造价</th><th>效果</th></tr>
          </thead>
          <tbody>
            {landmarks.map((l) => (
              <tr key={l.id}>
                <td>
                  {l.name}
                  {l.builtByDefault && <span className="rules__tag rules__tag--warn">★ 默认建成</span>}
                  {l.mode === 'harbor' && !l.builtByDefault && (
                    <span className="rules__modeBadge" title="港口扩展">港扩</span>
                  )}
                  {l.mode === 'millionaire' && !l.builtByDefault && (
                    <span className="rules__modeBadge rules__modeBadge--mil" title="百万富翁扩展">百扩</span>
                  )}
                </td>
                <td>{l.builtByDefault ? '—' : l.cost}</td>
                <td>{l.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h2>五、卡牌颜色与触发规则</h2>
        <p className="rules__note">每张建筑左上角的颜色,决定了它在<strong>谁的回合</strong>触发、以及钱从哪里来。</p>
        <table className="rules__table rules__table--colors">
          <thead>
            <tr>
              <th>颜色</th>
              <th>类别</th>
              <th>触发时机</th>
              <th>结算方向</th>
              <th>购买上限</th>
            </tr>
          </thead>
          <tbody>
            <tr className="rules__colorRow rules__colorRow--blue">
              <td><span className="rules__colorDot rules__colorDot--blue" aria-hidden /> 蓝色</td>
              <td>原料 / 第一产业</td>
              <td><strong>任何玩家</strong>掷出对应点数</td>
              <td>持有者从<strong>银行</strong>获得金币</td>
              <td>每种最多 6 张</td>
            </tr>
            <tr className="rules__colorRow rules__colorRow--green">
              <td><span className="rules__colorDot rules__colorDot--green" aria-hidden /> 绿色</td>
              <td>商铺 / 工厂</td>
              <td>仅在<strong>自己</strong>掷出对应点数时</td>
              <td>持有者从<strong>银行</strong>获得金币</td>
              <td>每种最多 6 张</td>
            </tr>
            <tr className="rules__colorRow rules__colorRow--red">
              <td><span className="rules__colorDot rules__colorDot--red" aria-hidden /> 红色</td>
              <td>餐饮 / 抢钱</td>
              <td>仅在<strong>对手</strong>掷出对应点数时</td>
              <td>持有者从<strong>当前掷骰玩家</strong>抢钱(对方不够则尽量收)</td>
              <td>每种最多 6 张</td>
            </tr>
            <tr className="rules__colorRow rules__colorRow--purple">
              <td><span className="rules__colorDot rules__colorDot--purple" aria-hidden /> 紫色</td>
              <td>大型设施 / 主动技</td>
              <td>仅在<strong>自己</strong>掷出对应点数时</td>
              <td>效果各异:抢钱、洗牌、锁卡、复制等</td>
              <td><strong>每位玩家每种限 1 张</strong></td>
            </tr>
          </tbody>
        </table>
        <ul className="rules__note">
          <li><strong>结算顺序</strong>:同一次掷骰中,先红 → 蓝 → 绿 → 紫,逐色按"距当前玩家最远先结"。</li>
          <li><strong>银行付不起</strong>:蓝/绿色由银行支付,银行金币无上限,不会"付不出"。</li>
          <li><strong>对手付不起</strong>:红色 / 紫色抢钱,对手金币不足时,只收他剩下的全部,差额清零。</li>
          <li><strong>建造顺序无关</strong>:卡牌结算只看颜色和当回合点数,不看你是哪一回合买的。</li>
        </ul>
      </section>

      <section>
        <h2>六、完整卡牌清单({modeLabel})</h2>

        {grouped.map(({ color, list }) => (
          <div key={color} className="rules__cardgroup">
            <h3 className={`rules__grouptitle rules__grouptitle--${color}`}>
              {COLOR_LABEL[color]}
            </h3>
            <table className="rules__table">
              <thead>
                <tr>
                  <th>名称</th>
                  <th>类型</th>
                  <th>触发点</th>
                  <th>造价</th>
                  <th>效果</th>
                  <th>数量</th>
                </tr>
              </thead>
              <tbody>
                {list.map((c) => (
                  <tr key={c.id}>
                    <td>
                      {c.name}
                      {c.mode === 'harbor' && (
                        <span className="rules__modeBadge" title="港口扩展">港扩</span>
                      )}
                      {c.mode === 'millionaire' && (
                        <span className="rules__modeBadge rules__modeBadge--mil" title="百万富翁扩展">百扩</span>
                      )}
                    </td>
                    <td>{SYMBOL_META[c.symbol].full}</td>
                    <td>{fmtActivation(c.activation)}</td>
                    <td>{c.cost}</td>
                    <td>{c.description}</td>
                    <td>{c.supply}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}

        <h3>卡池总览</h3>
        <table className="rules__table">
          <thead>
            <tr><th>类别</th><th>种类数</th><th>总张数</th></tr>
          </thead>
          <tbody>
            {grouped.map((g) => (
              <tr key={g.color}>
                <td>{COLOR_LABEL[g.color]}</td>
                <td>{g.list.length}</td>
                <td>{g.total}</td>
              </tr>
            ))}
            <tr className="rules__sum">
              <td><strong>公共卡池合计</strong></td>
              <td><strong>{totalKinds}</strong></td>
              <td><strong>{totalCards}</strong></td>
            </tr>
          </tbody>
        </table>
        <p className="rules__note">
          初始手牌:每位玩家开局自带 1 张麦田 + 1 张面包店(不计入公共卡池)。
        </p>
      </section>

      {hasHarbor && (
        <section>
          <h2>七、港口扩展要点</h2>
          <ul>
            <li><strong>市政厅</strong>(默认建成):进入建造阶段时,若金币 &lt;1,自动补到 1 币。</li>
            <li><strong>港口</strong>(可购买,2 币):建成后,双骰且和 ≥10 时可选择给点数 +2。</li>
            <li><strong>机场</strong>(可购买,30 币):本回合<strong>跳过建造</strong>时,从银行获得 10 币。</li>
            <li><strong>10 种统一市场</strong>:所有可用建筑卡(含紫色)按 supply 入唯一牌库洗牌,场上始终保持 10 种不同类型;某种售罄后从牌顶补新种类。</li>
            <li><strong>鲭鱼船</strong>(蓝 8):需<strong>已建成港口</strong>;任何人投出 8 时 +3 币。</li>
            <li><strong>金枪鱼船</strong>(蓝 12-14):需<strong>已建成港口</strong>;触发时另投 2 颗骰,所有持有者按其和 +币(每张)。</li>
            <li><strong>出版社</strong>(紫 7):对手每张「☕ 杯型 + 🥐 面包型」建筑各让你抢 1 币。</li>
            <li><strong>税务局</strong>(紫 8-9):金币 ≥10 的对手,被你抽走其一半(向下取整)。</li>
          </ul>
        </section>
      )}

      {hasMillionaire && (
        <section>
          <h2>{hasHarbor ? '八' : '七'}、百万富翁扩展要点</h2>
          <ul>
            <li><strong>玉米田</strong>(蓝 3-4,造价 2):仅在你 ≤1 地标时,每张 +1 币。</li>
            <li><strong>葡萄园</strong>(蓝 7):每张 +3 币(为葡萄酒庄供能)。</li>
            <li><strong>法国餐厅</strong>(红 5):对方需 ≥2 地标,每张抢 5 币。</li>
            <li><strong>会员俱乐部</strong>(红 12-14):对方需 ≥3 地标,直接抢光对方所有金币。</li>
            <li><strong>杂货店</strong>(绿 2):仅在你 ≤1 地标时,每张 +2 币(免费购买;购物中心 +1)。</li>
            <li><strong>拆迁公司</strong>(绿 4):每张让你拆 1 座自己的地标,银行付 8 币。</li>
            <li><strong>借贷公司</strong>(绿 5-6,成本 -5):购买时反给你 5 币,每张让你付每位对手 2 币。</li>
            <li><strong>葡萄酒庄</strong>(绿 9):每张 × 葡萄园数 × 6 币;触发后此卡进入装修态。</li>
            <li><strong>搬家公司</strong>(绿 9-10):每张送对手一张非紫卡,从他拿 4 币。</li>
            <li><strong>饮料工厂</strong>(绿 11):<strong>自己骰 11</strong> 时,从银行获得「全场两位玩家 ☕ 杯型建筑总数 × 自己饮料工厂数量」金币。</li>
            <li><strong>装修公司</strong>(紫 8):选定一名对手某种非紫卡;从该对手收 <strong>1 币/张</strong>;这些卡进入装修态,下次该卡触发点命中时自动恢复(那一次仍不结算)。</li>
            <li><strong>科技公司</strong>(紫 10,造价 1):每回合 build 阶段可花 1 币累计 1 个标记;<strong>自己骰 10</strong> 时,按累计标记数从对手处收等额金币(标记保留,可继续累加)。</li>
            <li><strong>会展中心</strong>(紫 10,造价 7):激活己方一种非紫卡的全部张数,然后将本卡放回市场卡库;触发其中红卡时不计抢钱。</li>
            <li><strong>公园</strong>(紫 11-13):全场金币均分(向上取整)。</li>
          </ul>
        </section>
      )}

      <section>
        <h2>{(hasHarbor && hasMillionaire) ? '九' : (hasHarbor || hasMillionaire) ? '八' : '七'}、关键策略提示</h2>
        <ul>
          <li>早建火车站,解锁双骰后高点数建筑才有触发空间。</li>
          <li>平衡蓝绿红:蓝色稳定、绿色爆发、红色压制对手。</li>
          <li>紫色建筑是翻盘点:基础版 6 点齐发,港口扩展 7-9 点干扰更强。</li>
          {hasHarbor && <li>出版社针对「☕ 杯型 + 🥐 面包型」建筑总数,所以早期密集铺面包店 / 便利店的对手会成为你的"鱼塘"。</li>}
          {hasHarbor && <li>金枪鱼船触发时全员另投 2 骰,期望 +7,适合在已铺垫 ≥2 张时购买。</li>}
          {hasMillionaire && <li>百万富翁的"≤地标数"前置卡(玉米田/杂货店)早期收益猛,但建到 2-3 座地标后会断供,要主动转型。</li>}
          {hasMillionaire && <li>葡萄酒庄触发后会进入装修态(下次自己骰 9 自动恢复但仍空过一次),因此多张葡萄园 + 1 张酒庄的"一发入魂"组合更高效。</li>}
          {hasMillionaire && <li>装修公司可让对手的某种卡集体进入装修态、错过下一次触发,配合拆迁公司打乱节奏更狠;但被指定的卡随它的下次触发就会恢复。</li>}
        </ul>
      </section>

      <footer className="rules__footer">
        <small>详细规则见项目根目录 <code>RULES.md</code></small>
      </footer>
    </article>
  );
}
