import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Smile, Frown, Meh, SmilePlus, Angry, Calendar, ArrowLeft, RefreshCw, Sparkles, Send, Trash2 } from 'lucide-react';
import { dbService } from '../dbService';
import { MoodLog } from '../types';

interface MoodTrackerProps {
  userId: string;
  onBack?: () => void;
}

const MOODS_DEFS = [
  { score: 1, emoji: '😢', label: 'Awful', color: 'hover:bg-rose-100 hover:border-rose-300 border-slate-100', activeBg: 'bg-rose-50 border-rose-300 text-rose-600', icon: Angry, textCol: 'text-rose-600' },
  { score: 2, emoji: '🙁', label: 'Bad', color: 'hover:bg-orange-100 hover:border-orange-300 border-slate-100', activeBg: 'bg-orange-50 border-orange-300 text-orange-600', icon: Frown, textCol: 'text-orange-600' },
  { score: 3, emoji: '😐', label: 'Okay', color: 'hover:bg-amber-100 hover:border-amber-300 border-slate-100', activeBg: 'bg-amber-50 border-amber-300 text-amber-600', icon: Meh, textCol: 'text-amber-500' },
  { score: 4, emoji: '🙂', label: 'Good', color: 'hover:bg-teal-100 hover:border-teal-300 border-slate-100', activeBg: 'bg-teal-50 border-teal-300 text-teal-650', icon: Smile, textCol: 'text-teal-650' },
  { score: 5, emoji: '😄', label: 'Great', color: 'hover:bg-emerald-100 hover:border-emerald-300 border-slate-100', activeBg: 'bg-emerald-50 border-emerald-300 text-emerald-650', icon: SmilePlus, textCol: 'text-emerald-700' }
];

