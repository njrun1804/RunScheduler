import {
  planWeek,
  computeBlockedDays,
  normalizeLongKey,
  candidateDays,
  dayName,
  formatViableDays,
  LONG_RULES,
  QUALITY_CATALOG,
  type DayIndex,
  type PlanInput,
} from './planner';

describe('normalizeLongKey', () => {
  it('should upgrade easy to big at 21+ miles', () => {
    expect(normalizeLongKey('easy', 21)).toBe('big');
    expect(normalizeLongKey('easy', 22)).toBe('big');
  });

  it('should keep easy below 21 miles', () => {
    expect(normalizeLongKey('easy', 16)).toBe('easy');
    expect(normalizeLongKey('easy', 20)).toBe('easy');
  });

  it('should not affect other long types', () => {
    expect(normalizeLongKey('progressive', 22)).toBe('progressive');
    expect(normalizeLongKey('mp', 25)).toBe('mp');
  });
});

describe('computeBlockedDays', () => {
  it('should block correct days for Long Easy (1/1)', () => {
    const blocked = computeBlockedDays(LONG_RULES.easy);
    // Sun(6), Sat(5) before, Mon(0) after
    expect(blocked.has(6)).toBe(true); // Sun
    expect(blocked.has(5)).toBe(true); // Sat
    expect(blocked.has(0)).toBe(true); // Mon
    expect(blocked.size).toBe(3);
  });

  it('should block correct days for Progressive/Hilly/Big (2/2)', () => {
    const blocked = computeBlockedDays(LONG_RULES.progressive);
    // Sun(6), Fri(4)+Sat(5) before, Mon(0)+Tue(1) after
    expect(blocked.has(6)).toBe(true); // Sun
    expect(blocked.has(5)).toBe(true); // Sat
    expect(blocked.has(4)).toBe(true); // Fri
    expect(blocked.has(0)).toBe(true); // Mon
    expect(blocked.has(1)).toBe(true); // Tue
    expect(blocked.size).toBe(5);
  });

  it('should block correct days for MP Long (2/3)', () => {
    const blocked = computeBlockedDays(LONG_RULES.mp);
    // Sun(6), Fri(4)+Sat(5) before, Mon(0)+Tue(1)+Wed(2) after
    expect(blocked.has(6)).toBe(true); // Sun
    expect(blocked.has(5)).toBe(true); // Sat
    expect(blocked.has(4)).toBe(true); // Fri
    expect(blocked.has(0)).toBe(true); // Mon
    expect(blocked.has(1)).toBe(true); // Tue
    expect(blocked.has(2)).toBe(true); // Wed
    expect(blocked.size).toBe(6);
  });
});

describe('candidateDays', () => {
  it('should return unblocked days for Long Easy', () => {
    const blocked = computeBlockedDays(LONG_RULES.easy);
    const candidates = candidateDays(blocked);
    expect(candidates).toEqual([1, 2, 3, 4]); // Tue, Wed, Thu, Fri
  });

  it('should return only Thursday for MP Long', () => {
    const blocked = computeBlockedDays(LONG_RULES.mp);
    const candidates = candidateDays(blocked);
    expect(candidates).toEqual([3]); // Thu only
  });
});

describe('planWeek - Example A: Long Easy with 2 qualities', () => {
  const input: PlanInput = {
    longType: 'easy',
    longDistanceMi: 16,
    qualitySelections: ['Threshold (cruise/split/≤30′)', 'CV / 10k (4–6×1k)'],
  };

  it('should produce correct viable days', () => {
    const result = planWeek(input);
    expect(result.viableDays).toEqual([1, 2, 3, 4]); // Tue..Fri
  });

  it('should place both sessions with proper spacing', () => {
    const result = planWeek(input);
    expect(result.warnings).toEqual([]);

    // Both have weight=2, so order by selection index: Threshold first, CV second
    // Threshold (1/1) can go on Tue (Mon is blocked, Tue has no conflicts)
    // CV (1/1) needs 1 gap from Threshold, so earliest is Thu
    expect(result.schedule[1]).toBe('Threshold (cruise/split/≤30′)'); // Tue
    expect(result.schedule[3]).toBe('CV / 10k (4–6×1k)'); // Thu
  });
});

