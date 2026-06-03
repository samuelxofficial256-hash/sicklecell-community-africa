/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Medication } from '../types';
import { dbService } from '../dbService';
import { Pill, Plus, Trash2, Edit, CheckCircle, ArrowLeft, X, Save, Clock, AlertCircle, Calendar, CheckSquare, Bell, BellRing, BellOff, Sparkles } from 'lucide-react';

interface MedicationTrackerProps {
  userId: string;
  showMessage: (text: string, type: 'success' | 'err') => void;
}

export default function MedicationTracker({ userId, showMessage }: MedicationTrackerProps) {
  const [loading, setLoading] = useState<boolean>(true);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | undefined>(undefined);

  // Form Fields
  const [name, setName] = useState<string>('');
  const [dosage, setDosage] = useState<string>('');
  const [frequency, setFrequency] = useState<string>('Once daily');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [remTime, setRemTime] = useState<string>('08:00');
  const [reminders, setReminders] = useState<string[]>([]);

  // Daily Tick adherence logs stored offline for instant interactive feedback
  const [todayTicks, setTodayTicks] = useState<Record<string, boolean>>({});

  // Browser Push alarm specific properties
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );
  const [swActive, setSwActive] = useState<boolean>(false);
  const [remindersEnabled, setRemindersEnabled] = useState<boolean>(true);
  const [triggeredReminders, setTriggeredReminders] = useState<Record<string, boolean>>({});

  // Detect Service Worker registration status
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        setSwActive(!!reg.active);
      }).catch((e) => {
        console.error('Service worker ready check failed:', e);
      });
    }

    // Load user configuration preferences from localStorage
    const saved = localStorage.getItem(`scca_med_reminders_enabled_${userId}`);
    if (saved !== null) {
      setRemindersEnabled(JSON.parse(saved));
    }

    // Cache triggered keys
    try {
      const today = getLocalDateKey();
      const raw = localStorage.getItem(`scca_triggered_alarms_${userId}_${today}`);
      if (raw) {
        setTriggeredReminders(JSON.parse(raw));
      }
    } catch (e) {
      console.error(e);
    }
  }, [userId]);

  // Sync state variables across to the Service Worker controller
  useEffect(() => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'SYNC_MEDS',
        medications: medications
      });
    }
  }, [medications]);

  const todayTicksString = JSON.stringify(todayTicks);
  const medicationsString = JSON.stringify(medications);

  // Background reminder monitor loop
  useEffect(() => {
    if (permissionStatus !== 'granted' || !remindersEnabled || medications.length === 0) return;

    const checkScheduledAlarms = () => {
      const now = new Date();
      const currentRawHour = String(now.getHours()).padStart(2, '0');
      const currentRawMin = String(now.getMinutes()).padStart(2, '0');
      const curTime = `${currentRawHour}:${currentRawMin}`;
      const dateKey = getLocalDateKey();

      medications.forEach((med) => {
        // Enforce timeline checks
        if (med.startDate && med.endDate) {
          if (dateKey < med.startDate || dateKey > med.endDate) {
            return;
          }
        }

        // Only alert if is NOT taken today
        const isTakenToday = !!todayTicks[med.id];
        if (isTakenToday) return;

        // Alarm checking
        const alarmsList = med.reminders || [];
        alarmsList.forEach((alarmTime) => {
          if (alarmTime === curTime) {
            const triggerKey = `${med.id}_${alarmTime}_${dateKey}`;
            
            if (!triggeredReminders[triggerKey]) {
              const titleForAlert = `SCCA Reminder: Take ${med.name}`;
              const bodyForAlert = `Time for your scheduled dose: ${med.dosage}. Click to update your checklist.`;

              // Check if browser Service worker registration can execute notification
              if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
                navigator.serviceWorker.ready.then((reg) => {
                  reg.showNotification(titleForAlert, {
                    body: bodyForAlert,
                    tag: `scca-reminder-${med.id}-${alarmTime}`,
                    icon: '/assets/app-logo.png',
                    data: { url: '/' }
                  });
                });
              } else {
                try {
                  const nativeNotification = new Notification(titleForAlert, {
                    body: bodyForAlert,
                    icon: '/assets/app-logo.png'
                  });
                  nativeNotification.onclick = () => {
                    window.focus();
                  };
                } catch (e) {
                  console.error('Core Notification initialization fallback:', e);
                }
              }

              // Update state & persist logs
              const updatedTriggered = {
                ...triggeredReminders,
                [triggerKey]: true
              };
              setTriggeredReminders(updatedTriggered);
              localStorage.setItem(`scca_triggered_alarms_${userId}_${dateKey}`, JSON.stringify(updatedTriggered));
              showMessage(`REMINDER TRIGGERED: Time for ${med.name}!`, 'success');
            }
          }
        });
      });
    };

    checkScheduledAlarms();
    const intervalRef = setInterval(checkScheduledAlarms, 35000);

    return () => clearInterval(intervalRef);
  }, [userId, permissionStatus, remindersEnabled, todayTicksString, medicationsString, triggeredReminders]);

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      showMessage('This browser does not support HTML Push notifications.', 'err');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setPermissionStatus(permission);
      if (permission === 'granted') {
        showMessage('Alert notifications active! You will now receive reminders.', 'success');
        
        new Notification('SCCA Reminders Connected!', {
          body: 'System notification alerts are successfully activated. Stay healthy & hydrated!',
          icon: '/assets/app-logo.png'
        });
      } else if (permission === 'denied') {
        showMessage('Permission blocked. Open browser settings to authorize reminders.', 'err');
      }
    } catch (e) {
      console.error(e);
      showMessage('Failed to request notifications permission.', 'err');
    }
  };

  const triggerSampleTestNotification = () => {
    if (permissionStatus !== 'granted') {
      showMessage('Please grant notification permission first.', 'err');
      return;
    }

    showMessage('Simulating background reminder! Switch tabs or minimize app... Arriving in 5s.', 'success');

    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'SCHEDULE_TEST',
        delayMs: 5000,
        title: 'SCCA Supp Alert (Test Run)',
        body: 'Time to take your scheduled capsules or drink water!'
      });
    } else {
      setTimeout(() => {
        new Notification('SCCA Supp Alert (Test Run Fallback)', {
          body: 'Time to take your scheduled capsules or drink water!',
          icon: '/assets/app-logo.png'
        });
      }, 5000);
    }
  };

  const getLocalDateKey = () => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  };

  const loadMedications = async () => {
    try {
      setLoading(true);
      const data = await dbService.getMedications(userId);
      setMedications(data);

      // Load ticks for today
      try {
        const dateKey = getLocalDateKey();
        const rawTicks = localStorage.getItem(`scca_ticks_${userId}_${dateKey}`);
        if (rawTicks) {
          setTodayTicks(JSON.parse(rawTicks));
        } else {
          setTodayTicks({});
        }
      } catch (e) {
        console.error(e);
      }
    } catch (err: any) {
      console.error(err);
      showMessage('Could not retrieve medication lists.', 'err');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMedications();
  }, [userId]);

  const handleToggleTick = (medId: string) => {
    const dateKey = getLocalDateKey();
    const updated = {
      ...todayTicks,
      [medId]: !todayTicks[medId]
    };
    setTodayTicks(updated);
    try {
      localStorage.setItem(`scca_ticks_${userId}_${dateKey}`, JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
    
    if (updated[medId]) {
      showMessage('Warm advice: Great job sticking to your therapeutic regimen today!', 'success');
    } else {
      showMessage('Supplement tick removed.', 'success');
    }
  };

  const handleOpenCreateForm = () => {
    setEditingId(undefined);
    setName('');
    setDosage('');
    setFrequency('Once daily');
    
    const today = new Date();
    const startStr = today.toISOString().split('T')[0];
    setStartDate(startStr);
    
    // Set default end date in 1 year
    const nextYear = new Date();
    nextYear.setFullYear(today.getFullYear() + 1);
    setEndDate(nextYear.toISOString().split('T')[0]);

    setRemTime('08:00');
    setReminders(['08:00']);
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (med: Medication) => {
    setEditingId(med.id);
    setName(med.name);
    setDosage(med.dosage);
    setFrequency(med.frequency);
    setStartDate(med.startDate);
    setEndDate(med.endDate);
    setRemTime('08:00');
    setReminders(med.reminders || []);
    setIsFormOpen(true);
  };

  const handleSaveMed = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showMessage('Medication Name is required.', 'err');
      return;
    }
    if (!dosage.trim()) {
      showMessage('Medication dosage is required.', 'err');
      return;
    }

    try {
      const payload: Omit<Medication, 'id'> = {
        userId,
        name: name.trim(),
        dosage: dosage.trim(),
        frequency: frequency.trim(),
        startDate,
        endDate,
        reminders
      };

      await dbService.saveMedication(payload, editingId);
      showMessage(
        editingId ? 'Regimen profile updated.' : 'Daily medication supplement added!',
        'success'
      );
      setIsFormOpen(false);
      loadMedications();
    } catch (err: any) {
      console.error(err);
      showMessage('Could not book medication supplement.', 'err');
    }
  };

  const handleDeleteMed = async (id: string, medName: string) => {
    if (!window.confirm(`Stop and terminate prescription for ${medName}?`)) {
      return;
    }

    try {
      await dbService.deleteMedication(id);
      showMessage(`PRESCRIPTION CEASED: Removed ${medName}.`, 'success');
      loadMedications();
    } catch (err: any) {
      console.error(err);
      showMessage('Could not terminate drug profile.', 'err');
    }
  };

  const handleAddReminder = () => {
    if (!remTime) return;
    if (reminders.includes(remTime)) {
      showMessage('Alarm already declared for this time slot.', 'err');
      return;
    }
    setReminders([...reminders, remTime].sort());
  };

  const handleRemoveReminder = (time: string) => {
    setReminders(reminders.filter(r => r !== time));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-16">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {!isFormOpen ? (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Prescription Adherence Tracker</h3>
              <p className="text-xs text-slate-500 mt-0.5">Hydration schedules, Folic protective capsules, and Hydroxyurea logs.</p>
            </div>
            <button
              onClick={handleOpenCreateForm}
              className="py-1.5 px-3 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-brand-500/15"
              id="add-medication-btn"
            >
              <Plus className="w-4 h-4" />
              Add Regimen
            </button>
          </div>

          {/* BROWSER REMINDER NOTIFICATIONS CONTROLLER PANEL */}
          <div className="bg-gradient-to-r from-slate-900 to-slate-950 text-slate-100 rounded-3xl p-5 border border-slate-800 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-5">
            <div className="space-y-1.5">
              <span className="text-[9px] bg-indigo-500/20 text-indigo-300 font-mono font-bold px-2.5 py-0.5 rounded-full inline-block uppercase tracking-wider">
                Automated Reminders Setup
              </span>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Bell className="w-4.5 h-4.5 text-emerald-400 shrink-0" />
                Browser Medication Push Reminders
              </h4>
              <p className="text-[11px] text-slate-400 max-w-xl leading-relaxed">
                Connect your device browser's background Notification module to trigger system alerts even when the browser is minimized, closed, or active in another workflow.
              </p>
              
              {/* Dynamic Badges Grid */}
              <div className="flex flex-wrap gap-2 pt-1 font-mono text-[9px] font-bold">
                <span className={`px-2 py-0.5 rounded-md flex items-center gap-1 ${
                  permissionStatus === 'granted' 
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' 
                    : permissionStatus === 'denied' 
                    ? 'bg-red-500/15 text-red-400 border border-red-500/25' 
                    : 'bg-amber-500/15 text-amber-400 border border-amber-500/25'
                }`}>
                  PERMISSION: {permissionStatus.toUpperCase()}
                </span>
                
                <span className={`px-2 py-0.5 rounded-md flex items-center gap-1 ${
                  swActive 
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' 
                    : 'bg-slate-800 text-slate-400 border border-slate-700/80'
                }`}>
                  SERVICE WORKER: {swActive ? 'ACTIVE / LAUNCHED' : 'STANDBY'}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 w-full md:w-auto shrink-0">
              {permissionStatus !== 'granted' ? (
                <button
                  type="button"
                  onClick={requestNotificationPermission}
                  className="py-2 px-3.5 bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-brand-600/20"
                >
                  <BellRing className="w-3.5 h-3.5" />
                  Grant Alarm Authorisation
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      const updated = !remindersEnabled;
                      setRemindersEnabled(updated);
                      localStorage.setItem(`scca_med_reminders_enabled_${userId}`, JSON.stringify(updated));
                      showMessage(updated ? 'Adherence push reminders enabled.' : 'Adherence push reminders muted.', 'success');
                    }}
                    className={`py-2 px-3.5 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      remindersEnabled 
                        ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-350 border border-amber-500/20' 
                        : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-350 border border-emerald-500/20'
                    }`}
                  >
                    {remindersEnabled ? <BellOff className="w-3.5 h-3.5" /> : <Bell className="w-3.5 h-3.5" />}
                    {remindersEnabled ? 'Mute Alarms' : 'Unmute Alarms'}
                  </button>

                  <button
                    type="button"
                    onClick={triggerSampleTestNotification}
                    className="py-2 px-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-indigo-650/40"
                    title="Triggers an active test notification delayed by 5 seconds to let you experience background notification Delivery"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
                    Simulate Reminders Trigger (5s)
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Checklist header */}
          {medications.length > 0 && (
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-3xl p-5 border border-slate-100 shadow flex justify-between items-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
              <div>
                <h4 className="text-sm font-bold flex items-center gap-1.5">
                  <CheckSquare className="w-4 h-4" />
                  Today's Supplemental Checklist
                </h4>
                <p className="text-[11px] text-brand-50 bg-white/10 px-2 py-0.5 rounded-full mt-1.5 font-medium inline-block">
                  Completed {Object.values(todayTicks).filter(Boolean).length} of {medications.length} items
                </p>
              </div>
              <div className="text-center">
                <span className="text-[10px] uppercase font-bold text-slate-200 block">System Date</span>
                <span className="text-base font-black tracking-tight mt-0.5 block">{getLocalDateKey()}</span>
              </div>
            </div>
          )}

          {medications.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {medications.map((med) => {
                const isChecked = !!todayTicks[med.id];
                return (
                  <div key={med.id} className={`bg-white rounded-3xl p-5 border shadow-sm transition hover:shadow-md flex flex-col justify-between ${isChecked ? 'border-brand-500 bg-brand-50/10' : 'border-slate-100'}`}>
                    <div>
                      {/* Header row with Tick button */}
                      <div className="flex justify-between items-start gap-2 border-b border-slate-50 pb-3 mb-3">
                        <div className="flex items-start gap-3">
                          <button
                            onClick={() => handleToggleTick(med.id)}
                            className={`p-2 rounded-xl transition text-center shrink-0 flex items-center justify-center border ${isChecked ? 'bg-brand-600 border-brand-600 text-white hover:bg-brand-700' : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100'}`}
                            title={isChecked ? "Mark as not taken" : "Mark as taken today"}
                          >
                            <CheckCircle className="w-5 h-5 shrink-0" />
                          </button>
                          <div>
                            <h4 className={`text-sm font-bold leading-tight ${isChecked ? 'text-slate-800 line-through' : 'text-slate-900'}`}>{med.name}</h4>
                            <span className="text-[11px] font-semibold text-slate-600 block mt-1">
                              Dosage: <strong className="text-brand-600 font-bold">{med.dosage}</strong> • {med.frequency}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-slate-400 shrink-0">
                          <button
                            onClick={() => handleOpenEditForm(med)}
                            className="p-1.5 hover:text-brand-500 hover:bg-slate-50 rounded-lg transition"
                            title="Edit"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteMed(med.id, med.name)}
                            className="p-1.5 hover:text-accent-crimson hover:bg-slate-50 rounded-lg transition"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Details row */}
                      <div className="space-y-2 text-xs font-semibold text-slate-500 pt-1.5">
                        <p className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>Timeline:</span>
                          <span className="text-slate-800 font-bold font-mono">{med.startDate}</span>
                          <span className="text-slate-400 font-normal">to</span>
                          <span className="text-slate-800 font-bold font-mono">{med.endDate}</span>
                        </p>

                        {med.reminders && med.reminders.length > 0 && (
                          <div className="flex items-center gap-2 flex-wrap">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>Reminders Alarm:</span>
                            {med.reminders.map((time, idx) => (
                              <span key={idx} className="bg-slate-100 text-slate-700 font-mono text-[10px] font-bold px-2 py-0.5 rounded-lg flex items-center gap-1 border border-slate-200">
                                {time}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-slate-50 rounded-3xl p-8 text-center border-2 border-dashed border-slate-200">
              <p className="text-slate-500 font-medium text-sm">No medical regimens loaded yet.</p>
              <button
                type="button"
                onClick={handleOpenCreateForm}
                className="mt-4 py-2 px-4 bg-brand-600 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                Add Your Supplements
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-md">
          <div className="flex justify-between items-center mb-5">
            <button
              onClick={() => setIsFormOpen(false)}
              className="py-1 px-2.5 text-slate-500 hover:text-slate-800 text-xs font-bold flex items-center gap-1 rounded-lg hover:bg-slate-150 transition cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Prescription
            </button>
            <h3 className="text-base font-bold text-slate-800 shrink-0">
              {editingId ? 'Edit Regimen Profile' : 'Add Medication Regimen'}
            </h3>
            <button
              onClick={() => setIsFormOpen(false)}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-50 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSaveMed} className="space-y-4">
            
            <div className="space-y-1">
              <label htmlFor="med-input-name" className="block text-xs font-semibold text-slate-700">Medication Supplement Name (e.g. Hydroxyurea)</label>
              <input
                id="med-input-name"
                type="text"
                required
                placeholder="Hydroxyurea"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label htmlFor="med-input-dose" className="block text-xs font-semibold text-slate-700">Dosage strength (e.g. 500mg, 1 Capsule)</label>
                <input
                  id="med-input-dose"
                  type="text"
                  required
                  placeholder="e.g. 500 mg (1 capsule)"
                  value={dosage}
                  onChange={(e) => setDosage(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="med-input-freq" className="block text-xs font-semibold text-slate-700">Frequency (How often?)</label>
                <select
                  id="med-input-freq"
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition"
                >
                  <option value="Once daily">Once daily (highly regular)</option>
                  <option value="Twice daily">Twice daily (mornings & nights)</option>
                  <option value="Three times daily">Three times daily (meals)</option>
                  <option value="Every 8 hours">Every 8 hours</option>
                  <option value="Every 12 hours">Every 12 hours</option>
                  <option value="As needed (PRN)">As needed (PRN / Pain crisis crisis onset)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label htmlFor="med-input-start" className="block text-xs font-semibold text-slate-700">Prescription Start Date</label>
                <input
                  id="med-input-start"
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition font-mono"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="med-input-end" className="block text-xs font-semibold text-slate-700">Prescription Expected End Date</label>
                <input
                  id="med-input-end"
                  type="date"
                  required
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition font-mono"
                />
              </div>
            </div>

            {/* Custom Reminder times builder */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
              <label className="block text-xs font-semibold text-slate-700 mb-2">Set Adherence Alarms</label>
              
              <div className="flex gap-2.5 items-end mb-3">
                <div className="flex-1 space-y-1">
                  <label htmlFor="alarm-time-picker" className="block text-[10px] text-slate-500 uppercase font-bold">Alarm Time Slot</label>
                  <input
                    id="alarm-time-picker"
                    type="time"
                    value={remTime}
                    onChange={(e) => setRemTime(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddReminder}
                  className="py-2 px-3 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  Append Alarm
                </button>
              </div>

              {reminders.length > 0 ? (
                <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                  {reminders.map((time, idx) => (
                    <span key={idx} className="bg-white border border-slate-200 rounded-lg text-xs font-mono py-1 px-2.5 flex items-center gap-1.5 shadow-sm text-slate-700">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {time}
                      <button
                        type="button"
                        onClick={() => handleRemoveReminder(time)}
                        className="text-slate-400 hover:text-accent-crimson transition font-semibold"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-slate-400 italic">No reminder times marked yet. Adding reminders trigger daily cell alerts.</p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm rounded-xl transition flex items-center justify-center gap-1 cursor-pointer shadow-md shadow-brand-500/10"
            >
              <Save className="w-4 h-4" />
              Save Regimen Supplement
            </button>

          </form>
        </div>
      )}

    </div>
  );
}
