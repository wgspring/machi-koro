import { createContext, useContext, useReducer, type ReactNode } from 'react';
import {
  createInitialState,
  rollDice,
  rerollDice,
  resolveIncome,
  buyBuilding,
  buyLandmark,
  skipBuild,
} from '../data/engine';
import type { GameState } from '../data/types';

type Action =
  | { type: 'RESTART'; name1?: string; name2?: string }
  | { type: 'ROLL'; count: 1 | 2 }
  | { type: 'REROLL' }
  | { type: 'RESOLVE' }
  | { type: 'BUY_BUILDING'; cardId: string }
  | { type: 'BUY_LANDMARK'; landmarkId: string }
  | { type: 'SKIP_BUILD' };

function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'RESTART': return createInitialState(action.name1, action.name2);
    case 'ROLL': return rollDice(state, action.count);
    case 'REROLL': return rerollDice(state);
    case 'RESOLVE': return resolveIncome(state);
    case 'BUY_BUILDING': return buyBuilding(state, action.cardId);
    case 'BUY_LANDMARK': return buyLandmark(state, action.landmarkId);
    case 'SKIP_BUILD': return skipBuild(state);
    default: return state;
  }
}

interface Ctx {
  state: GameState;
  dispatch: React.Dispatch<Action>;
}

const GameCtx = createContext<Ctx | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, () => createInitialState());
  return <GameCtx.Provider value={{ state, dispatch }}>{children}</GameCtx.Provider>;
}

export function useGame() {
  const ctx = useContext(GameCtx);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}
