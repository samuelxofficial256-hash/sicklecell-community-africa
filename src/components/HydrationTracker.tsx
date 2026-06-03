import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Droplet, Plus, ArrowLeft, RefreshCw, Trash2, Bell, Check, Sparkles } from 'lucide-react';
import { dbService } from '../dbService';
import { HydrationLog } from '../types';

interface HydrationTrackerProps {
  userId: string;
  onBack?: () => void;
}

export const HydrationTracker: React.FC<HydrationTrackerProps> = ({ userId, onBack }) => {
  const [logs, setLogs] = useState<HydrationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [amountMl, setAmountMl] = useState<number>(250);
  const [goalMl, setGoalMl] = useState<number>(3500); // 3.5L standard for Sickle Cell
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [editGoalValue, setEditGoalValue] = useState('3500');
  const [remindersEnabled, setRemindersEnabled] = useState(true);
  const [reminderIntervalHours, setReminderIntervalHours] = useState(2);
  const [showNotificationPopup, setShowNotificationPopup] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await dbService.getHydrationLogs(userId);
      setLogs(data);
      if (data.length > 0) {
        setGoalMl(data[0].goalMl);
        setEditGoalValue(data[0].goalMl.toString());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [userId]);

  // Handle reminder triggers
  useEffect(() => {
    if (!remindersEnabled) return;

    const interval = setInterval(() => {
      const messages = [
        "Time for a glass of water! Keeping hydrated helps prevent sickle cell vessel friction.",
        "Hydration reminder: Sip some water now to keep your blood flowing smoothly.",
        "Did you drink water in the last hour? Drink up for your wellness!",
        "Stay ahead of crises! A cup of pure water right now can help protect your body."
      ];
      const randomMsg = messages[Math.floor(Math.random() * messages.length)];
      setNotificationMessage(randomMsg);
      setShowNotificationPopup(true);

      // Play a soft bubble click sound if supported
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.15);
      } catch (err) {}
    }, reminderIntervalHours * 3600 * 1000);

    return () => clearInterval(interval);
  }, [remindersEnabled, reminderIntervalHours]);

  const handleAddWater = async (amount: number) => {
    try {
      const newLog = await dbService.saveHydrationLog({
        userId,
        amountMl: amount,
        goalMl,
        dateTime: new Date().toISOString()
      });
      setLogs(prev => [newLog, ...prev]);

      // Simple prompt validation/success feedback
      setNotificationMessage(`Successfully logged ${amount}mL of water. Keep it up!`);
      setShowNotificationPopup(true);
      setTimeout(() => setShowNotificationPopup(false), 3000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteLog = async (id: string) => {
    try {
      await dbService.deleteHydrationLog(id);
      setLogs(prev => prev.filter(l => l.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveGoal = async () => {
    const val = parseInt(editGoalValue);
    if (!isNaN(val) && val > 0) {
      setGoalMl(val);
      setIsEditingGoal(false);
      // Update goal on the newest entries or just save a new tracker log of 0ml to capture new goal
      try {
        await dbService.saveHydrationLog({
          userId,
          amountMl: 0,
          goalMl: val,
          dateTime: new Date().toISOString()
        });
      } catch (err) {}
    }
  };

  // Get total for today
  const getTodayTotal = () => {
    const today = new Date().toDateString();
    return logs
      .filter(l => new Date(l.dateTime).toDateString() === today)
      .reduce((sum, l) => sum + l.amountMl, 0);
  };

  const todayTotal = getTodayTotal();
  const percentage = Math.min(100, Math.round((todayTotal / goalMl) * 100));

  return (
    <div id="hydration-tracker-view" className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-2">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              id="back-from-hydration-btn"
              onClick={onBack}
              className="p-2 text-slate-600 hover:text-slate-900 transition-colors rounded-lg bg-slate-100"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          <div>
            <h2 className="text-2xl font-semibold text-slate-900 tracking-tight">Hydration Hub</h2>
            <p className="text-sm text-slate-500">Essential fluid management for sickle cell care</p>
          </div>
        </div>

        <button
          id="refresh-hydration-btn"
          onClick={fetchLogs}
          className="p-2 text-slate-500 hover:text-teal-600 transition-colors"
          title="Sync with cloud"
        >
          <RefreshCw className="h-5 w-5" />
        </button>
      </div>

      {/* Floating reminder notifications test card */}
      <AnimatePresence>
        {showNotificationPopup && (
          <motion.div
            id="hydration-alert-popup"
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="p-4 bg-teal-50 border border-teal-200 rounded-xl flex items-start gap-3 shadow-sm relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 h-24 w-24 bg-teal-100/30 rounded-full blur-xl -mr-6 -mt-6"></div>
            <div className="p-2 bg-teal-500 text-white rounded-lg shrink-0 mt-0.5 animate-pulse">
              <Bell className="h-5 w-5 hover:rotate-12 transition-transform" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-teal-900 flex items-center gap-1.5">
                Community Health Reminder <Sparkles className="h-3.5 w-3.5 text-teal-600" />
              </h4>
              <p className="text-xs text-teal-700 mt-0.5 leading-relaxed">{notificationMessage}</p>
            </div>
            <button
              id="close-hydration-alert-btn"
              onClick={() => setShowNotificationPopup(false)}
              className="text-teal-600 hover:text-teal-900 text-xs font-medium self-start px-2 py-1 rounded hover:bg-teal-100/50 transition-colors"
            >
              Dismiss
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Circle Progress Tracker */}
        <div id="hydration-gauge-card" className="md:col-span-12 lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-blue-50/20 to-transparent pointer-events-none"></div>

          <h3 className="text-slate-800 font-medium text-sm tracking-wide uppercase mb-6">Today's Goal</h3>

          {/* Liquid Ring SVG */}
          <div className="relative w-48 h-48 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="96"
                cy="96"
                r="80"
                className="text-slate-100"
                strokeWidth="12"
                stroke="currentColor"
                fill="transparent"
              />
              <motion.circle
                cx="96"
                cy="96"
                r="80"
                className="text-teal-500"
                strokeWidth="12"
                strokeDasharray={2 * Math.PI * 80}
                initial={{ strokeDashoffset: 2 * Math.PI * 80 }}
                animate={{ strokeDashoffset: (2 * Math.PI * 80) * (1 - percentage / 100) }}
                transition={{ duration: 1, ease: "easeOut" }}
                strokeLinecap="round"
                stroke="currentColor"
                fill="transparent"
              />
            </svg>

            {/* Content inside circle */}
            <div className="absolute flex flex-col items-center justify-center">
              <Droplet className={`h-10 w-10 text-teal-500 ${percentage >= 100 ? 'animate-bounce' : 'animate-pulse'}`} />
              <div id="today-hydration-progress" className="text-3xl font-bold text-slate-800 mt-2">{todayTotal}</div>
              <div className="text-xs text-slate-400 font-medium mt-0.5">/ {goalMl} mL</div>
              <div className="mt-2 bg-teal-100/60 text-teal-800 text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full">
                {percentage}% Done
              </div>
            </div>
          </div>

          {/* Goal Editor */}
          <div className="mt-6 w-full max-w-[200px]">
            {isEditingGoal ? (
              <div className="flex gap-2">
                <input
                  id="edit-hydration-goal-input"
                  type="number"
                  value={editGoalValue}
                  onChange={(e) => setEditGoalValue(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm text-center focus:ring-1 focus:ring-teal-500 focus:outline-none"
                  placeholder="Target mL"
                />
                <button
                  id="confirm-edit-hydration-goal-btn"
                  onClick={handleSaveGoal}
                  className="p-1.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                >
                  <Check className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                id="edit-hydration-goal-toggle"
                onClick={() => setIsEditingGoal(true)}
                className="text-xs text-slate-500 hover:text-teal-600 transition-colors inline-flex items-center gap-1 mx-auto font-medium"
              >
                Change Target Goal
              </button>
            )}
          </div>
        </div>

        {/* Incremental Add Buttons & Reminders Config */}
        <div id="hydration-actions-card" className="md:col-span-12 lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
          <div className="space-y-2">
            <h3 className="font-semibold text-slate-900">Quick Record Fluid Intake</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Consistently sip fluids. Drinking 3.5L to 4L of water is highly vital for patients to combat sickling. Let's record your drinks!
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { amount: 250, label: 'Cup', icon: '🥛', desc: 'Standard cup (250mL)' },
              { amount: 500, label: 'Bottle', icon: '🥤', desc: 'Small bottle (500mL)' },
              { amount: 750, label: 'Flask', icon: '🍶', desc: 'Active flask (750mL)' },
              { amount: 1000, label: 'Jug', icon: '🫙', desc: 'Full hydro jug (1L)' }
            ].map((preset, index) => (
              <button
                id={`add-water-preset-${preset.amount}-btn`}
                key={index}
                onClick={() => handleAddWater(preset.amount)}
                className="group p-4 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-teal-50 hover:border-teal-200 transition-all text-center flex flex-col items-center justify-center gap-1 cursor-pointer"
              >
                <div className="text-2xl group-hover:scale-110 transition-transform duration-300">{preset.icon}</div>
                <div className="font-semibold text-slate-800 text-sm mt-1">{preset.label}</div>
                <div className="text-[10px] text-slate-400 font-medium font-mono">+{preset.amount} mL</div>
              </button>
            ))}
          </div>

          {/* Custom entry */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-4">
            <div className="flex-1">
              <label className="text-xs font-semibold text-slate-600 block mb-1">Custom Amount (mL)</label>
              <div className="flex gap-2">
                <input
                  id="custom-water-ml-input"
                  type="number"
                  value={amountMl}
                  onChange={(e) => setAmountMl(Math.max(1, parseInt(e.target.value) || 0))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 focus:ring-1 focus:ring-teal-500 focus:outline-none"
                  min="1"
                />
                <button
                  id="add-custom-water-btn"
                  onClick={() => handleAddWater(amountMl)}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg flex items-center gap-1.5 font-medium text-sm shadow-sm hover:shadow transition-all"
                >
                  <Plus className="h-4 w-4" /> Add
                </button>
              </div>
            </div>
          </div>

          {/* Interactive reminders setup */}
          <div className="p-4 bg-slate-50 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-teal-600" />
                <span className="text-xs font-semibold text-slate-800">In-App Hydration Reminders</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  id="hydration-reminders-toggle"
                  type="checkbox"
                  checked={remindersEnabled}
                  onChange={(e) => setRemindersEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-500"></div>
              </label>
            </div>

            {remindersEnabled && (
              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/50">
                <span className="text-slate-500">Alert Frequency</span>
                <select
                  id="hydration-frequency-select"
                  value={reminderIntervalHours}
                  onChange={(e) => setReminderIntervalHours(Number(e.target.value))}
                  className="bg-white border border-slate-200 px-2 py-1 rounded text-slate-700 outline-none"
                >
                  <option value={1}>Every Hour</option>
                  <option value={2}>Every 2 Hours</option>
                  <option value={3}>Every 3 Hours</option>
                  <option value={4}>Every 4 Hours</option>
                </select>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dynamic Log History Section */}
      <div id="hydration-history-card" className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <h3 className="font-semibold text-slate-800">Hydration Logs</h3>

        {loading ? (
          <div className="py-8 text-center text-xs text-slate-400">Loading hydration records...</div>
        ) : logs.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">No hydration logs recorded yet. Start drinking water!</div>
        ) : (
          <div className="max-h-60 overflow-y-auto space-y-2 pr-1 divide-y divide-slate-100">
            {logs.map((log) => (
              <div id={`hydration-row-${log.id}`} key={log.id} className="flex items-center justify-between py-2 ml-1">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-sky-50 rounded-lg text-sky-500 shrink-0">
                    <Droplet className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="font-semibold text-slate-800 text-sm">{log.amountMl ? `${log.amountMl} mL` : `Target changed`}</span>
                    <span className="text-[10px] text-slate-400 block font-mono">
                      {new Date(log.dateTime).toLocaleDateString()} at {new Date(log.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                <button
                  id={`delete-hydration-log-${log.id}-btn`}
                  onClick={() => handleDeleteLog(log.id)}
                  className="p-1.5 text-slate-400 hover:text-red-650 rounded-lg opacity-0.5 hover:opacity-1 hover:bg-red-50 transition-all cursor-pointer"
                  title="Delete log"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
