import { useEffect, useRef } from 'react';
import { useGame } from '../state/GameContext';
import './LogPanel.css';

export default function LogPanel() {
  const { state } = useGame();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [state.log.length]);

  return (
    <div className="logp">
      <h3>操作日志</h3>
      <div className="logp__list" ref={ref}>
        {state.log.map((e) => (
          <div key={e.id} className={`logp__row logp__row--p${e.playerId}`}>
            <span className="logp__turn">T{e.turn}</span>
            <span className="logp__who">{state.players[e.playerId].name}</span>
            <span className="logp__text">{e.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
