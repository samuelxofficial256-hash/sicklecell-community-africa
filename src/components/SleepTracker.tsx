import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Moon, Sparkles, Plus, Clock, ArrowLeft, RefreshCw, Trash2, ShieldAlert } from 'lucide-react';
import { dbService } from '../dbService';
import { SleepLog } from '../types';

interface SleepTrackerProps {
  userId: string;
  onBack?: () => void;
}

const QUALITY_DEFS = [
  { value: 'Poor', emoji: '😣', desc: 'Fragmented or aching', color: 'border-red-100 text-red-700 bg-red-50/50 hover:bg-red-50' },
  { value: 'Fair', emoji: '🥱', desc: 'Restless but okay', color: 'border-amber-100 text-amber-700 bg-amber-50/50 hover:bg-amber-50' },
  { value: 'Good', emoji: '😴', desc: 'Deep and comfortable', color: 'border-teal-100 text-teal-700 bg-teal-50/50 hover:bg-teal-50' },
  { value: 'Excellent', emoji: '🌟', desc: 'Absolutely refreshing', color: 'border-emerald-100 text-emerald-700 bg-emerald-50/50 hover:bg-emerald-50' }
];

export const SleepTracker: React.FC<SleepTrackerProps> = ({ userId, onBack }) => {
  const [logs, setLogs] = useState<SleepLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [duration, setDuration] = useState<number>(8);
  const [quality, setQuality] = useState<'Poor' | 'Fair' | 'Good' | 'Excellent'>('Good');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await dbService.getSleepLogs(userId);
      setLogs(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [userId]);

  const handleSaveSleep = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const log = await dbService.saveSleepLog({
        userId,
        durationHours: duration,
        quality,
        notes: notes.trim() || undefined,
        dateTime: new Date().toISOString()
      });
      setLogs(prev => [log, ...prev]);
      setNotes('');
      setDuration(8);
      setQuality('Good');
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteLog = async (id: string) => {
    try {
      await dbService.deleteSleepLog(id);
      setLogs(prev => prev.filter(l => l.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  const currentQualityDef = QUALITY_DEFS.find(q => q.value === quality) || QUALITY_DEFS[2];

  // Calculate statistics
  const averageSleep = logs.length > 0
    ? Math.round((logs.reduce((sum, l) => sum + l.durationHours, 0) / logs.length) * 10) / 10
    : 0;

  return (
    <div id="sleep-tracker-view" className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-2">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              id="back-from-sleep-btn"
              onClick={onBack}
              className="p-2 text-slate-600 hover:text-slate-900 transition-colors rounded-lg bg-slate-100"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          <div>
            <h2 className="text-2xl font-semibold text-slate-900 tracking-tight">Sleep & Rest</h2>
            <p className="text-sm text-slate-500">Document nightly sleep quality and physical body resting time</p>
          </div>
        </div>

        <button
          id="refresh-sleep-btn"
          onClick={fetchLogs}
          className="p-2 text-slate-500 hover:text-indigo-600 transition-colors"
          title="Refresh Sleep History"
        >
          <RefreshCw className="h-5 w-5" />
        </button>
      </div>

      {/* Clinical Support Box */}
      <div className="p-4 bg-indigo-50/70 border border-indigo-100 rounded-xl flex items-start gap-3">
        <ShieldAlert className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
        <div className="text-xs text-indigo-900 leading-relaxed">
          <span className="font-semibold block mb-0.5">Sickle Cell Care Insight:</span>
          Sleep debt triggers cortisol spikes and triggers localized hypoxia, resulting in painful blockages. Always target 7–9 hours of deep sleep, and secure a warm draft-free room to keep microcirculation unhindered.
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Log Sleep Form */}
        <form
          id="log-sleep-form"
          onSubmit={handleSaveSleep}
          className="lg:col-span-12 xl:col-span-5 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6 relative"
        >
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-indigo-600 rounded-t-2xl"></div>

          <div className="space-y-1">
            <h3 className="font-semibold text-slate-900 flex items-center gap-1.5">
              Record Nightly Rest <Sparkles className="h-4 w-4 text-indigo-500" />
            </h3>
            <p className="text-xs text-slate-400">Save your resting hours and sleep feedback regularly</p>
          </div>

          {/* Sleep Hours Slider */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-slate-600">Sleep Duration</label>
              <span className="text-sm font-bold text-indigo-600 font-mono flex items-center gap-1">
                <Clock className="h-4 w-4 text-indigo-600" /> {duration} hours
              </span>
            </div>
            <input
              id="sleep-duration-range-slider"
              type="range"
              min="3"
              max="15"
              step="0.5"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>3 hrs</span>
              <span>8 hrs (Ideal)</span>
              <span>15 hrs</span>
            </div>
          </div>

          {/* Sleep Quality */}
          <div className="space-y-3">
            <label className="text-xs font-semibold text-slate-600 block">Sleep Quality</label>
            <div className="grid grid-cols-2 gap-2">
              {QUALITY_DEFS.map((qualityDef) => {
                const isSelected = quality === qualityDef.value;
                return (
                  <button
                    id={`sleep-quality-${qualityDef.value}-btn`}
                    type="button"
                    key={qualityDef.value}
                    onClick={() => setQuality(qualityDef.value as any)}
                    className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
                      isSelected
                        ? 'border-indigo-600 ring-1 ring-indigo-600 bg-indigo-50/20 text-indigo-900'
                        : `border-slate-100 ${qualityDef.color}`
                    }`}
                  >
                    <span className="text-2xl">{qualityDef.emoji}</span>
                    <span className="text-xs font-semibold mt-1">{qualityDef.value}</span>
                    <span className="text-[9px] text-slate-400 mt-0.5 leading-normal">{qualityDef.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Rest comments */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-600 block">Reflective Rest Notes</label>
            <textarea
              id="sleep-notes-input"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 focus:ring-1 focus:ring-indigo-505 focus:outline-none min-h-[70px]"
              placeholder="E.g., Took hot tea beforehand, warm blanket, slept without pain interruption."
            />
          </div>

          <button
            id="submit-sleep-btn"
            type="submit"
            disabled={saving}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-sm cursor-pointer disabled:opacity-50"
          >
            <Plus className="h-4 w-4" /> {saving ? 'Saving...' : 'Record Sleep Log'}
          </button>
        </form>

        {/* Rest Analytics Dashboard */}
        <div id="sleep-analytics-card" className="lg:col-span-12 xl:col-span-7 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-center">
              <span className="text-xs text-slate-400 font-medium">Average Sleep Duration</span>
              <div id="average-sleep-hours" className="text-3xl font-extrabold text-indigo-700 font-mono mt-1">{averageSleep} hrs</div>
              <span className="text-[10px] text-indigo-500 font-semibold block mt-1">Recommended: 7 - 9 hours</span>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-center flex flex-col items-center justify-center">
              <span className="text-xs text-slate-400 font-medium block mb-1">Most Recent Quality</span>
              {logs.length > 0 ? (
                (() => {
                  const recent = logs[0];
                  const qDef = QUALITY_DEFS.find(q => q.value === recent.quality) || QUALITY_DEFS[2];
                  return (
                    <div className="flex items-center gap-1 text-slate-800">
                      <span className="text-xl">{qDef.emoji}</span>
                      <span className="font-bold text-sm">{recent.quality}</span>
                    </div>
                  );
                })()
              ) : (
                <span className="text-xs text-slate-400 font-mono">No data logged</span>
              )}
            </div>
          </div>

          {/* Sleek Custom SVG Bar graph */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-700 block">Sleep Consistency (Last 5 nights)</span>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 h-28 relative flex items-end justify-between gap-4">
              {logs.length === 0 ? (
                <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-400">
                  No sleep consistency data logged
                </div>
              ) : (
                [...logs].reverse().slice(-5).map((log, idx) => {
                  const percent = Math.min(100, (log.durationHours / 12) * 100);
                  const qDef = QUALITY_DEFS.find(q => q.value === log.quality) || QUALITY_DEFS[2];
                  return (
                    <div key={log.id} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                      <div className="text-xs shrink-0 font-mono font-bold text-indigo-700">{log.durationHours}h</div>
                      {/* Bar container */}
                      <div className="w-full bg-slate-200/60 rounded-t-md h-16 relative overflow-hidden flex items-end">
                        <motion.div
                          className="w-full bg-gradient-to-t from-indigo-500 to-indigo-600 rounded-t-md"
                          style={{ height: `${percent}%` }}
                          initial={{ scaleY: 0 }}
                          animate={{ scaleY: 1 }}
                          transition={{ duration: 0.8 }}
                        />
                      </div>
                      <span className="text-sm shrink-0" title={log.quality}>{qDef.emoji}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* sleep entries log checklist */}
          <div className="space-y-3">
            <span className="text-xs font-semibold text-slate-700 block">Log History</span>
            <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
              {logs.map((log) => {
                const qDef = QUALITY_DEFS.find(q => q.value === log.quality) || QUALITY_DEFS[2];
                return (
                  <div id={`sleep-row-${log.id}`} key={log.id} className="p-3 bg-white hover:bg-slate-50/50 border border-slate-100 rounded-xl flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600 shrink-0 mt-0.5">
                        <Moon className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800 text-sm font-mono">{log.durationHours} Hours</span>
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full font-semibold">
                            {qDef.emoji} {log.quality}
                          </span>
                        </div>
                        {log.notes && <p className="text-xs text-slate-500 mt-1">{log.notes}</p>}
                        <span className="text-[9px] text-slate-400 font-mono block mt-1">
                          {new Date(log.dateTime).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <button
                      id={`delete-sleep-log-${log.id}-btn`}
                      onClick={() => handleDeleteLog(log.id)}
                      className="p-1.5 text-slate-400 hover:text-red-650 hover:bg-red-50 rounded transition-all cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
