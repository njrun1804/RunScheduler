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
    qualitySelections: [
      'Threshold (split or 25–40′ continuous)',
      'VO₂ micro (30/30s, 12–18′ on-time)',
    ],
  };

  it('should produce correct viable days', () => {
    const result = planWeek(input);
    expect(result.viableDays).toEqual([1, 2, 3, 4]); // Tue..Fri
  });

  it('should place both sessions with proper spacing', () => {
    const result = planWeek(input);
    expect(result.warnings).toEqual([]);

    // Both have weight=2, so order by selection index: Threshold first, VO₂ micro second
    // Threshold (1/1) can go on Tue (Mon is blocked, Tue has no conflicts)
    // VO₂ micro (1/1) needs 1 gap from Threshold, so earliest is Thu
    expect(result.schedule[1]).toBe('Threshold (split or 25–40′ continuous)'); // Tue
    expect(result.schedule[3]).toBe('VO₂ micro (30/30s, 12–18′ on-time)'); // Thu
  });
});

describe('planWeek - Example B: MP Long with 2 qualities', () => {
  const input: PlanInput = {
    longType: 'mp',
    longDistanceMi: 20,
    qualitySelections: [
      'MP (alternations, ~30–45′ MP total)',
      'VO₂ micro (30/30s, 12–18′ on-time)',
    ],
  };

  it('should have only Thursday viable', () => {
    const result = planWeek(input);
    expect(result.viableDays).toEqual([3]); // Thu only
  });

  it('should place only one session and warn about the other', () => {
    const result = planWeek(input);

    // MP alternations (weight=4) > VO₂ micro (weight=2), so placed first
    expect(result.schedule[3]).toBe('MP (alternations, ~30–45′ MP total)'); // Thu
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toContain('VO₂ micro (30/30s, 12–18′ on-time)');
  });
});

describe('planWeek - Example C: Auto-upgrade to Big Easy', () => {
  const input: PlanInput = {
    longType: 'easy',
    longDistanceMi: 22, // triggers upgrade to big (2/2)
    qualitySelections: [
      'Fartlek / medium hills (e.g., 1′/1′ × 30–40′)',
      'VO₂ micro (30/30s, 12–18′ on-time)',
    ],
  };

  it('should block days as Big Easy (2/2)', () => {
    const result = planWeek(input);
    expect(result.viableDays).toEqual([2, 3]); // Wed, Thu
  });

  it('should place one session and warn about the other', () => {
    const result = planWeek(input);

    // Both weight=2, Fartlek selected first
    expect(result.schedule[2]).toBe('Fartlek / medium hills (e.g., 1′/1′ × 30–40′)'); // Wed
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toContain('VO₂ micro (30/30s, 12–18′ on-time)');
  });
});

describe('planWeek - Lead-in window validation', () => {
  it('should reject placement when before-window falls off Monday', () => {
    const input: PlanInput = {
      longType: 'easy',
      longDistanceMi: 16,
      qualitySelections: ['VO₂ big (e.g., 5×1k or 6×800 @ ~5k)'], // before=2
    };

    const result = planWeek(input);

    // Mon is blocked; Tue requires 2 days before (Sun+Mon), but Sun/Mon can serve as easy-only
    // Actually Tue should work because Mon is blocked (easy-only) and Sun is also blocked
    // Wait - the before window checks schedule[], not blocked. Let me re-check logic.

    // beforeWindowOK checks if days d-1, d-2, ... d-qBefore exist and have no quality
    // For Tue (d=1): needs d-1=Mon, d-2=Sun. Sun is idx=-1 which is <0, so it fails.
    // So it should try Wed (d=2): needs d-1=Tue, d-2=Mon. Both exist, neither has quality.

    expect(result.schedule[1]).toBeUndefined(); // Tue should fail
    expect(result.schedule[2]).toBe('VO₂ big (e.g., 5×1k or 6×800 @ ~5k)'); // Wed should work
  });

  it('should allow placement when lead-in uses blocked days', () => {
    const input: PlanInput = {
      longType: 'progressive', // 2/2: blocks Fri, Sat, Sun, Mon, Tue
      longDistanceMi: 18,
      qualitySelections: ['Threshold (split or 25–40′ continuous)'], // before=1, after=1
    };

    const result = planWeek(input);

    // Viable: Wed, Thu
    // Wed (d=2): needs d-1=Tue (blocked, no quality) -> OK
    expect(result.schedule[2]).toBe('Threshold (split or 25–40′ continuous)'); // Wed
  });
});

