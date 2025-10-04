// planner.ts

// ---------- Types ----------
export type DayIndex = 0|1|2|3|4|5|6; // Mon..Sun
export type LongKey = "easy"|"progressive"|"hilly"|"big"|"mp";

export interface LongRule {
  key: LongKey;
  label: string;
  before: number;
  after: number;
}

export interface QualityRule {
  key: string;
  before: number;
  after: number;
  weight: number;  // scheduling priority (higher first)
  desc?: string;
}

export interface PlanInput {
  longType: LongKey;
  longDistanceMi: number;
  qualitySelections: string[]; // quality keys
}

export interface PlanResult {
  viableDays: DayIndex[];
  schedule: Partial<Record<DayIndex, string>>; // Mon..Sat only
  warnings: string[];
}

// ---------- Constants ----------
export const DAYS: ReadonlyArray<string> = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

export const LONG_RULES: Readonly<Record<LongKey, LongRule>> = {
  easy:        { key: "easy",        label: "Long Easy (90–110′)",            before: 1, after: 1 },
  progressive: { key: "progressive", label: "Progressive Long (MP-lite)",      before: 2, after: 2 },
  hilly:       { key: "hilly",       label: "Hilly Long (with descents)",      before: 2, after: 2 },
  big:         { key: "big",         label: "Big Easy (≥2h45 / ~22 mi)",       before: 2, after: 2 },
  mp:          { key: "mp",          label: "MP Long Block (≥45–60′ MP total)",before: 2, after: 3 },
};

export const QUALITY_CATALOG: Readonly<Record<string, QualityRule>> = {
  "Threshold (cruise/split/≤30′)": { key: "Threshold (cruise/split/≤30′)", before: 1, after: 1, weight: 2, desc: "T reps or ≤30′ continuous" },
  "Threshold Alternations":        { key: "Threshold Alternations",          before: 2, after: 2, weight: 4, desc: "e.g., 1k T / 1k steady ×4–6" },
  "CV / 10k (4–6×1k)":             { key: "CV / 10k (4–6×1k)",               before: 1, after: 1, weight: 2 },
  "VO₂ Micro (30/30s)":            { key: "VO₂ Micro (30/30s)",              before: 1, after: 1, weight: 2 },
  "VO₂ Classic (5×1k or 6×800)":   { key: "VO₂ Classic (5×1k or 6×800)",     before: 2, after: 2, weight: 4 },
  "Reps 300–400 relaxed":          { key: "Reps 300–400 relaxed",            before: 2, after: 2, weight: 3 },
  "Aerobic Fartlek 1′/1′":         { key: "Aerobic Fartlek 1′/1′",           before: 1, after: 1, weight: 2 },
  "Steady 20–40′":                 { key: "Steady 20–40′",                   before: 0, after: 0, weight: 1 },
  "Long Hills 60–90″":             { key: "Long Hills 60–90″",               before: 1, after: 1, weight: 2 },
  "MP Alternations":               { key: "MP Alternations",                 before: 2, after: 2, weight: 4 },
};

// ---------- Helpers ----------
export const isMonToSat = (d: DayIndex): d is 0|1|2|3|4|5 => d >= 0 && d <= 5;

export function normalizeLongKey(longKey: LongKey, miles: number): LongKey {
  return (longKey === "easy" && miles >= 21) ? "big" : longKey;
}

export function computeBlockedDays(longRule: LongRule): Set<DayIndex> {
  const blocked = new Set<DayIndex>();
  blocked.add(6); // Sunday is always blocked for qualities

  // After-long: Mon..(Mon + after - 1)
  for (let i = 0; i < longRule.after; i++) blocked.add(i as DayIndex);

  // Before-long: Sat, Fri, ... count = before
  for (let i = 0; i < longRule.before; i++) blocked.add((5 - i) as DayIndex);

  return blocked;
}

export function candidateDays(blocked: Set<DayIndex>): DayIndex[] {
  const days = [0,1,2,3,4,5] as DayIndex[];
  return days.filter(d => !blocked.has(d));
}