export const MoodTracker: React.FC<MoodTrackerProps> = ({ userId, onBack }) => {
  const [logs, setLogs] = useState<MoodLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedScore, setSelectedScore] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await dbService.getMoodLogs(userId);
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

  const handleSaveMood = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedScore) return;

    setSaving(true);
    try {
      const log = await dbService.saveMoodLog({
        userId,
        score: selectedScore,
        notes: notes.trim() || undefined,
        dateTime: new Date().toISOString()
      });
      setLogs(prev => [log, ...prev]);
      setSelectedScore(null);
      setNotes('');
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteLog = async (id: string) => {
    try {
      await dbService.deleteMoodLog(id);
      setLogs(prev => prev.filter(l => l.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  const currentMoodDef = selectedScore ? MOODS_DEFS.find(m => m.score === selectedScore) : null;

  return (
    <div id="mood-tracker-view" className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-2">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              id="back-from-mood-btn"
              onClick={onBack}
              className="p-2 text-slate-600 hover:text-slate-900 transition-colors rounded-lg bg-slate-100"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          <div>
            <h2 className="text-2xl font-semibold text-slate-900 tracking-tight">Mood & Wellness</h2>
            <p className="text-sm text-slate-500">Track mental strength & coping patterns</p>
          </div>
        </div>

        <button
          id="refresh-mood-btn"
          onClick={fetchLogs}
          className="p-2 text-slate-500 hover:text-emerald-600 transition-colors"
          title="Refresh Mood Logs"
        >
          <RefreshCw className="h-5 w-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Log daily Mood Form */}
        <form
          id="log-mood-form"
          onSubmit={handleSaveMood}
          className="lg:col-span-12 xl:col-span-5 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6 relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-emerald-500"></div>

          <div className="space-y-1">
            <h3 className="font-semibold text-slate-900 flex items-center gap-1.5">
              Daily Mood Check-in <Sparkles className="h-4 w-4 text-emerald-500" />
            </h3>
            <p className="text-xs text-slate-400">How are you feeling mentally and physically right now?</p>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-semibold text-slate-600 block">Select Mood</label>
            <div className="grid grid-cols-5 gap-2">
              {MOODS_DEFS.map((mood) => {
                const isActive = selectedScore === mood.score;
                return (
                  <button
                    id={`mood-button-${mood.score}`}
                    type="button"
                    key={mood.score}
                    onClick={() => setSelectedScore(mood.score)}
                    className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all text-center cursor-pointer ${
                      isActive ? mood.activeBg : `bg-slate-50/50 ${mood.color}`
                    }`}
                  >
                    <span className="text-2xl">{mood.emoji}</span>
                    <span className="text-[10px] font-medium text-slate-500">{mood.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {selectedScore && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-3"
            >
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  Coping/Reflective Notes (Optional)
                </label>
                <textarea
                  id="mood-notes-textarea"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 focus:ring-1 focus:ring-emerald-500 focus:outline-none min-h-[80px]"
                  placeholder="Any joint pain? Fatigue? Dehydrated? Having cold/flu? Or feeling healthy today?"
                />
              </div>

              <button
                id="save-mood-log-btn"
                type="submit"
                disabled={saving}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-sm cursor-pointer disabled:opacity-50"
              >
                <Send className="h-4 w-4" /> {saving ? 'Logging...' : 'Log Mood'}
              </button>
            </motion.div>
          )}
        </form>

        {/* Wellness trends visualizer */}
        <div id="mood-trends-card" className="lg:col-span-12 xl:col-span-7 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-slate-800">Wellness Analytics</h3>
              <p className="text-xs text-slate-400 font-medium">Recent mood logs and trends</p>
            </div>
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400">Loading mood history...</div>
          ) : logs.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">No mood records logged yet. Check in above!</div>
          ) : (
            <div className="space-y-6">
              {/* Splendid SVG mood line graph */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="flex justify-between items-center text-xs text-slate-400 mb-2">
                  <span>Great 😃</span>
                  <span>Awful 😢</span>
                </div>
                <div className="h-32 w-full relative group">
                  <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                    {/* Gridlines */}
                    <line x1="0" y1="20" x2="100" y2="20" stroke="#f1f5f9" strokeWidth="0.5" />
                    <line x1="0" y1="50" x2="100" y2="50" stroke="#f1f5f9" strokeWidth="0.5" />
                    <line x1="0" y1="80" x2="100" y2="80" stroke="#f1f5f9" strokeWidth="0.5" />

                    {/* Plotting points */}
                    {(() => {
                      const trendLogs = [...logs].reverse().slice(-7); // Last 7 entries
                      if (trendLogs.length < 2) return null;
                      
                      const points = trendLogs.map((log, i) => {
                        const x = (i / (trendLogs.length - 1)) * 100;
                        // Score 1 -> y=90, Score 5 -> y=10
                        const y = 90 - ((log.score - 1) / 4) * 80;
                        return { x, y };
                      });

                      const pathD = `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ');
                      
                      return (
                        <>
                          {/* Gradient under line */}
                          <path
                            d={`${pathD} L ${points[points.length-1].x} 95 L ${points[0].x} 95 Z`}
                            fill="url(#mood-grad)"
                            opacity="0.1"
                          />
                          <defs>
                            <linearGradient id="mood-grad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#10b981" />
                              <stop offset="100%" stopColor="#ef4444" />
                            </linearGradient>
                          </defs>

                          {/* Line */}
                          <motion.path
                            d={pathD}
                            fill="none"
                            stroke="#10b981"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 1 }}
                          />

                          {/* Dots */}
                          {points.map((p, idx) => (
                            <circle
                              key={idx}
                              cx={p.x}
                              cy={p.y}
                              r="3.5"
                              fill="#10b981"
                              stroke="#ffffff"
                              strokeWidth="1.5"
                            />
                          ))}
                        </>
                      );
                    })()}
                  </svg>
                </div>
                {/* X Axis dates */}
                <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono mt-1.5 px-0.5">
                  {(() => {
                    const trendLogs = [...logs].reverse().slice(-7);
                    if (trendLogs.length === 0) return <span>No data</span>;
                    return (
                      <>
                        <span>{new Date(trendLogs[0].dateTime).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                        {trendLogs.length > 2 && <span>History Trend</span>}
                        <span>{new Date(trendLogs[trendLogs.length - 1].dateTime).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Classic History logs list */}
              <div className="space-y-2 max-h-[174px] overflow-y-auto pr-1">
                {logs.map((log) => {
                  const def = MOODS_DEFS.find(m => m.score === log.score) || MOODS_DEFS[2];
                  return (
                    <div id={`mood-row-${log.id}`} key={log.id} className="p-3 border border-slate-50 bg-slate-50/20 hover:bg-slate-50/50 rounded-xl flex items-start justify-between gap-3 transition-colors">
                      <div className="flex items-start gap-2.5">
                        <div className="text-2xl pt-0.5 shrink-0">{def.emoji}</div>
                        <div>
                          <span className={`font-semibold text-xs tracking-wide uppercase px-2 py-0.5 rounded-full ${def.activeBg} inline-block`}>
                            {def.label}
                          </span>
                          {log.notes && (
                            <p className="text-xs text-slate-600 mt-1 leading-relaxed bg-slate-50/60 p-2 rounded border border-slate-100 italic">
                              "{log.notes}"
                            </p>
                          )}
                          <span className="text-[10px] text-slate-400 font-mono block mt-1">
                            {new Date(log.dateTime).toLocaleDateString()} at {new Date(log.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>

                      <button
                        id={`delete-mood-log-${log.id}-btn`}
                        onClick={() => handleDeleteLog(log.id)}
                        className="p-1 text-slate-400 hover:text-red-650 hover:bg-red-50 rounded transition-all cursor-pointer shrink-0"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