describe('planWeek - Neighbor spacing enforcement', () => {
  it('should enforce spacing between qualities on both sides', () => {
    const input: PlanInput = {
      longType: 'easy', // blocks Sat, Sun, Mon
      longDistanceMi: 16,
      qualitySelections: [
        'MP big (continuous ≥45′ at MP)', // weight=5, before=2, after=3
        'Medium-long easy (90–105′)',     // weight=1, before=0, after=1
      ],
    };

    const result = planWeek(input);

    // MP big placed first (highest weight)
    // Earliest for MP big: Wed (d=2) - needs 2 before (Tue, Mon both exist and no quality)
    // Medium-long easy (weight=1):
    //   Tue? right neighbor spacing vs MP big requires >= max(1,2)=2 easy days -> gap=0, fails
    //   Thu? gap=(3-2-1)=0, needs max(1,3)=3 -> fails
    //   Fri? gap=(4-2-1)=1, needs 3 -> fails

    expect(result.schedule[2]).toBe('MP big (continuous ≥45′ at MP)'); // Wed
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toContain('Medium-long easy (90–105′)');
  });

  it('should allow placement when spacing is satisfied', () => {
    const input: PlanInput = {
      longType: 'easy', // blocks Sat, Sun, Mon; viable: Tue, Wed, Thu, Fri
      longDistanceMi: 16,
      qualitySelections: [
        'Threshold (split or 25–40′ continuous)', // weight=2, before=1, after=1
        'Fartlek / medium hills (e.g., 1′/1′ × 30–40′)', // weight=2, before=1, after=1
      ],
    };

    const result = planWeek(input);

    // Both weight=2, Threshold selected first (idx=0)
    // Threshold on Tue (d=1): needs 1 before (Mon blocked, OK), no neighbors yet
    // CV on Wed (d=2)?: Left=Tue. Gap=(2-1-1)=0, needs max(1,1)=1. FAILS.
    // CV on Thu (d=3)?: Left=Tue. Gap=(3-1-1)=1, needs max(1,1)=1. OK.

    expect(result.schedule[1]).toBe('Threshold (split or 25–40′ continuous)'); // Tue
    expect(result.schedule[3]).toBe('Fartlek / medium hills (e.g., 1′/1′ × 30–40′)'); // Thu
    expect(result.warnings).toEqual([]);
  });
});

describe('planWeek - Determinism tests', () => {
  it('should produce identical results for identical inputs', () => {
    const input: PlanInput = {
      longType: 'progressive',
      longDistanceMi: 18,
      qualitySelections: [
        'Fartlek / medium hills (e.g., 1′/1′ × 30–40′)',
        'Long progression / MP-lite finish (last 15–25′ steady/MP-lite)',
        'Threshold (split or 25–40′ continuous)',
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
        'Fartlek / medium hills (e.g., 1′/1′ × 30–40′)', // weight=2
        'Threshold (split or 25–40′ continuous)',         // weight=2
        'VO₂ micro (30/30s, 12–18′ on-time)',             // weight=2
      ],
    };

    const result = planWeek(input);

    // All weight=2, so order by selection index
    // Available: Tue, Wed, Thu, Fri
    // Fartlek first (idx=0): Tue
    // Threshold second (idx=1): Thu (needs 1 gap from Tue)
    // CV third (idx=2): cannot fit (would need Sat, but Sat is blocked)

    expect(result.schedule[1]).toBe('Fartlek / medium hills (e.g., 1′/1′ × 30–40′)'); // Tue
    expect(result.schedule[3]).toBe('Threshold (split or 25–40′ continuous)'); // Thu
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
      qualitySelections: ['Unknown Quality', 'Threshold (split or 25–40′ continuous)'],
    };

    const result = planWeek(input);
    expect(result.schedule[1]).toBe('Threshold (split or 25–40′ continuous)');
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
