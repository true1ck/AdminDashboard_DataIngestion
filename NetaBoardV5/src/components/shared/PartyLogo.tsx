// ═══ S3.4 — Party Logo SVG Placeholder ═══
export default function PartyLogo({ party, color = 'var(--gd)', size = 80 }: { party: string; color?: string; size?: number }) {
  return (
    <div style={{ width: size, aspectRatio: '3/4', border: `2px dashed ${color}40`, borderRadius: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: `${color}06`, gap: 6, transition: 'border-color .3s' }}
      onMouseOver={e => (e.currentTarget.style.borderColor = `${color}80`)}
      onMouseOut={e => (e.currentTarget.style.borderColor = `${color}40`)}>
      <div style={{ width: size * 0.6, height: size * 0.6, borderRadius: 8, background: `${color}0A`, border: `1.5px solid ${color}33`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: size * 0.16, fontWeight: 900, color, fontFamily: 'var(--hf)', letterSpacing: '-.3px' }}>{party}</span>
      </div>
      <span style={{ fontSize: size * 0.12, fontWeight: 700, color: 'var(--mn)', letterSpacing: '1.5px', fontFamily: 'var(--hf)' }}>PARTY</span>
      <span style={{ fontSize: size * 0.09, color: `${color}60`, letterSpacing: '.5px' }}>LOGO</span>
    </div>
  );
}
