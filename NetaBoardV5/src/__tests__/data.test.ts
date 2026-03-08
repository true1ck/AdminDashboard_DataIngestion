// ═══ S4.4 — NétaBoard Test Suite ═══
import { describe, it, expect } from 'vitest';
import { PILLARS, getNRI, computeFIS } from '../data';
import { ARC, FEEDBACK } from '../../backend/prisma/seedData';

describe('NRI Calculation', () => {
  it('computes NRI for grassroots archetype', () => {
    const nri = getNRI(ARC.grassroots);
    expect(nri).toBeGreaterThan(50);
    expect(nri).toBeLessThan(100);
  });

  it('returns 50 for null archetype', () => {
    const nri = getNRI({ dm: {} } as any);
    // All pillars default to 50, inverted ones become 50 too
    expect(nri).toBeCloseTo(50, 0);
  });

  it('computes different NRI for different archetypes', () => {
    const grassNRI = getNRI(ARC.grassroots);
    const techNRI = getNRI(ARC.technocrat);
    expect(grassNRI).not.toEqual(techNRI);
  });

  it('all 7 archetypes produce valid NRI', () => {
    Object.values(ARC).forEach(a => {
      const nri = getNRI(a);
      expect(nri).toBeGreaterThan(0);
      expect(nri).toBeLessThanOrEqual(100);
    });
  });
});

describe('FIS Calculation', () => {
  it('computes FIS from feedback items', () => {
    const fis = computeFIS(FEEDBACK);
    expect(fis.score).toBeGreaterThan(0);
    expect(fis.vol).toBeGreaterThan(0);
    expect(fis.cred).toBeGreaterThan(0);
  });

  it('returns defaults for empty array', () => {
    const fis = computeFIS([]);
    expect(fis.score).toBe(50);
    expect(fis.vol).toBe(0);
  });
});

describe('Data Integrity', () => {
  it('has exactly 15 pillars', () => {
    expect(PILLARS).toHaveLength(15);
  });

  it('pillar weights sum to 100', () => {
    const total = PILLARS.reduce((s, p) => s + p.w, 0);
    expect(total).toBe(100);
  });

  it('all archetypes have dm scores for every pillar', () => {
    Object.entries(ARC).forEach(([key, a]) => {
      PILLARS.forEach(p => {
        expect(a.dm[p.k]).toBeDefined();
        expect(a.dm[p.k]).toBeGreaterThanOrEqual(0);
        expect(a.dm[p.k]).toBeLessThanOrEqual(100);
      });
    });
  });

  it('all archetypes have required fields', () => {
    Object.entries(ARC).forEach(([key, a]) => {
      expect(a.n).toBeTruthy();
      expect(a.ic).toBeTruthy();
      expect(a.cn.const).toBeTruthy();
      expect(a.cn.party).toBeTruthy();
      expect(a.san.att).toBeGreaterThan(0);
    });
  });
});
