import { BUILDINGS, LANDMARKS, SUPPLY_SUMMARY, type CardColor } from '../data/cards';
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
  return (
    <article className="rules">
      <header className="rules__header">
        <h1>骰子街 · Machi Koro</h1>
        <p className="rules__subtitle">
          一款由菅沼正夫设计的轻策略骰子桌游 · 2–4 人 · 单局约 30 分钟
        </p>
      </header>

      <section>
        <h2>一、游戏目标</h2>
        <p>
          率先建成自己城市的全部 <strong>4 座地标建筑</strong>
          (火车站、购物中心、游乐园、电波塔)的玩家获胜。
        </p>
      </section>

      <section>
        <h2>二、初始配置</h2>
        <ul>
          <li><strong>3 枚硬币</strong></li>
          <li><strong>2 张初始建筑</strong>:麦田(编号 1)、面包店(编号 2-3)</li>
          <li><strong>4 张未建成的地标</strong>(正面朝下)</li>
        </ul>
      </section>

      <section>
        <h2>三、回合流程</h2>
        <ol>
          <li><strong>掷骰子</strong>:默认 1 颗骰子;建成"火车站"后可选 1 或 2 颗。</li>
          <li><strong>结算收益</strong>:按建筑颜色触发,顺序为 红 → 蓝/绿 → 紫。</li>
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
            {LANDMARKS.map((l) => (
              <tr key={l.id}>
                <td>{l.name}</td>
                <td>{l.cost}</td>
                <td>{l.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h2>五、完整卡牌清单(基础版)</h2>

        {COLOR_ORDER.map((color) => {
          const list = BUILDINGS.filter((b) => b.color === color);
          return (
            <div key={color} className="rules__cardgroup">
              <h3 className={`rules__grouptitle rules__grouptitle--${color}`}>
                {COLOR_LABEL[color]}
              </h3>
              <table className="rules__table">
                <thead>
                  <tr>
                    <th>名称</th>
                    <th>触发点</th>
                    <th>造价</th>
                    <th>效果</th>
                    <th>数量</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((c) => (
                    <tr key={c.id}>
                      <td>{c.name}</td>
                      <td>{fmtActivation(c.activation)}</td>
                      <td>{c.cost}</td>
                      <td>{c.description}</td>
                      <td>{c.supply}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })}

        <h3>卡池总览</h3>
        <table className="rules__table">
          <thead>
            <tr><th>类别</th><th>种类数</th><th>总张数</th></tr>
          </thead>
          <tbody>
            <tr><td>🟦 蓝色 · 初级产业</td><td>{SUPPLY_SUMMARY.blue.kinds}</td><td>{SUPPLY_SUMMARY.blue.total}</td></tr>
            <tr><td>🟩 绿色 · 商业设施</td><td>{SUPPLY_SUMMARY.green.kinds}</td><td>{SUPPLY_SUMMARY.green.total}</td></tr>
            <tr><td>🟥 红色 · 餐饮业</td><td>{SUPPLY_SUMMARY.red.kinds}</td><td>{SUPPLY_SUMMARY.red.total}</td></tr>
            <tr><td>🟪 紫色 · 大型设施</td><td>{SUPPLY_SUMMARY.purple.kinds}</td><td>{SUPPLY_SUMMARY.purple.total}</td></tr>
            <tr className="rules__sum">
              <td><strong>公共卡池合计</strong></td>
              <td><strong>{SUPPLY_SUMMARY.totalKinds}</strong></td>
              <td><strong>{SUPPLY_SUMMARY.totalCards}</strong></td>
            </tr>
          </tbody>
        </table>
        <p className="rules__note">
          初始手牌:每位玩家开局自带 1 张麦田 + 1 张面包店(不计入公共卡池)。
        </p>
      </section>

      <section>
        <h2>六、关键策略提示</h2>
        <ul>
          <li>早建火车站,解锁双骰后高点数建筑才有触发空间。</li>
          <li>平衡蓝绿红:蓝色稳定、绿色爆发、红色压制对手。</li>
          <li>紫色建筑是翻盘点:体育馆、电视台、商业中心(均触发点 6)。</li>
          <li>注意点数概率:单骰平均 3.5,双骰集中 6–8。</li>
        </ul>
      </section>

      <footer className="rules__footer">
        <small>详细规则见项目根目录 <code>RULES.md</code></small>
      </footer>
    </article>
  );
}
