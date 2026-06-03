/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { PainCrisis } from '../types';
import { dbService } from '../dbService';
import { Activity, Plus, Trash2, Edit, ChevronDown, Calendar, AlertOctagon, Heart, Save, CheckSquare, Sparkles, Frown, ShieldAlert, ArrowLeft, X, MailOpen } from 'lucide-react';

interface PainTrackerProps {
  userId: string;
  showMessage: (text: string, type: 'success' | 'err') => void;
}

const COMMON_SYMPTOMS = [
  'Joint throbbing (legs/arms)',
  'Lower back spinal pain',
  'Chest pressure/pain',
  'Dactylitis (swollen fingers/toes)',
  'Severe abdominal discomfort',
  'Extreme lethargy / fatigue',
  'Shortness of breath',
  'Fever / Cold chills',
  'Yellowing of eyes / Jaundice'
];

const COMMON_TRIGGERS = [
  'Sudden temperature drop (Cold wind/drafts)',
  'Severe cellular dehydration',
  'Peak academic or family stress',
  'Heavy physical exhaustion / Workout',
  'Developing respiratory infection / Malaria',
  'Poor sleep patterns / Insufficient rest',
  'High altitude flight or mountain travel'
];

export default function PainTracker({ userId, showMessage }: PainTrackerProps) {
  const [loading, setLoading] = useState<boolean>(true);
  const [crises, setCrises] = useState<PainCrisis[]>([]);
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | undefined>(undefined);

  // Form Fields
  const [painScore, setPainScore] = useState<number>(5);
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [triggerFactors, setTriggerFactors] = useState<string[]>([]);
  const [dateTime, setDateTime] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const loadCrises = async () => {
    try {
      setLoading(true);
      const data = await dbService.getPainCrises(userId);
      setCrises(data);
    } catch (err: any) {
      console.error(err);
      showMessage('Unable to fetch pain logs history.', 'err');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCrises();
  }, [userId]);

  const handleOpenCreateForm = () => {
    setEditingId(undefined);
    setPainScore(5);
    setSymptoms([]);
    setTriggerFactors([]);
    
    // Default to current date and time formatted locally for standard datetime-local
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    setDateTime(`${year}-${month}-${day}T${hours}:${minutes}`);

    setNotes('');
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (cr: PainCrisis) => {
    setEditingId(cr.id);
    setPainScore(cr.painScore);
    setSymptoms(cr.symptoms || []);
    setTriggerFactors(cr.triggerFactors || []);
    
    // Format timestamp from ISO to datetime-local local string format
    if (cr.dateTime) {
      const dt = new Date(cr.dateTime);
      const year = dt.getFullYear();
      const month = String(dt.getMonth() + 1).padStart(2, '0');
      const day = String(dt.getDate()).padStart(2, '0');
      const hours = String(dt.getHours()).padStart(2, '0');
      const minutes = String(dt.getMinutes()).padStart(2, '0');
      setDateTime(`${year}-${month}-${day}T${hours}:${minutes}`);
    } else {
      setDateTime('');
    }

    setNotes(cr.notes || '');
    setIsFormOpen(true);
  };

  const handleSaveCrisis = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dateTime) {
      showMessage('We need the date of when this pain event was logged.', 'err');
      return;
    }

    try {
      const payload: Omit<PainCrisis, 'id'> = {
        userId,
        painScore,
        symptoms,
        triggerFactors,
        dateTime: new Date(dateTime).toISOString(),
        notes: notes.trim()
      };

      await dbService.savePainCrisis(payload, editingId);
      showMessage(
        editingId ? 'Pain crisis log adjusted.' : 'Sickle cell pain crisis logged successfully.',
        'success'
      );
      setIsFormOpen(false);
      loadCrises();
    } catch (err: any) {
      console.error(err);
      showMessage('Could not submit pain tracker log details.', 'err');
    }
  };

  const handleDeleteCrisis = async (id: string) => {
    if (!window.confirm('Delete this historical pain log entry permanently?')) {
      return;
    }

    try {
      await dbService.deletePainCrisis(id);
      showMessage('Pain crisis entry removed.', 'success');
      loadCrises();
    } catch (err: any) {
      console.error(err);
      showMessage('Could not delete pain log.', 'err');
    }
  };

  const handleCheckboxToggle = (list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>, val: string) => {
    if (list.includes(val)) {
      setList(list.filter(x => x !== val));
    } else {
      setList([...list, val]);
    }
  };

  // UI styling of the sliding indicators
  const getPainColorClass = (score: number) => {
    if (score <= 3) return { bg: 'bg-green-100 border-green-200 text-green-800', range: 'accent-green-500', pill: 'bg-green-600' };
    if (score <= 6) return { bg: 'bg-amber-100 border-amber-200 text-amber-800', range: 'accent-amber-500', pill: 'bg-amber-500' };
    if (score <= 8) return { bg: 'bg-orange-100 border-orange-200 text-orange-800', range: 'accent-orange-500', pill: 'bg-orange-600' };
    return { bg: 'bg-red-100 border-red-200 text-red-800 animate-pulse-subtle', range: 'accent-red-600', pill: 'bg-red-600' };
  };

  const getSeverityLabel = (score: number) => {
    if (score <= 3) return 'Mild Ache - Fully tolerable';
    if (score <= 6) return 'Moderate Distress - Throbbing, hampers routine';
    if (score <= 8) return 'Severe Crisis - Extremely intense pain, rehydration recommended';
    return 'CRITICAL EMERGENCY - Seek emergency hematology infusion immediately!';
  };

  // Date Formatting
  const formatFriendlyDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return isoString;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-16">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Calculate statistics for dynamic dashboard rendering
  const totalLogs = crises.length;
  const avgPain = totalLogs > 0 ? (crises.reduce((sum, c) => sum + c.painScore, 0) / totalLogs).toFixed(1) : '0';
  const highCrises = crises.filter(c => c.painScore >= 7).length;

  return (
    <div className="space-y-6">
      
      {!isFormOpen ? (
        <div className="space-y-4">
          
          {/* Main pain diagnostic banner */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
            <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400">Recorded Crises</span>
              <span className="text-2xl font-black text-slate-800 block mt-1">{totalLogs} Entries</span>
            </div>
            <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400">Average Pain Level</span>
              <span className="text-2xl font-black text-slate-800 block mt-1">{avgPain} / 10</span>
            </div>
            <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm text-center col-span-2 sm:col-span-1">
              <span className="text-[10px] uppercase font-bold text-slate-400">Severe crises (&gt;=7)</span>
              <span className="text-2xl font-black text-accent-crimson block mt-1">{highCrises} Events</span>
            </div>
          </div>

          <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Crisis Logging Diary</h3>
              <p className="text-xs text-slate-500 mt-0.5">Log pain and isolate key triggers like sudden cold or extreme dehydration.</p>
            </div>
            <button
              onClick={handleOpenCreateForm}
              className="py-1.5 px-3 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-brand-500/15"
              id="log-new-pain-btn"
            >
              <Plus className="w-4 h-4" />
              Log Pain Event
            </button>
          </div>

          {/* List pain history */}
          {crises.length > 0 ? (
            <div className="space-y-4">
              {crises.map((cr) => {
                const colors = getPainColorClass(cr.painScore);
                const label = getSeverityLabel(cr.painScore);

                return (
                  <div key={cr.id} className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition">
                    
                    {/* Header: Score and editing tools */}
                    <div className="flex justify-between items-start gap-2 border-b border-slate-50 pb-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-11 h-11 rounded-2xl flex flex-col items-center justify-center font-black text-lg ${colors.bg} border shrink-0`}>
                          <span>{cr.painScore}</span>
                          <span className="text-[8px] uppercase tracking-wider font-bold">Pain</span>
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-800">{formatFriendlyDate(cr.dateTime)}</h4>
                          <span className="text-[10px] text-slate-500 font-medium block mt-0.5">{label}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 text-slate-400">
                        <button
                          onClick={() => handleOpenEditForm(cr)}
                          className="p-1.5 hover:text-brand-500 hover:bg-slate-50 rounded-lg transition"
                          title="Edit Log"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteCrisis(cr.id)}
                          className="p-1.5 hover:text-accent-crimson hover:bg-slate-50 rounded-lg transition"
                          title="Delete Log"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Crisis descriptors */}
                    <div className="space-y-2.5 text-xs text-slate-600 pt-1">
                      {cr.symptoms && cr.symptoms.length > 0 && (
                        <div>
                          <strong className="text-slate-400 font-bold text-[9px] uppercase block mb-1">Triggered Symptoms</strong>
                          <div className="flex flex-wrap gap-1.5">
                            {cr.symptoms.map((s, idx) => (
                              <span key={idx} className="bg-slate-100 text-slate-800 p-1 px-2 rounded-lg text-[10px] font-medium border border-slate-200/55">
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {cr.triggerFactors && cr.triggerFactors.length > 0 && (
                        <div>
                          <strong className="text-slate-400 font-bold text-[9px] uppercase block mb-1">Trigger Factors Isolated</strong>
                          <div className="flex flex-wrap gap-1.5">
                            {cr.triggerFactors.map((t, idx) => (
                              <span key={idx} className="bg-amber-50 text-amber-900 border border-amber-100 p-1 px-2 rounded-lg text-[10px] font-medium">
                                {t}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {cr.notes && (
                        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 mt-2.5">
                          <strong className="text-slate-400 font-bold text-[9px] uppercase block mb-1">Personal Diary Notes / Measures Taken</strong>
                          <p className="normal-case italic leading-relaxed text-slate-600 font-medium text-[11px]">{cr.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-slate-50 rounded-3xl p-8 text-center border-2 border-dashed border-slate-200">
              <p className="text-slate-500 font-medium text-sm">No historical crisis logs loaded yet.</p>
              <button
                type="button"
                onClick={handleOpenCreateForm}
                className="mt-4 py-2 px-4 bg-brand-600 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                Log Pain Score
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
              History
            </button>
            <h3 className="text-base font-bold text-slate-800 shrink-0">
              {editingId ? 'Edit Crisis Entry' : 'Log Sudden Pain Level'}
            </h3>
            <button
              onClick={() => setIsFormOpen(false)}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-50 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSaveCrisis} className="space-y-5">
            
            {/* Slider visual element */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 text-center">
              <label htmlFor="pain-score-range" className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1">Assessed Pain Severity Score</label>
              
              <div className="flex justify-center items-center gap-2 text-3xl font-black mt-2 text-slate-900">
                <span className={`px-4 py-2 rounded-2xl border font-mono ${getPainColorClass(painScore).bg}`}>
                  {painScore} / 10
                </span>
              </div>
              
              <p className="text-xs text-slate-500 font-semibold mt-2 min-h-8">
                {getSeverityLabel(painScore)}
              </p>

              <div className="mt-4 px-2">
                <input
                  id="pain-score-range"
                  type="range"
                  min="1"
                  max="10"
                  step="1"
                  value={painScore}
                  onChange={(e) => setPainScore(parseInt(e.target.value))}
                  className={`w-full h-2.5 rounded-lg appearance-none bg-slate-200 cursor-pointer ${getPainColorClass(painScore).range}`}
                />
                <div className="flex justify-between text-[11px] text-slate-400 font-bold px-1 mt-1 font-mono">
                  <span>1 (Mild)</span>
                  <span>5 (Moderate)</span>
                  <span>10 (Severe)</span>
                </div>
              </div>
            </div>

            {/* Emergency trigger message banner in pain slider screen */}
            {painScore >= 8 && (
              <div className="bg-red-50 border border-red-200 text-red-950 p-4 rounded-2xl animate-pulse-subtle text-xs flex gap-3">
                <ShieldAlert className="w-6 h-6 text-accent-crimson shrink-0" />
                <div>
                  <strong className="text-accent-crimson block font-bold mb-0.5">VASE-OCCLUSIVE EMERGENCY PROTOCOL</strong>
                  Pain scores above 7 require extreme cell emergency support. Rehydrate intensely immediately, contact your primary hematologist caregiver, retrieve your Medical Passport, and prepare travel to emergency medical specialized units immediately.
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label htmlFor="pain-input-date" className="block text-xs font-semibold text-slate-700">Date and Time of Onset</label>
              <input
                id="pain-input-date"
                type="datetime-local"
                required
                value={dateTime}
                onChange={(e) => setDateTime(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition font-mono"
              />
            </div>

            {/* Checkboxes Symptoms selection */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
              <span className="block text-xs font-bold text-slate-700 mb-2">Identify Symptoms Experienced:</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {COMMON_SYMPTOMS.map((sym, idx) => (
                  <label key={idx} className="flex items-center gap-2 bg-white p-2 border border-slate-200/60 rounded-xl cursor-pointer">
                    <input
                      type="checkbox"
                      checked={symptoms.includes(sym)}
                      onChange={() => handleCheckboxToggle(symptoms, setSymptoms, sym)}
                      className="w-4 h-4 text-brand-500 focus:ring-brand-500 rounded border-slate-300"
                    />
                    <span>{sym}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Checkboxes Triggers selection */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
              <span className="block text-xs font-bold text-slate-700 mb-2">Identify Isolate Trigger Factors:</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {COMMON_TRIGGERS.map((trig, idx) => (
                  <label key={idx} className="flex items-center gap-2 bg-white p-2 border border-slate-200/60 rounded-xl cursor-pointer">
                    <input
                      type="checkbox"
                      checked={triggerFactors.includes(trig)}
                      onChange={() => handleCheckboxToggle(triggerFactors, setTriggerFactors, trig)}
                      className="w-4 h-4 text-brand-500 focus:ring-brand-500 rounded border-slate-300"
                    />
                    <span>{trig}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <label htmlFor="pain-input-notes" className="block text-xs font-semibold text-slate-700">Measures and mitigations taken (e.g. warm fluids, oral analgesics)</label>
              <textarea
                id="pain-input-notes"
                rows={3}
                placeholder="Describe your current status, medication ingested (e.g., drank 1.5L water, took paracetamol capsule, holding deep heat warms packs)..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm rounded-xl transition flex items-center justify-center gap-1 cursor-pointer shadow-md shadow-brand-500/10"
            >
              <Save className="w-4 h-4" />
              Save Pain Diary Log
            </button>

          </form>
        </div>
      )}

    </div>
  );
}
