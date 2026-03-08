// ═══ S1.4 — Language Context Provider ═══
import { createContext, useContext, useState, type ReactNode } from 'react';
import { LABELS, type Lang } from '../data/i18n';

interface LangContextType { lang: Lang; setLang: (l: Lang) => void; L$: (key: string) => string }

const LangContext = createContext<LangContextType>({ lang: 'hi', setLang: () => {}, L$: (k) => k });

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>('hi');
  const L$ = (key: string) => LABELS[lang]?.[key] || LABELS.hi[key] || key;
  return <LangContext.Provider value={{ lang, setLang, L$ }}>{children}</LangContext.Provider>;
}

export function useLang() { return useContext(LangContext); }
export default LangContext;
