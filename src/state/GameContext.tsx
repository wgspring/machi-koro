import { createContext, useContext, useReducer, type ReactNode } from 'react';
import {
  createInitialState,
  rollDice,
  rerollDice,
  resolveIncome,
  submitChoice,
  buyBuilding,
  buyLandmark,
  skipBuild,
  applyHarborBoost,
  investTechStartup,
} from '../data/engine';
import type { GameState, GameMode } from '../data/types';

type ChoicePayload =
  | { kind: 'demolish'; landmarkId: string }
  | { kind: 'moving'; buildingId: string }
  | { kind: 'renovation'; buildingId: string }
  | { kind: 'exhibit'; buildingId: string }
  | { kind: 'business_take'; buildingId: string }
  | { kind: 'business_give'; buildingId: string };

type Action =
  | { type: 'RESTART'; name1?: string; name2?: string; mode?: GameMode }
  | { type: 'ROLL'; count: 1 | 2; forced?: { d1?: number; d2?: number } }
  | { type: 'REROLL'; forced?: { d1?: number; d2?: number } }
  | { type: 'HARBOR_BOOST'; accept: boolean }
  | { type: 'RESOLVE' }
  | { type: 'RESOLVE_CHOICE'; payload: ChoicePayload }
  | { type: 'BUY_BUILDING'; cardId: string }
  | { type: 'BUY_LANDMARK'; landmarkId: string }
  | { type: 'INVEST_TECH' }
  | { type: 'SKIP_BUILD' };

function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'RESTART': return createInitialState(action.name1, action.name2, action.mode ?? state.mode);
    case 'ROLL': return rollDice(state, action.count, action.forced);
    case 'REROLL': return rerollDice(state, action.forced);
    case 'HARBOR_BOOST': return applyHarborBoost(state, action.accept);
    case 'RESOLVE': return resolveIncome(state);
    case 'RESOLVE_CHOICE': return submitChoice(state, action.payload);
    case 'BUY_BUILDING': return buyBuilding(state, action.cardId);
    case 'BUY_LANDMARK': return buyLandmark(state, action.landmarkId);
    case 'INVEST_TECH': return investTechStartup(state);
    case 'SKIP_BUILD': return skipBuild(state);
    default: return state;
  }
}

interface Ctx {
  state: GameState;
  dispatch: React.Dispatch<Action>;
}

const GameCtx = createContext<Ctx | null>(null);

export function GameProvider({ children, mode = 'base' }: { children: ReactNode; mode?: GameMode }) {
  const [state, dispatch] = useReducer(reducer, undefined, () => createInitialState(undefined, undefined, mode));
  return <GameCtx.Provider value={{ state, dispatch }}>{children}</GameCtx.Provider>;
}

export function useGame() {
  const ctx = useContext(GameCtx);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}
