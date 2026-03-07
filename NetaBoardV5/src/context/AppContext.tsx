import { createContext, useContext } from 'react';
import type { AppMode, ModuleId, ArchetypeKey } from '../types';
import type { Archetype, FISScore } from '../types';
import type { Lang } from '../data/i18n';
import type { useIASCL } from '../hooks/useIASCL';

export interface AppContextType {
  mode: AppMode;
  curMod: ModuleId;
  curPill: string;
  ck: ArchetypeKey;
  a: Archetype;
  nri: number;
  fis: FISScore;
  isPP: boolean;
  lang: Lang;
  dispatched: Record<string, boolean>;
  toast: (msg: string, type?: string) => void;
  navTo: (mod: ModuleId, pill?: string) => void;
  setDispatched: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  iascl: ReturnType<typeof useIASCL>;
}

export const AppContext = createContext<AppContextType | null>(null);

export function useApp(): AppContextType {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be inside AppContext.Provider');
  return ctx;
}
