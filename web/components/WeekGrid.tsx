'use client';

import { DAYS, getDayStatus, getEffortEmoji, type DayIndex, type PlanResult } from '@/lib/planner-adapter';
import * as Tooltip from '@radix-ui/react-tooltip';
import { AlertCircle, Calendar, CheckCircle, XCircle } from 'lucide-react';

interface WeekGridProps {
  result: PlanResult | null;
  longType: string;
}

export function WeekGrid({ result, longType }: WeekGridProps) {
  const getDayColor = (day: DayIndex) => {
    if (!result) return 'bg-gray-100 dark:bg-gray-700';

    const status = getDayStatus(day, result.schedule, result.viableDays);

    switch (status) {
      case 'long':
        return 'bg-purple-100 dark:bg-purple-900/30 border-purple-300 dark:border-purple-700';
      case 'quality':
        return 'bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700';
      case 'blocked':
        return 'bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700';
      case 'easy':
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
      default:
        return 'bg-gray-100 dark:bg-gray-700';
    }
  };

  const getDayIcon = (day: DayIndex) => {
    if (!result) return null;

    const status = getDayStatus(day, result.schedule, result.viableDays);

    switch (status) {
      case 'long':
        return <Calendar className="h-5 w-5 text-purple-600 dark:text-purple-400" />;
      case 'quality':
        return <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />;
      case 'blocked':
        return <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />;
      default:
        return null;
    }
  };

  const getDayContent = (day: DayIndex) => {
    if (!result) return 'Rest/Easy';

    if (day === 6) {
      return (
        <div className="text-center">
          <div className="font-semibold text-purple-700 dark:text-purple-300">Long Run</div>
          <div className="text-xs text-purple-600 dark:text-purple-400 mt-1">{longType}</div>
        </div>
      );
    }

    const quality = result.schedule[day];
    if (quality) {
      const emoji = getEffortEmoji(quality);
      return (
        <div className="text-center">
          <div className="text-2xl mb-1">{emoji}</div>
          <div className="font-medium text-green-700 dark:text-green-300 text-xs leading-tight">
            {quality.split('(')[0].trim()}
          </div>
        </div>
      );
    }

    const status = getDayStatus(day, result.schedule, result.viableDays);
    if (status === 'blocked') {
      return (
        <div className="text-center">
          <div className="font-medium text-red-700 dark:text-red-300">Blocked</div>
          <div className="text-xs text-red-600 dark:text-red-400">Recovery</div>
        </div>
      );
    }

    return (
      <div className="text-center text-gray-600 dark:text-gray-400">
        <div className="font-medium">Easy</div>
        <div className="text-xs">Recovery/Base</div>
      </div>
    );
  };

  const getTooltipContent = (day: DayIndex) => {
    if (!result) return null;

    if (day === 6) {
      return `Sunday Long Run (${longType})`;
    }

    const quality = result.schedule[day];
    if (quality) {
      return quality;
    }

    const status = getDayStatus(day, result.schedule, result.viableDays);
    if (status === 'blocked') {
      return 'Blocked for recovery from/before long run';
    }

    return 'Easy day - aerobic pace or rest';
  };

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        📅 Your Week
      </h2>

      <Tooltip.Provider>
        <div className="grid grid-cols-7 gap-2">
          {DAYS.map((dayName, index) => {
            const day = index as DayIndex;
            const isToday = new Date().getDay() === (index === 6 ? 0 : index + 1);

            return (
              <Tooltip.Root key={day}>
                <Tooltip.Trigger asChild>
                  <div
                    className={`
                      p-3 rounded-lg border-2 transition-all cursor-default
                      ${getDayColor(day)}
                      ${isToday ? 'ring-2 ring-yellow-400 ring-offset-2' : ''}
                      hover:scale-105 hover:shadow-md
                    `}
                  >
                    <div className="text-center space-y-2">
                      <div className="flex items-center justify-center gap-1">
                        <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                          {dayName}
                        </span>
                        {getDayIcon(day)}
                      </div>
                      <div className="min-h-[60px] flex items-center justify-center">
                        {getDayContent(day)}
                      </div>
                      {isToday && (
                        <div className="text-xs text-yellow-600 dark:text-yellow-400 font-medium">
                          TODAY
                        </div>
                      )}
                    </div>
                  </div>
                </Tooltip.Trigger>
                <Tooltip.Portal>
                  <Tooltip.Content
                    className="bg-gray-900 text-white px-3 py-2 rounded-md text-sm shadow-lg"
                    sideOffset={5}
                  >
                    {getTooltipContent(day)}
                    <Tooltip.Arrow className="fill-gray-900" />
                  </Tooltip.Content>
                </Tooltip.Portal>
              </Tooltip.Root>
            );
          })}
        </div>
      </Tooltip.Provider>

      {/* Warnings */}
      {result && result.warnings.length > 0 && (
        <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-amber-800 dark:text-amber-200 mb-2">
                Couldn't fit all workouts
              </h3>
              <ul className="space-y-1">
                {result.warnings.map((warning, i) => (
                  <li key={i} className="text-sm text-amber-700 dark:text-amber-300">
                    • {warning}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="mt-6 flex flex-wrap gap-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded"></div>
          <span className="text-gray-600 dark:text-gray-400">Quality</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-purple-100 dark:bg-purple-900/30 border border-purple-300 dark:border-purple-700 rounded"></div>
          <span className="text-gray-600 dark:text-gray-400">Long Run</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded"></div>
          <span className="text-gray-600 dark:text-gray-400">Blocked</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded"></div>
          <span className="text-gray-600 dark:text-gray-400">Easy</span>
        </div>
      </div>
    </div>
  );
}