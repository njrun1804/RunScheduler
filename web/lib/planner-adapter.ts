// Adapter for the core planner logic
import {
  planWeek,
  LONG_RULES,
  QUALITY_CATALOG,
  DAYS,
  type DayIndex,
  type PlanInput,
  type PlanResult,
  type LongKey,
  type QualityRule,
  type LongRule
} from '../../src/planner';

export {
  planWeek,
  LONG_RULES,
  QUALITY_CATALOG,
  DAYS,
  type DayIndex,
  type PlanInput,
  type PlanResult,
  type LongKey,
  type QualityRule,
  type LongRule
};

// Helper to get blocked days (inverse of viable)
export function getBlockedDays(viableDays: DayIndex[]): DayIndex[] {
  const allDays = [0, 1, 2, 3, 4, 5] as DayIndex[]; // Mon-Sat (Sun always blocked)
  return allDays.filter(d => !viableDays.includes(d));
}

// Helper for UI display
export function getDayStatus(
  day: DayIndex,
  schedule: Partial<Record<DayIndex, string>>,
  viableDays: DayIndex[]
): 'quality' | 'blocked' | 'easy' | 'long' {
  if (day === 6) return 'long'; // Sunday
  if (schedule[day]) return 'quality';
  if (!viableDays.includes(day)) return 'blocked';
  return 'easy';
}

// Get emoji for effort level based on quality type
export function getEffortEmoji(qualityKey: string): string {
  const quality = QUALITY_CATALOG[qualityKey];
  if (!quality) return '🏃';

  const weight = quality.weight;
  if (weight >= 4) return '🔥'; // High intensity
  if (weight >= 3) return '💪'; // Medium-high
  if (weight >= 2) return '⚡'; // Medium
  return '🏃'; // Easy/steady
}

// Format quality for display with badges
export interface QualityDisplay {
  key: string;
  label: string;
  before: number;
  after: number;
  weight: number;
  emoji: string;
  description?: string;
}

export function formatQualityForDisplay(key: string): QualityDisplay | null {
  const quality = QUALITY_CATALOG[key];
  if (!quality) return null;

  return {
    key,
    label: key,
    before: quality.before,
    after: quality.after,
    weight: quality.weight,
    emoji: getEffortEmoji(key),
    description: quality.desc
  };
}

// Get all qualities formatted for UI
export function getAllQualities(): QualityDisplay[] {
  return Object.keys(QUALITY_CATALOG)
    .map(formatQualityForDisplay)
    .filter((q): q is QualityDisplay => q !== null);
}

// Calculate weekly training stress (simple heuristic)
export function calculateWeeklyLoad(
  schedule: Partial<Record<DayIndex, string>>,
  longType: LongKey,
  result?: PlanResult
): number {
  let load = 0;

  // Add quality session loads
  Object.values(schedule).forEach(qualityKey => {
    const quality = QUALITY_CATALOG[qualityKey as string];
    if (quality) {
      load += quality.weight * 10; // Weight as proxy for intensity
    }
  });

  // Use effective long type if available (from auto-upgrade)
  const effectiveType = result?.effectiveLongType || longType;

  // Add long run load
  const longLoad = {
    easy: 15,
    progressive: 25,
    hilly: 25,
    big: 30,
    mp: 35
  };
  load += longLoad[effectiveType];

  return load;
}

// Export to calendar format (basic ICS)
export function exportToICS(
  schedule: Partial<Record<DayIndex, string>>,
  longType: LongKey,
  startDate: Date = new Date(),
  result?: PlanResult
): string {
  const events: string[] = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//RunScheduler//EN'];

  // Helper to format date for ICS
  const formatDate = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  // Add quality sessions
  Object.entries(schedule).forEach(([dayStr, quality]) => {
    const day = parseInt(dayStr) as DayIndex;
    const date = new Date(startDate);
    date.setDate(date.getDate() + day - date.getDay() + 1); // Adjust to the right day

    events.push('BEGIN:VEVENT');
    events.push(`DTSTART:${formatDate(date)}`);
    events.push(`DTEND:${formatDate(new Date(date.getTime() + 90 * 60000))}`); // 90 min default
    events.push(`SUMMARY:${quality}`);
    events.push(`DESCRIPTION:Quality workout: ${quality}`);
    events.push('END:VEVENT');
  });

  // Use effective long type if available (from auto-upgrade)
  const effectiveType = result?.effectiveLongType || longType;

  // Add Sunday long run
  const sunday = new Date(startDate);
  sunday.setDate(sunday.getDate() + (7 - sunday.getDay()));
  const longLabel = LONG_RULES[effectiveType].label;

  events.push('BEGIN:VEVENT');
  events.push(`DTSTART:${formatDate(sunday)}`);
  events.push(`DTEND:${formatDate(new Date(sunday.getTime() + 180 * 60000))}`); // 3 hours
  events.push(`SUMMARY:${longLabel}`);
  events.push(`DESCRIPTION:Sunday long run: ${longLabel}`);
  events.push('END:VEVENT');

  events.push('END:VCALENDAR');
  return events.join('\r\n');
}

