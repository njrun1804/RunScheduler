'use client';

import { LONG_RULES, type LongKey } from '@/lib/planner-adapter';
import * as Select from '@radix-ui/react-select';
import * as Label from '@radix-ui/react-label';
import { ChevronDown, AlertCircle } from 'lucide-react';

interface LongRunConfigProps {
  longType: LongKey;
  longDistance: number;
  onLongTypeChange: (type: LongKey) => void;
  onDistanceChange: (distance: number) => void;
}

export function LongRunConfig({
  longType,
  longDistance,
  onLongTypeChange,
  onDistanceChange
}: LongRunConfigProps) {
  const willUpgrade = longType === 'easy' && longDistance >= 21;
  const effectiveType = willUpgrade ? 'big' : longType;
  const rule = LONG_RULES[effectiveType];

  return (
    <div className="space-y-4 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
        🏃‍♂️ Sunday Long Run
      </h2>

      <div className="space-y-4">
        {/* Long Run Type */}
        <div>
          <Label.Root htmlFor="long-type" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
            Long Run Type
          </Label.Root>
          <Select.Root value={longType} onValueChange={(v) => onLongTypeChange(v as LongKey)}>
            <Select.Trigger
              id="long-type"
              className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white flex items-center justify-between"
            >
              <Select.Value />
              <Select.Icon>
                <ChevronDown className="h-4 w-4" />
              </Select.Icon>
            </Select.Trigger>
            <Select.Portal>
              <Select.Content className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg">
                <Select.Viewport className="p-1">
                  {Object.values(LONG_RULES).map((rule) => (
                    <Select.Item
                      key={rule.key}
                      value={rule.key}
                      className="px-3 py-2 cursor-pointer hover:bg-blue-50 dark:hover:bg-gray-600 rounded text-gray-900 dark:text-white outline-none"
                    >
                      <Select.ItemText>{rule.label}</Select.ItemText>
                    </Select.Item>
                  ))}
                </Select.Viewport>
              </Select.Content>
            </Select.Portal>
          </Select.Root>
        </div>

        {/* Distance */}
        <div>
          <Label.Root htmlFor="distance" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
            Distance (miles): <span className="font-bold text-blue-600 dark:text-blue-400">{longDistance}</span>
          </Label.Root>
          <input
            id="distance"
            type="range"
            min="10"
            max="26"
            step="0.5"
            value={longDistance}
            onChange={(e) => onDistanceChange(parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-blue-600"
          />
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
            <span>10</span>
            <span>15</span>
            <span>20</span>
            <span>26</span>
          </div>
        </div>

        {/* Auto-upgrade warning */}
        {willUpgrade && (
          <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800 dark:text-amber-200">
              <p className="font-medium">Auto-upgrade activated!</p>
              <p className="text-xs mt-1">
                At {longDistance} miles, your Long Easy will be treated as Big Easy (2 days before/after buffers)
              </p>
            </div>
          </div>
        )}

        {/* Buffer display */}
        <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">{rule.before}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Days Before</div>
            <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              {rule.before === 1 ? 'Sat' : 'Fri-Sat'}
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{rule.after}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Days After</div>
            <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              {rule.after === 1 ? 'Mon' : rule.after === 2 ? 'Mon-Tue' : 'Mon-Wed'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}