'use client';

import { type PlanResult, type PlanInput, QUALITY_CATALOG, LONG_RULES } from '@/lib/planner-adapter';
import { motion } from 'framer-motion';
import { TrendingUp, Zap, Target, Activity } from 'lucide-react';

interface StatsBarProps {
  input: PlanInput | null;
  result: PlanResult | null;
}

export function StatsBar({ input, result }: StatsBarProps) {
  if (!input || !result) return null;

  // Calculate estimated weekly mileage
  const estimateWeeklyMileage = () => {
    let miles = input.longDistanceMi; // Sunday long run

    // Add quality session miles (rough estimates)
    Object.values(result.schedule).forEach(qualityKey => {
      const quality = QUALITY_CATALOG[qualityKey];
      if (quality) {
        // Rough estimates based on workout type
        const workoutMiles = quality.weight >= 4 ? 8 : quality.weight >= 2 ? 6 : 4;
        miles += workoutMiles;
      }
    });

    // Add easy day miles (assume 6 miles per easy day)
    const easyDays = 7 - Object.keys(result.schedule).length - 1; // -1 for Sunday
    miles += easyDays * 6;

    return Math.round(miles);
  };

  // Calculate intensity balance (0-100)
  const calculateIntensityBalance = () => {
    const totalDays = Object.keys(result.schedule).length + 1; // +1 for long run
    const intensityScore = Object.values(result.schedule).reduce((sum, qualityKey) => {
      const quality = QUALITY_CATALOG[qualityKey];
      return sum + (quality?.weight || 0);
    }, 0);

    const longIntensity = result.effectiveLongType === 'mp' ? 4 :
                          result.effectiveLongType === 'big' ? 3 :
                          result.effectiveLongType === 'progressive' || result.effectiveLongType === 'hilly' ? 3 : 2;

    const totalIntensity = intensityScore + longIntensity;
    const maxPossibleIntensity = totalDays * 4; // Max weight is 4

    return Math.round((totalIntensity / maxPossibleIntensity) * 100);
  };

  // Calculate volume vs intensity ratio
  const calculateVolumeIntensityRatio = () => {
    const intensity = calculateIntensityBalance();
    return intensity < 40 ? 'High Volume, Low Intensity' :
           intensity < 60 ? 'Balanced' :
           'High Intensity, Lower Volume';
  };

  const weeklyMiles = estimateWeeklyMileage();
  const intensityBalance = calculateIntensityBalance();
  const ratio = calculateVolumeIntensityRatio();

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="p-4 bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 dark:from-blue-900/20 dark:via-purple-900/20 dark:to-pink-900/20 rounded-lg border border-blue-200 dark:border-blue-800 mb-6"
    >
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Weekly Mileage */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm"
        >
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Est. Mileage</div>
            <div className="text-xl font-bold text-gray-900 dark:text-white">
              {weeklyMiles} mi
            </div>
          </div>
        </motion.div>

        {/* Intensity Balance */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm"
        >
          <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
            <Zap className="h-5 w-5 text-orange-600 dark:text-orange-400" />
          </div>
          <div className="flex-1">
            <div className="text-sm text-gray-600 dark:text-gray-400">Intensity</div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${intensityBalance}%` }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                  className={`h-full ${
                    intensityBalance < 40 ? 'bg-green-500' :
                    intensityBalance < 60 ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`}
                />
              </div>
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                {intensityBalance}%
              </span>
            </div>
          </div>
        </motion.div>

        {/* Quality Count */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm"
        >
          <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
            <Activity className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Quality Days</div>
            <div className="text-xl font-bold text-gray-900 dark:text-white">
              {Object.keys(result.schedule).length + 1}
            </div>
          </div>
        </motion.div>

        {/* Balance Type */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm"
        >
          <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
            <Target className="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Balance</div>
            <div className="text-xs font-semibold text-gray-700 dark:text-gray-300">
              {ratio}
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
