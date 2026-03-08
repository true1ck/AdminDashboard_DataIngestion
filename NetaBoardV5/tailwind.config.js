/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ['Space Grotesk', 'Playfair Display', 'serif'],
        body: ['DM Sans', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        deva: ['Noto Sans Devanagari', 'sans-serif'],
      },
      colors: {
        nb: {
          bg: '#0A0618', sf: '#110D24', cd: '#1A1335',
          bd: 'rgba(124,58,237,0.12)',
          am: '#7C3AED', em: '#059669', gd: '#D4AF37', rd: '#E63946',
          bl: '#3B82F6', or: '#F97316', saf: '#FF6B35',
          tx: '#E2D9F3', sub: '#8B80A8', mn: '#6B5F8A',
        },
        pp: {
          bg: '#1E1610', sf: '#28201A', cd: '#322820',
          bd: 'rgba(212,175,55,0.15)',
          am: '#C67A3C', gd: '#D4AF37', gdl: '#E8CC6A', gdd: '#A88A20',
          rd: '#D44A3C', tx: '#F5EDDF', sub: '#C8B898', mn: '#9A8A72',
        }
      }
    }
  },
  plugins: []
}
