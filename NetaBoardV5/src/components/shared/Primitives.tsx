// ═══ Shared UI Primitives ═══
import type { ReactNode } from 'react';

export function Stat({ n, l, color, borderColor, onClick }: { n: string | number; l: string; color?: string; borderColor?: string; onClick?: () => void }) {
  return (
    <div onClick={onClick} className="nb-stat" style={{ borderTop: `3px solid ${borderColor || color || '#7C3AED'}`, cursor: onClick ? 'pointer' : 'default' }}>
      <div className="font-mono text-[22px] font-bold" style={{ color: color || '#7C3AED' }}>{n}</div>
      <div className="text-[10px] mt-1" style={{ color: 'var(--sub)' }}>{l}</div>
    </div>
  );
}

export function Tag({ children, bg, color }: { children: ReactNode; bg: string; color?: string }) {
  return <span className="nb-tag" style={{ background: bg, color: color || '#fff' }}>{children}</span>;
}

export function ProgressBar({ pct, color, height = 6 }: { pct: number; color?: string; height?: number }) {
  return (
    <div style={{ height, background: 'rgba(124,58,237,.06)', borderRadius: height / 2, overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${pct}%`, background: color || 'var(--am)', borderRadius: height / 2, transition: 'width .5s' }} />
    </div>
  );
}
