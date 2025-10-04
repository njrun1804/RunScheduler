'use client';

import { useState } from 'react';
import { getAllQualities, type QualityDisplay } from '@/lib/planner-adapter';
import * as Checkbox from '@radix-ui/react-checkbox';
import { Check, Search, Zap, Flame, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface QualitySelectorProps {
  selectedQualities: string[];
  onQualitiesChange: (qualities: string[]) => void;
}

export function QualitySelector({ selectedQualities, onQualitiesChange }: QualitySelectorProps) {
  const [search, setSearch] = useState('');
  const qualities = getAllQualities();

  const filteredQualities = qualities.filter(q =>
    q.label.toLowerCase().includes(search.toLowerCase()) ||
    q.description?.toLowerCase().includes(search.toLowerCase())
  );

  const toggleQuality = (key: string) => {
    if (selectedQualities.includes(key)) {
      onQualitiesChange(selectedQualities.filter(k => k !== key));
    } else {
      onQualitiesChange([...selectedQualities, key]);
    }
  };

  const getIntensityIcon = (weight: number) => {
    if (weight >= 4) return <Flame className="h-4 w-4 text-red-500" />;
    if (weight >= 2) return <Zap className="h-4 w-4 text-yellow-500" />;
    return <Activity className="h-4 w-4 text-green-500" />;
  };

  const getIntensityLabel = (weight: number) => {
    if (weight >= 4) return 'High';
    if (weight >= 3) return 'Med-High';
    if (weight >= 2) return 'Medium';
    return 'Low';
  };

  return (
    <div className="space-y-4 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
        ⚡ Quality Sessions
        {selectedQualities.length > 0 && (
          <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
            ({selectedQualities.length} selected)
          </span>
        )}
      </h2>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search workouts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Quality List */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        <AnimatePresence>
          {filteredQualities.map((quality, index) => (
            <motion.label
              key={quality.key}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ delay: index * 0.02, duration: 0.2 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`block p-3 rounded-lg border cursor-pointer transition-all ${
                selectedQualities.includes(quality.key)
                  ? 'bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-300 dark:border-blue-700 shadow-md'
                  : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 hover:shadow-sm'
              }`}
            >
              <div className="flex items-start gap-3">
                <Checkbox.Root
                  checked={selectedQualities.includes(quality.key)}
                  onCheckedChange={() => toggleQuality(quality.key)}
                  className="mt-1 h-5 w-5 rounded border-2 border-gray-300 dark:border-gray-500 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 transition-all"
                >
                  <Checkbox.Indicator>
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 500, damping: 25 }}
                    >
                      <Check className="h-3 w-3 text-white" />
                    </motion.div>
                  </Checkbox.Indicator>
                </Checkbox.Root>

                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {quality.emoji} {quality.label}
                    </span>
                    <motion.div
                      animate={{ rotate: selectedQualities.includes(quality.key) ? 360 : 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      {getIntensityIcon(quality.weight)}
                    </motion.div>
                  </div>

                  {quality.description && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">{quality.description}</p>
                  )}

                  <div className="flex gap-3 text-xs">
                    <span className="inline-flex items-center px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300">
                      {quality.before} before
                    </span>
                    <span className="inline-flex items-center px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300">
                      {quality.after} after
                    </span>
                    <span className="inline-flex items-center px-2 py-1 rounded-full bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 text-purple-700 dark:text-purple-400 font-medium">
                      {getIntensityLabel(quality.weight)}
                    </span>
                  </div>
                </div>
              </div>
            </motion.label>
          ))}
        </AnimatePresence>
      </div>

      {filteredQualities.length === 0 && (
        <p className="text-center text-gray-500 dark:text-gray-400 py-8">
          No workouts found matching "{search}"
        </p>
      )}
    </div>
  );
}