// Find nearest scheduled day to the left/right of d
function nearestLeftDay(d: DayIndex, schedule: Partial<Record<DayIndex,string>>): DayIndex|null {
  for (let i = (d - 1) as DayIndex; i >= 0; i = (i - 1) as DayIndex) {
    if (schedule[i] !== undefined) return i;
    if (i === 0) break;
  }
  return null;
}
function nearestRightDay(d: DayIndex, schedule: Partial<Record<DayIndex,string>>): DayIndex|null {
  for (let i = (d + 1) as DayIndex; i <= 5; i = (i + 1) as DayIndex) {
    if (schedule[i] !== undefined) return i;
    if (i === 5) break;
  }
  return null;
}

function beforeWindowOK(d: DayIndex, qBefore: number, schedule: Partial<Record<DayIndex,string>>): boolean {
  for (let k = 1; k <= qBefore; k++) {
    const idx = (d - k) as DayIndex;
    if (idx < 0) return false;                 // falls off Monday
    if (schedule[idx] !== undefined) return false; // a quality sits in the required easy-only window
  }
  return true;
}

// Check pairwise gaps against nearest neighbors
function spacingOK(
  d: DayIndex,
  q: QualityRule,
  schedule: Partial<Record<DayIndex,string>>,
  catalog: Record<string, QualityRule>
): boolean {
  const L = nearestLeftDay(d, schedule);
  if (L !== null) {
    const leftRule = catalog[schedule[L] as string];
    const gapLeft = (d - L - 1);
    if (gapLeft < Math.max(leftRule.after, q.before)) return false;
  }
  const R = nearestRightDay(d, schedule);
  if (R !== null) {
    const rightRule = catalog[schedule[R] as string];
    const gapRight = (R - d - 1);
    if (gapRight < Math.max(q.after, rightRule.before)) return false;
  }
  return true;
}

// ---------- Planner ----------
export function planWeek(
  input: PlanInput,
  catalog: Record<string, QualityRule> = QUALITY_CATALOG,
  longRules: Record<LongKey, LongRule> = LONG_RULES
): PlanResult {
  // Normalize long
  const effLongKey = normalizeLongKey(input.longType, input.longDistanceMi);
  const long = longRules[effLongKey];

  // Blocked & candidates
  const blocked = computeBlockedDays(long);
  const candidates = candidateDays(blocked);

  // Resolve qualities, keep selection order index for stable tiebreaks
  const selected = input.qualitySelections
    .filter(k => !!catalog[k]) // ignore unknowns safely
    .map((key, idx) => ({ key, idx, rule: catalog[key] }));

  // Deterministic ordering: weight desc, then selection index asc, then key asc
  selected.sort((a, b) => {
    const byW = b.rule.weight - a.rule.weight;
    if (byW !== 0) return byW;
    const bySel = a.idx - b.idx;
    if (bySel !== 0) return bySel;
    return a.key.localeCompare(b.key);
  });

  // Greedy placement with neighbor checks
  const schedule: Partial<Record<DayIndex,string>> = {};
  const warnings: string[] = [];

  for (const item of selected) {
    const q = item.rule;
    let placed = false;

    for (const d of candidates) {
      // cannot place on blocked or occupied day (candidates already exclude blocked)
      if (schedule[d] !== undefined) continue;

      // lead-in window must be easy-only (qualities only). Blocked days count as easy.
      if (!beforeWindowOK(d, q.before, schedule)) continue;

      // spacing vs nearest neighbors
      if (!spacingOK(d, q, schedule, catalog)) continue;

      // place
      schedule[d] = q.key;
      placed = true;
      break;
    }

    if (!placed) warnings.push(`Could not fit "${q.key}" given the spacing rules and long-run buffers.`);
  }

  return { viableDays: candidates, schedule, warnings };
}

// ---------- Pretty helpers (optional) ----------
export function dayName(d: DayIndex): string { return DAYS[d]; }

export function formatViableDays(days: DayIndex[]): string {
  return days.length ? days.map(dayName).join(", ") : "no days";
}
