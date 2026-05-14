import './WinModal.css';

interface Props {
  winnerName: string;
  /** 0 / 1 — 用于配色;与 GameBoard 的 --p0/--p1 主题一致 */
  winnerId: 0 | 1;
  turn: number;
  onRestart: () => void;
  onClose: () => void;
}

export default function WinModal({ winnerName, winnerId, turn, onRestart, onClose }: Props) {
  return (
    <div className="winModal" role="dialog" aria-modal="true" aria-label="游戏结束">
      <div className={`winModal__card winModal__card--p${winnerId}`}>
        <button
          className="winModal__close"
          onClick={onClose}
          aria-label="关闭"
          title="关闭"
        >
          ✕
        </button>

        <div className="winModal__trophy" aria-hidden>🏆</div>
        <div className="winModal__sub">恭喜获胜!</div>
        <div className="winModal__name">{winnerName}</div>
        <div className="winModal__meta">第 {turn} 回合 · 建成全部地标</div>

        <div className="winModal__actions">
          <button className="winModal__btn winModal__btn--primary" onClick={onRestart}>
            🔄 再来一局
          </button>
          <button className="winModal__btn" onClick={onClose}>
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}
