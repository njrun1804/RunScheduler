'use client';

import { useState, useMemo } from 'react';
import { planWeek, type PlanInput, type PlanResult, type LongKey } from '@/lib/planner-adapter';
import { LongRunConfig } from '@/components/LongRunConfig';
import { QualitySelector } from '@/components/QualitySelector';
import { WeekGrid } from '@/components/WeekGrid';
import { PlanSummary } from '@/components/PlanSummary';
import { StatsBar } from '@/components/StatsBar';
import { ThemeToggle } from '@/components/ThemeToggle';
import { RefreshCw, Github } from 'lucide-react';

export default function Home() {
  const [longType, setLongType] = useState<LongKey>('easy');
  const [longDistance, setLongDistance] = useState(16);
  const [selectedQualities, setSelectedQualities] = useState<string[]>([]);

  // Calculate plan whenever inputs change (using useMemo to avoid derived state)
  const { input, result } = useMemo(() => {
    if (selectedQualities.length === 0) {
      return { input: null, result: null };
    }

    const planInput: PlanInput = {
      longType,
      longDistanceMi: longDistance,
      qualitySelections: selectedQualities
    };
    const planResult = planWeek(planInput);
    return { input: planInput, result: planResult };
  }, [longType, longDistance, selectedQualities]);

  const handleReset = () => {
    setSelectedQualities([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🏃‍♂️</span>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Run Scheduler
              </h1>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Weekly Training Planner
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleReset}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all hover:scale-110 active:scale-95"
                aria-label="Reset"
              >
                <RefreshCw className="h-5 w-5" />
              </button>
              <a
                href="https://github.com/njrun1804/RunScheduler"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all hover:scale-110 active:scale-95"
                aria-label="GitHub"
              >
                <Github className="h-5 w-5" />
              </a>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Configuration */}
          <div className="lg:col-span-1 space-y-6">
            <LongRunConfig
              longType={longType}
              longDistance={longDistance}
              onLongTypeChange={setLongType}
              onDistanceChange={setLongDistance}
            />
            <QualitySelector
              selectedQualities={selectedQualities}
              onQualitiesChange={setSelectedQualities}
            />
          </div>

          {/* Right Column - Results */}
          <div className="lg:col-span-2 space-y-6">
            <StatsBar input={input} result={result} />
            <WeekGrid result={result} longType={longType} />
            <PlanSummary input={input} result={result} />
          </div>
        </div>

        {/* Instructions for first-time users */}
        {!result && selectedQualities.length === 0 && (
          <div className="mt-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 mb-4">
              <span className="text-2xl">👆</span>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Let's plan your week!
            </h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
              1. Configure your Sunday long run type and distance<br />
              2. Select the quality sessions you want to schedule<br />
              3. Watch the magic happen as we optimize your week!
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto py-6 text-center text-sm text-gray-500 dark:text-gray-400">
        <p>
          Built with 💙 for runners who love structure and science
        </p>
        <p className="mt-1">
          Based on proven marathon training principles
        </p>
      </footer>
    </div>
  );
}