import type { Archetype, ArchetypeKey } from '../types';
import type { useIASCL } from '../hooks/useIASCL';
import type { IASCLState as IASCLStateType } from '../hooks/useIASCL';
import type { Lang } from '../data/i18n';

export type { IASCLStateType };

export interface ModuleProps {
  a: Archetype;
  ck: ArchetypeKey;
  nri: number;
  fis: { score: number; vol: number; snt: number; div: number; cred: number };
  isPP: boolean;
  lang: Lang;
  curPill: string;
  curMod: string;
  dispatched: Record<string, boolean>;
  setDispatched: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  toast: (msg: string, type?: string) => void;
  navTo: (mod: string, pill?: string) => void;
  iascl: ReturnType<typeof useIASCL>;
  drillDown: (type: string) => void;
  // Social auto-reply
  replyingTo: string | null;
  setReplyingTo: (id: string | null) => void;
  replyDraft: string;
  setReplyDraft: (s: string) => void;
  // File refs
  ocrFileRef: React.RefObject<HTMLInputElement | null>;
  asrAudioRef: React.RefObject<HTMLInputElement | null>;
  asrVideoRef: React.RefObject<HTMLInputElement | null>;
  // Hero slideshow
  heroSlide: number;
  setHeroSlide: React.Dispatch<React.SetStateAction<number>>;
}