describe('planWeek - Example B: MP Long with 2 qualities', () => {
  const input: PlanInput = {
    longType: 'mp',
    longDistanceMi: 20,
    qualitySelections: ['Threshold Alternations', 'VO₂ Micro (30/30s)'],
  };

  it('should have only Thursday viable', () => {
    const result = planWeek(input);
    expect(result.viableDays).toEqual([3]); // Thu only
  });

  it('should place only one session and warn about the other', () => {
    const result = planWeek(input);

    // Threshold Alternations (weight=4) > VO₂ Micro (weight=2), so placed first
    expect(result.schedule[3]).toBe('Threshold Alternations'); // Thu
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toContain('VO₂ Micro (30/30s)');
  });
});

describe('planWeek - Example C: Auto-upgrade to Big Easy', () => {
  const input: PlanInput = {
    longType: 'easy',
    longDistanceMi: 22, // triggers upgrade to big (2/2)
    qualitySelections: ['CV / 10k (4–6×1k)', 'VO₂ Micro (30/30s)'],
  };

  it('should block days as Big Easy (2/2)', () => {
    const result = planWeek(input);
    expect(result.viableDays).toEqual([2, 3]); // Wed, Thu
  });

  it('should place one session and warn about the other', () => {
    const result = planWeek(input);

    // Both weight=2, CV selected first
    expect(result.schedule[2]).toBe('CV / 10k (4–6×1k)'); // Wed
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toContain('VO₂ Micro (30/30s)');
  });
});

describe('planWeek - Lead-in window validation', () => {
  it('should reject placement when before-window falls off Monday', () => {
    const input: PlanInput = {
      longType: 'easy',
      longDistanceMi: 16,
      qualitySelections: ['VO₂ Classic (5×1k or 6×800)'], // before=2
    };

    const result = planWeek(input);

    // Mon is blocked; Tue requires 2 days before (Sun+Mon), but Sun/Mon can serve as easy-only
    // Actually Tue should work because Mon is blocked (easy-only) and Sun is also blocked
    // Wait - the before window checks schedule[], not blocked. Let me re-check logic.

    // beforeWindowOK checks if days d-1, d-2, ... d-qBefore exist and have no quality
    // For Tue (d=1): needs d-1=Mon, d-2=Sun. Sun is idx=-1 which is <0, so it fails.
    // So it should try Wed (d=2): needs d-1=Tue, d-2=Mon. Both exist, neither has quality.

    expect(result.schedule[1]).toBeUndefined(); // Tue should fail
    expect(result.schedule[2]).toBe('VO₂ Classic (5×1k or 6×800)'); // Wed should work
  });

  it('should allow placement when lead-in uses blocked days', () => {
    const input: PlanInput = {
      longType: 'progressive', // 2/2: blocks Fri, Sat, Sun, Mon, Tue
      longDistanceMi: 18,
      qualitySelections: ['Threshold (cruise/split/≤30′)'], // before=1, after=1
    };

    const result = planWeek(input);

    // Viable: Wed, Thu
    // Wed (d=2): needs d-1=Tue (blocked, no quality) -> OK
    expect(result.schedule[2]).toBe('Threshold (cruise/split/≤30′)'); // Wed
  });
});

describe('planWeek - Neighbor spacing enforcement', () => {
  it('should enforce spacing between qualities on both sides', () => {
    const input: PlanInput = {
      longType: 'easy', // blocks Sat, Sun, Mon
      longDistanceMi: 16,
      qualitySelections: [
        'VO₂ Classic (5×1k or 6×800)', // weight=4, before=2, after=2
        'Steady 20–40′',                // weight=1, before=0, after=0
      ],
    };

    const result = planWeek(input);

    // VO₂ Classic placed first (higher weight)
    // Earliest for VO₂: Wed (d=2) - needs 2 before (Tue, Mon both exist and no quality)
    // Steady (weight=1): can it go on Tue?
    //   - Left neighbor check: none
    //   - Right neighbor: VO₂ on Wed. Gap = (2-1-1)=0, needs max(0, 2)=2. FAILS.
    // Can it go on Thu?
    //   - Left: VO₂ on Wed. Gap = (3-2-1)=0, needs max(2, 0)=2. FAILS.
    // Can it go on Fri?
    //   - Left: VO₂ on Wed. Gap = (4-2-1)=1, needs max(2, 0)=2. FAILS.

    // So Steady cannot be placed anywhere due to VO₂'s after=2 requirement

    expect(result.schedule[2]).toBe('VO₂ Classic (5×1k or 6×800)'); // Wed
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toContain('Steady 20–40′');
  });

  it('should allow placement when spacing is satisfied', () => {
    const input: PlanInput = {
      longType: 'easy', // blocks Sat, Sun, Mon; viable: Tue, Wed, Thu, Fri
      longDistanceMi: 16,
      qualitySelections: [
        'Threshold (cruise/split/≤30′)', // weight=2, before=1, after=1
        'CV / 10k (4–6×1k)',             // weight=2, before=1, after=1
      ],
    };

    const result = planWeek(input);

    // Both weight=2, Threshold selected first (idx=0)
    // Threshold on Tue (d=1): needs 1 before (Mon blocked, OK), no neighbors yet
    // CV on Wed (d=2)?: Left=Tue. Gap=(2-1-1)=0, needs max(1,1)=1. FAILS.
    // CV on Thu (d=3)?: Left=Tue. Gap=(3-1-1)=1, needs max(1,1)=1. OK.

    expect(result.schedule[1]).toBe('Threshold (cruise/split/≤30′)'); // Tue
    expect(result.schedule[3]).toBe('CV / 10k (4–6×1k)'); // Thu
    expect(result.warnings).toEqual([]);
  });
});

