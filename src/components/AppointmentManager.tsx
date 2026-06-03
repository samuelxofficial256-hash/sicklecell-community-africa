/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Appointment, Doctor, Hospital } from '../types';
import { dbService } from '../dbService';
import { Calendar, Plus, Trash2, Edit, FileText, ArrowLeft, X, Save, Clock, MapPin, User, AlertCircle } from 'lucide-react';

interface AppointmentManagerProps {
  userId: string;
  showMessage: (text: string, type: 'success' | 'err') => void;
}

export default function AppointmentManager({ userId, showMessage }: AppointmentManagerProps) {
  const [loading, setLoading] = useState<boolean>(true);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | undefined>(undefined);

  // Form Fields
  const [dateTime, setDateTime] = useState<string>('');
  const [doctorId, setDoctorId] = useState<string>('');
  const [hospitalId, setHospitalId] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [apptsData, docsData, hospsData] = await Promise.all([
        dbService.getAppointments(userId),
        dbService.getDoctors(userId),
        dbService.getHospitals(userId)
      ]);
      setAppointments(apptsData);
      setDoctors(docsData);
      setHospitals(hospsData);

      // set defaults for selectors if data is loaded
      if (docsData.length > 0) setDoctorId(docsData[0].id);
      if (hospsData.length > 0) setHospitalId(hospsData[0].id);
    } catch (err: any) {
      console.error(err);
      showMessage('Unable to pull appointment statistics.', 'err');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [userId]);

  const handleOpenCreateForm = () => {
    setEditingId(undefined);
    
    // Set default date as tomorrow at 10 AM
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    
    // Format to LOCAL datetime-local input string: YYYY-MM-DDThh:mm
    const year = tomorrow.getFullYear();
    const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const day = String(tomorrow.getDate()).padStart(2, '0');
    const hours = String(tomorrow.getHours()).padStart(2, '0');
    const minutes = String(tomorrow.getMinutes()).padStart(2, '0');
    setDateTime(`${year}-${month}-${day}T${hours}:${minutes}`);

    setDoctorId(doctors.length > 0 ? doctors[0].id : '');
    setHospitalId(hospitals.length > 0 ? hospitals[0].id : '');
    setNotes('');
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (appt: Appointment) => {
    setEditingId(appt.id);
    
    // Convert saved ISO timestamp to datetime-local format
    if (appt.dateTime) {
      const dt = new Date(appt.dateTime);
      const year = dt.getFullYear();
      const month = String(dt.getMonth() + 1).padStart(2, '0');
      const day = String(dt.getDate()).padStart(2, '0');
      const hours = String(dt.getHours()).padStart(2, '0');
      const minutes = String(dt.getMinutes()).padStart(2, '0');
      setDateTime(`${year}-${month}-${day}T${hours}:${minutes}`);
    } else {
      setDateTime('');
    }

    setDoctorId(appt.doctorId || '');
    setHospitalId(appt.hospitalId || '');
    setNotes(appt.notes || '');
    setIsFormOpen(true);
  };

  const handleSaveAppt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dateTime) {
      showMessage('Appointment date and time is required.', 'err');
      return;
    }

    try {
      const payload: Omit<Appointment, 'id'> = {
        userId,
        dateTime: new Date(dateTime).toISOString(),
        doctorId,
        hospitalId,
        notes: notes.trim()
      };

      await dbService.saveAppointment(payload, editingId);
      showMessage(
        editingId ? 'Appointment updated.' : 'Medical appointment scheduled successfully!',
        'success'
      );
      setIsFormOpen(false);
      loadData();
    } catch (err: any) {
      console.error(err);
      showMessage('Could not book appointment.', 'err');
    }
  };

  const handleDeleteAppt = async (id: string) => {
    if (!window.confirm('Cancel this scheduled hospital appointment?')) {
      return;
    }

    try {
      await dbService.deleteAppointment(id);
      showMessage('Appointment cancelled successfully.', 'success');
      loadData();
    } catch (err: any) {
      console.error(err);
      showMessage('Could not cancel appointment.', 'err');
    }
  };

  // Helper selectors
  const getDocName = (id: string) => {
    const doc = doctors.find(d => d.id === id);
    return doc ? `Dr. ${doc.name} (${doc.specialty})` : 'Unassigned Doctor';
  };

  const getHospName = (id: string) => {
    const hosp = hospitals.find(h => h.id === id);
    return hosp ? hosp.name : 'Unassigned Hospital Center';
  };

  // Format Date friendly
  const formatFriendlyDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
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

  // Human countdown helper
  const getCountdown = (isoString: string) => {
    const now = new Date().getTime();
    const target = new Date(isoString).getTime();
    const diff = target - now;

    if (diff < 0) {
      return 'Completed/Past';
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) {
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      return hours === 0 ? 'Happening in minutes' : `Scheduled today: in ${hours} hrs`;
    }
    if (days === 1) {
      return 'Happening tomorrow';
    }
    return `In ${days} days`;
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
              <h3 className="text-sm font-bold text-slate-800">My Medical Appointments</h3>
              <p className="text-xs text-slate-500 mt-0.5">Keep track of routine hematology reviews and clinical checkups.</p>
            </div>
            <button
              onClick={handleOpenCreateForm}
              className="py-1.5 px-3 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-brand-500/15"
              id="schedule-appointment-btn"
            >
              <Plus className="w-4 h-4" />
              Book Appointment
            </button>
          </div>

          {appointments.length > 0 ? (
            <div className="space-y-4.5">
              {appointments.map((appt) => {
                const isPast = new Date(appt.dateTime).getTime() < new Date().getTime();
                const countdown = getCountdown(appt.dateTime);

                return (
                  <div key={appt.id} className={`bg-white rounded-3xl p-5 border shadow-sm transition hover:shadow-md flex flex-col justify-between ${isPast ? 'border-dashed border-slate-200' : 'border-slate-100'}`}>
                    <div>
                      {/* Header row */}
                      <div className="flex justify-between items-start gap-2 border-b border-slate-50 pb-3 mb-3.5">
                        <div className="flex items-center gap-2.5">
                          <Calendar className={`w-5 h-5 ${isPast ? 'text-slate-400' : 'text-brand-600'}`} />
                          <div>
                            <span className="text-xs font-bold text-slate-800">{formatFriendlyDate(appt.dateTime)}</span>
                            {!isPast && (
                              <span className="text-[10px] font-bold text-white bg-accent-sunset px-2 py-0.5 rounded-full ml-2 text-center inline-block">
                                {countdown}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-slate-400 shrink-0">
                          <button
                            onClick={() => handleOpenEditForm(appt)}
                            className="p-1.5 hover:text-brand-500 hover:bg-slate-50 rounded-lg transition"
                            title="Edit"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteAppt(appt.id)}
                            className="p-1.5 hover:text-accent-crimson hover:bg-slate-50 rounded-lg transition"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Details structure */}
                      <div className="space-y-2 mt-3.5 text-xs text-slate-600">
                        <div className="flex items-start gap-2 font-medium">
                          <User className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="text-slate-400 font-bold text-[10px] uppercase block">Assigned Specialist:</span>
                            <span className="text-slate-800 font-bold">{getDocName(appt.doctorId)}</span>
                          </div>
                        </div>

                        <div className="flex items-start gap-2 font-medium">
                          <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="text-slate-400 font-bold text-[10px] uppercase block">Location Center:</span>
                            <span className="text-slate-800 font-semibold">{getHospName(appt.hospitalId)}</span>
                          </div>
                        </div>

                        {appt.notes && (
                          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex gap-2 items-start mt-3 font-normal text-slate-600 text-xs">
                            <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                            <div>
                              <span className="text-[10px] font-bold text-slate-400 block uppercase mb-0.5">Patient Notes:</span>
                              <p className="italic">{appt.notes}</p>
                            </div>
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
              <p className="text-slate-500 font-medium text-sm">No medical appointments scheduled.</p>
              <button
                type="button"
                onClick={handleOpenCreateForm}
                className="mt-4 py-2 px-4 bg-brand-600 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                Schedule First Appointment
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
              Calendar
            </button>
            <h3 className="text-base font-bold text-slate-800 shrink-0">
              {editingId ? 'Edit Appointment' : 'Book New Appointment'}
            </h3>
            <button
              onClick={() => setIsFormOpen(false)}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-50 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSaveAppt} className="space-y-4">
            
            <div className="space-y-1">
              <label htmlFor="appt-input-date" className="block text-xs font-semibold text-slate-700">Appointment Date and Time</label>
              <input
                id="appt-input-date"
                type="datetime-local"
                required
                value={dateTime}
                onChange={(e) => setDateTime(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition font-mono"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="appt-input-doc" className="block text-xs font-semibold text-slate-700">Assign Doctor Expert</label>
              <select
                id="appt-input-doc"
                value={doctorId}
                onChange={(e) => setDoctorId(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition"
              >
                <option value="">-- No Direct Doctor Assignment --</option>
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>Dr. {d.name} ({d.specialty})</option>
                ))}
              </select>
              {doctors.length === 0 && (
                <div className="text-[11px] text-amber-700 mt-1 flex gap-1 items-center">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>No doctors registered yet. Consider logging doctors in the care team directories.</span>
                </div>
              )}
            </div>

            <div className="space-y-1">
              <label htmlFor="appt-input-hosp" className="block text-xs font-semibold text-slate-700">Assign Medical Clinic Location</label>
              <select
                id="appt-input-hosp"
                value={hospitalId}
                onChange={(e) => setHospitalId(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition"
              >
                <option value="">-- No Hospital Center Selected --</option>
                {hospitals.map((h) => (
                  <option key={h.id} value={h.id}>{h.name}</option>
                ))}
              </select>
              {hospitals.length === 0 && (
                <div className="text-[11px] text-amber-700 mt-1 flex gap-1 items-center">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>No hospitals added yet. Consider registering blood units in the hospitals team tab.</span>
                </div>
              )}
            </div>

            <div className="space-y-1">
              <label htmlFor="appt-input-notes" className="block text-xs font-semibold text-slate-700">Consultation agenda or preparatory checklist</label>
              <textarea
                id="appt-input-notes"
                rows={3}
                placeholder="e.g. Bring recent complete blood count (CBC) report, blood pressure diaries, and prescription log folders."
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
              Book Appointment
            </button>

          </form>
        </div>
      )}

    </div>
  );
}
