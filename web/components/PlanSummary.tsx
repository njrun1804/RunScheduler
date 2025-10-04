'use client';

import { useState } from 'react';
import {
  calculateWeeklyLoad,
  exportToICS,
  savePlan,
  loadPlans,
  deletePlan,
  formatWeekAsText,
  formatWeekAsMarkdown,
  type PlanInput,
  type PlanResult,
  type SavedPlan
} from '@/lib/planner-adapter';
import { Download, Save, History, Trash2, Activity, Copy, Check } from 'lucide-react';

interface PlanSummaryProps {
  input: PlanInput | null;
  result: PlanResult | null;
}

export function PlanSummary({ input, result }: PlanSummaryProps) {
  const [notes, setNotes] = useState('');
  const [savedPlans, setSavedPlans] = useState<SavedPlan[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copyFormat, setCopyFormat] = useState<'text' | 'markdown'>('text');

  if (!input || !result) return null;

  const weeklyLoad = calculateWeeklyLoad(result.schedule, input.longType, result);
  const qualityCount = Object.keys(result.schedule).length;

  const handleExport = () => {
    const icsContent = exportToICS(result.schedule, input.longType, new Date(), result);
    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `training-week-${new Date().toISOString().split('T')[0]}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSave = () => {
    const saved = savePlan(input, result, notes);
    alert('Plan saved successfully!');
    setNotes('');
  };

  const handleShowHistory = () => {
    setSavedPlans(loadPlans());
    setShowHistory(!showHistory);
  };

  const handleDelete = (id: string) => {
    deletePlan(id);
    setSavedPlans(loadPlans());
  };

  const handleCopy = async () => {
    const text = copyFormat === 'markdown'
      ? formatWeekAsMarkdown(result.schedule, input.longType, input.longDistanceMi, result)
      : formatWeekAsText(result.schedule, input.longType, input.longDistanceMi, result);

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const getLoadIndicator = (load: number) => {
    if (load >= 80) return { color: 'text-red-600 dark:text-red-400', label: 'High' };
    if (load >= 60) return { color: 'text-orange-600 dark:text-orange-400', label: 'Moderate' };
    if (load >= 40) return { color: 'text-yellow-600 dark:text-yellow-400', label: 'Base' };
    return { color: 'text-green-600 dark:text-green-400', label: 'Recovery' };
  };

  const loadInfo = getLoadIndicator(weeklyLoad);

  // Motivational quotes that change based on load
  const getMotivationalQuote = () => {
    const quotes = {
      High: [
        "Big week ahead! Trust the process 💪",
        "Champions are made in weeks like this 🏆",
        "Embrace the challenge, own the miles 🔥"
      ],
      Moderate: [
        "Steady progress builds lasting fitness 📈",
        "Consistency is your superpower ⚡",
        "Another brick in your marathon wall 🧱"
      ],
      Base: [
        "Building the foundation for greatness 🏗️",
        "Easy miles, hard rewards 🌟",
        "Recovery is where the magic happens ✨"
      ],
      Recovery: [
        "Rest hard, run harder 😴",
        "Your body is adapting and getting stronger 🌱",
        "Recovery weeks make PR weeks possible 🎯"
      ]
    };

    const loadQuotes = quotes[loadInfo.label as keyof typeof quotes] || quotes.Base;
    return loadQuotes[Math.floor(Math.random() * loadQuotes.length)];
  };

  return (
    <>
      <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          📊 Week Summary
        </h2>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <Activity className="h-6 w-6 mx-auto mb-1 text-blue-600 dark:text-blue-400" />
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{qualityCount}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Quality Sessions</div>
          </div>

          <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className={`text-2xl font-bold ${loadInfo.color}`}>{weeklyLoad}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Training Load</div>
            <div className={`text-xs font-medium ${loadInfo.color}`}>{loadInfo.label}</div>
          </div>

          <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {input.longDistanceMi}mi
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Long Run</div>
          </div>
        </div>

        {/* Motivational Quote */}
        <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg mb-6">
          <p className="text-center italic text-gray-700 dark:text-gray-300">
            "{getMotivationalQuote()}"
          </p>
        </div>

        {/* Notes */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Week Notes (optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="How are you feeling? Any races coming up?"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={2}
          />
        </div>

        {/* Copy Format Selector */}
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-600 dark:text-gray-400">Copy as:</span>
          <button
            onClick={() => setCopyFormat('text')}
            className={`px-3 py-1 rounded ${copyFormat === 'text' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
          >
            Text
          </button>
          <button
            onClick={() => setCopyFormat('markdown')}
            className={`px-3 py-1 rounded ${copyFormat === 'markdown' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
          >
            Markdown
          </button>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleCopy}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? 'Copied!' : 'Copy Week'}
          </button>
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            <Download className="h-4 w-4" />
            Calendar
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
          >
            <Save className="h-4 w-4" />
            Save
          </button>
          <button
            onClick={handleShowHistory}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
          >
            <History className="h-4 w-4" />
            History
          </button>
        </div>
      </div>

      {/* History Panel */}
      {showHistory && savedPlans.length > 0 && (
        <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Previous Plans
          </h3>
          <div className="space-y-3">
            {savedPlans.map((plan) => (
              <div key={plan.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {new Date(plan.date).toLocaleDateString()} - {plan.input.longType} ({plan.input.longDistanceMi}mi)
                  </div>
                  {plan.notes && (
                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">{plan.notes}</div>
                  )}
                  <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    {Object.keys(plan.result.schedule).length} qualities scheduled
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(plan.id)}
                  className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}