// Save/load from localStorage
export interface SavedPlan {
  id: string;
  date: string;
  input: PlanInput;
  result: PlanResult;
  notes?: string;
}

export function savePlan(input: PlanInput, result: PlanResult, notes?: string): SavedPlan {
  const plan: SavedPlan = {
    id: Date.now().toString(),
    date: new Date().toISOString(),
    input,
    result,
    notes
  };

  const saved = localStorage.getItem('runSchedulerPlans');
  const plans = saved ? JSON.parse(saved) : [];
  plans.unshift(plan); // Add to beginning
  plans.splice(10); // Keep only last 10

  localStorage.setItem('runSchedulerPlans', JSON.stringify(plans));
  return plan;
}

export function loadPlans(): SavedPlan[] {
  const saved = localStorage.getItem('runSchedulerPlans');
  return saved ? JSON.parse(saved) : [];
}

export function deletePlan(id: string): void {
  const plans = loadPlans().filter(p => p.id !== id);
  localStorage.setItem('runSchedulerPlans', JSON.stringify(plans));
}

// Export week as text
export function formatWeekAsText(
  schedule: Partial<Record<DayIndex, string>>,
  longType: LongKey,
  longDistanceMi: number,
  result?: PlanResult
): string {
  const effectiveType = result?.effectiveLongType || longType;
  const longLabel = LONG_RULES[effectiveType].label;

  const lines = [
    '📅 WEEKLY TRAINING PLAN',
    '=' . repeat(50),
    ''
  ];

  // Add each day
  DAYS.forEach((dayName, index) => {
    const day = index as DayIndex;

    if (day === 6) {
      lines.push(`${dayName}: ${longLabel} (${longDistanceMi} mi)`);
    } else {
      const quality = schedule[day];
      if (quality) {
        lines.push(`${dayName}: ${quality}`);
      } else {
        const status = getDayStatus(day, schedule, result?.viableDays || []);
        if (status === 'blocked') {
          lines.push(`${dayName}: Recovery (blocked)`);
        } else {
          lines.push(`${dayName}: Easy run`);
        }
      }
    }
  });

  lines.push('');
  lines.push('Generated with RunScheduler 🏃‍♂️');

  return lines.join('\n');
}

// Export week as markdown
export function formatWeekAsMarkdown(
  schedule: Partial<Record<DayIndex, string>>,
  longType: LongKey,
  longDistanceMi: number,
  result?: PlanResult
): string {
  const effectiveType = result?.effectiveLongType || longType;
  const longLabel = LONG_RULES[effectiveType].label;

  const lines = [
    '# 📅 Weekly Training Plan',
    '',
    '| Day | Workout |',
    '| --- | --- |'
  ];

  // Add each day
  DAYS.forEach((dayName, index) => {
    const day = index as DayIndex;

    if (day === 6) {
      lines.push(`| **${dayName}** | ${longLabel} (${longDistanceMi} mi) |`);
    } else {
      const quality = schedule[day];
      if (quality) {
        lines.push(`| **${dayName}** | ${quality} |`);
      } else {
        const status = getDayStatus(day, schedule, result?.viableDays || []);
        if (status === 'blocked') {
          lines.push(`| ${dayName} | Recovery (blocked) |`);
        } else {
          lines.push(`| ${dayName} | Easy run |`);
        }
      }
    }
  });

  lines.push('');
  lines.push('_Generated with RunScheduler 🏃‍♂️_');

  return lines.join('\n');
}