describe('planWeek - Determinism tests', () => {
  it('should produce identical results for identical inputs', () => {
    const input: PlanInput = {
      longType: 'progressive',
      longDistanceMi: 18,
      qualitySelections: [
        'Aerobic Fartlek 1′/1′',
        'Long Hills 60–90″',
        'Threshold (cruise/split/≤30′)',
      ],
    };

    const result1 = planWeek(input);
    const result2 = planWeek(input);

    expect(result1.viableDays).toEqual(result2.viableDays);
    expect(result1.schedule).toEqual(result2.schedule);
    expect(result1.warnings).toEqual(result2.warnings);
  });

  it('should use stable sort for equal weights', () => {
    const input: PlanInput = {
      longType: 'easy',
      longDistanceMi: 16,
      qualitySelections: [
        'Aerobic Fartlek 1′/1′',        // weight=2
        'Threshold (cruise/split/≤30′)', // weight=2
        'CV / 10k (4–6×1k)',            // weight=2
      ],
    };

    const result = planWeek(input);

    // All weight=2, so order by selection index
    // Available: Tue, Wed, Thu, Fri
    // Fartlek first (idx=0): Tue
    // Threshold second (idx=1): Thu (needs 1 gap from Tue)
    // CV third (idx=2): cannot fit (would need Sat, but Sat is blocked)

    expect(result.schedule[1]).toBe('Aerobic Fartlek 1′/1′'); // Tue
    expect(result.schedule[3]).toBe('Threshold (cruise/split/≤30′)'); // Thu
  });
});

describe('planWeek - Edge cases', () => {
  it('should handle empty quality selections', () => {
    const input: PlanInput = {
      longType: 'easy',
      longDistanceMi: 16,
      qualitySelections: [],
    };

    const result = planWeek(input);
    expect(result.schedule).toEqual({});
    expect(result.warnings).toEqual([]);
    expect(result.viableDays).toEqual([1, 2, 3, 4]);
  });

  it('should ignore unknown quality keys', () => {
    const input: PlanInput = {
      longType: 'easy',
      longDistanceMi: 16,
      qualitySelections: ['Unknown Quality', 'Threshold (cruise/split/≤30′)'],
    };

    const result = planWeek(input);
    expect(result.schedule[1]).toBe('Threshold (cruise/split/≤30′)');
    expect(Object.keys(result.schedule)).toHaveLength(1);
  });

  it('should handle max quality load', () => {
    const input: PlanInput = {
      longType: 'easy',
      longDistanceMi: 16,
      qualitySelections: Object.keys(QUALITY_CATALOG),
    };

    const result = planWeek(input);

    // Should place as many as possible, with warnings for the rest
    expect(Object.keys(result.schedule).length).toBeGreaterThan(0);
    expect(result.warnings.length).toBeGreaterThan(0);
  });
});

describe('Helper functions', () => {
  it('dayName should return correct day labels', () => {
    expect(dayName(0 as DayIndex)).toBe('Mon');
    expect(dayName(3 as DayIndex)).toBe('Thu');
    expect(dayName(6 as DayIndex)).toBe('Sun');
  });

  it('formatViableDays should format day list', () => {
    expect(formatViableDays([1, 2, 3] as DayIndex[])).toBe('Tue, Wed, Thu');
    expect(formatViableDays([])).toBe('no days');
  });
});
