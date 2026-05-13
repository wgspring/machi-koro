import { useState } from 'react';
import GameBoard from './components/GameBoard';
import StartScreen from './components/StartScreen';
import type { GameMode } from './data/types';
import './App.css';

function App() {
  const [mode, setMode] = useState<GameMode | null>(null);
  if (!mode) {
    return <StartScreen onStart={(m) => setMode(m)} />;
  }
  return <GameBoard mode={mode} onBackToStart={() => setMode(null)} />;
}

export default App;
