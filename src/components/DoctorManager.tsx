/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Doctor } from '../types';
import { dbService } from '../dbService';
import { Stethoscope, Plus, Trash2, Edit, Phone, Mail, FileText, X, ArrowLeft, Save } from 'lucide-react';

interface DoctorManagerProps {
  userId: string;
  showMessage: (text: string, type: 'success' | 'err') => void;
}

export default function DoctorManager({ userId, showMessage }: DoctorManagerProps) {
  const [loading, setLoading] = useState<boolean>(true);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | undefined>(undefined);

  // Form Fields
  const [name, setName] = useState<string>('');
  const [specialty, setSpecialty] = useState<string>('Hematologist');
  const [hospitalName, setHospitalName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const loadDoctors = async () => {
    try {
      setLoading(true);
      const data = await dbService.getDoctors(userId);
      setDoctors(data);
    } catch (err: any) {
      console.error(err);
      showMessage('Could not pull doctors directory.', 'err');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDoctors();
  }, [userId]);

  const handleOpenCreateForm = () => {
    setEditingId(undefined);
    setName('');
    setSpecialty('Hematologist');
    setHospitalName('');
    setPhone('');
    setEmail('');
    setNotes('');
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (doc: Doctor) => {
    setEditingId(doc.id);
    setName(doc.name);
    setSpecialty(doc.specialty);
    setHospitalName(doc.hospitalName);
    setPhone(doc.phone);
    setEmail(doc.email);
    setNotes(doc.notes);
    setIsFormOpen(true);
  };

  const handleSaveDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showMessage('Doctor Name is required.', 'err');
      return;
    }

    try {
      const payload: Omit<Doctor, 'id'> = {
        userId,
        name: name.trim(),
        specialty: specialty.trim(),
        hospitalName: hospitalName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        notes: notes.trim()
      };

      await dbService.saveDoctor(payload, editingId);
      showMessage(
        editingId ? 'Doctor record updated successfully.' : 'Doctor record appended successfully!',
        'success'
      );
      setIsFormOpen(false);
      loadDoctors();
    } catch (err: any) {
      console.error(err);
      showMessage('Could not commit doctor record.', 'err');
    }
  };

  const handleDeleteDoc = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to remove Dr. ${name} from your sickle cell team?`)) {
      return;
    }

    try {
      await dbService.deleteDoctor(id);
      showMessage(`Removed Dr. ${name} successfully.`, 'success');
      loadDoctors();
    } catch (err: any) {
      console.error(err);
      showMessage('Unable to remove doctor record.', 'err');
    }
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
      
      {/* List / Form View Toggle */}
      {!isFormOpen ? (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <div>
              <h3 className="text-sm font-bold text-slate-800">My Sickle Cell Care Team</h3>
              <p className="text-xs text-slate-500 mt-0.5">Quick access to hematologists, emergency clinics, and primary care doctors.</p>
            </div>
            <button
              onClick={handleOpenCreateForm}
              className="py-1.5 px-3 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-brand-500/15"
              id="add-doctor-button"
            >
              <Plus className="w-4 h-4" />
              Add Doctor
            </button>
          </div>

          {doctors.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {doctors.map((doc) => (
                <div key={doc.id} className="bg-white rounded-3xl p-5 border border-slate-100 shadow-md flex flex-col justify-between hover:shadow-lg transition">
                  <div>
                    {/* Header: Name and Specialist badge */}
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center text-brand-600 shrink-0">
                          <Stethoscope className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-800 leading-tight">Dr. {doc.name}</h4>
                          <span className="text-[11px] font-semibold text-brand-700 bg-brand-50 px-2 py-0.5 rounded-full mt-1 inline-block">
                            {doc.specialty}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-slate-400">
                        <button
                          onClick={() => handleOpenEditForm(doc)}
                          className="p-1.5 hover:text-brand-500 hover:bg-slate-50 rounded-lg transition"
                          title="Edit"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteDoc(doc.id, doc.name)}
                          className="p-1.5 hover:text-accent-crimson hover:bg-slate-50 rounded-lg transition"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Stats Fields */}
                    <div className="space-y-2 mt-4 text-xs font-medium text-slate-600">
                      {doc.hospitalName && (
                        <p className="flex items-center gap-2">
                          <span className="text-slate-400 font-bold text-[10px] uppercase w-16">Hospital:</span>
                          <span className="text-slate-800 font-semibold">{doc.hospitalName}</span>
                        </p>
                      )}
                      
                      {doc.phone && (
                        <p className="flex items-center gap-2">
                          <span className="text-slate-400 font-bold text-[10px] uppercase w-16">Phone:</span>
                          <span className="font-mono text-slate-700">{doc.phone}</span>
                        </p>
                      )}

                      {doc.email && (
                        <p className="flex items-center gap-2">
                          <span className="text-slate-400 font-bold text-[10px] uppercase w-16">Email:</span>
                          <span className="text-slate-700">{doc.email}</span>
                        </p>
                      )}

                      {doc.notes && (
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 mt-2.5 flex gap-2 items-start text-xs text-slate-600 font-normal italic">
                          <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                          <p>{doc.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions drawer for calling/emailing doctors */}
                  <div className="flex gap-2.5 border-t border-slate-100 pt-3.5 mt-4">
                    {doc.phone && (
                      <a
                        href={`tel:${doc.phone}`}
                        className="flex-1 py-1 px-3 bg-brand-50 hover:bg-brand-100 text-brand-800 rounded-xl text-center text-xs font-bold flex items-center justify-center gap-1.5 transition"
                      >
                        <Phone className="w-3.5 h-3.5 text-brand-600" />
                        Dial Call
                      </a>
                    )}
                    {doc.email && (
                      <a
                        href={`mailto:${doc.email}`}
                        className="flex-1 py-1 px-3 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-center text-xs font-bold flex items-center justify-center gap-1.5 transition"
                      >
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        Email Clinician
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-slate-50 rounded-3xl p-8 text-center border-2 border-dashed border-slate-200">
              <p className="text-slate-500 font-medium text-sm">No doctors added yet.</p>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">Having hematologists registered makes scheduling appointments and emergency crisis communications incredibly easy!</p>
              <button
                type="button"
                onClick={handleOpenCreateForm}
                className="mt-4 py-2 px-4 bg-brand-600 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                Add Your First Doctor
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
              Directory
            </button>
            <h3 className="text-base font-bold text-slate-800 shrink-0">
              {editingId ? 'Edit Doctor Profile' : 'Add New Doctor Profile'}
            </h3>
            <button
              onClick={() => setIsFormOpen(false)}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-50 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSaveDoc} className="space-y-4">
            
            <div className="space-y-1">
              <label htmlFor="doc-input-name" className="block text-xs font-semibold text-slate-700">Doctor Name (e.g. Ellen Ngozi)</label>
              <input
                id="doc-input-name"
                type="text"
                required
                placeholder="Ellen Ngozi"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label id="lbl-spec" htmlFor="doc-input-spec" className="block text-xs font-semibold text-slate-700">Specialty</label>
                <input
                  id="doc-input-spec"
                  type="text"
                  required
                  placeholder="e.g. Sickle Cell Specialist Hematologist"
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="doc-input-hosp" className="block text-xs font-semibold text-slate-700">Hospital Name / Ward Location</label>
                <input
                  id="doc-input-hosp"
                  type="text"
                  placeholder="e.g. Accra General Hospital"
                  value={hospitalName}
                  onChange={(e) => setHospitalName(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label htmlFor="doc-input-phone" className="block text-xs font-semibold text-slate-700">Phone Code</label>
                <input
                  id="doc-input-phone"
                  type="tel"
                  placeholder="e.g. +233 24 111 2222"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="doc-input-email" className="block text-xs font-semibold text-slate-700">Email Address</label>
                <input
                  id="doc-input-email"
                  type="email"
                  placeholder="e.g. dr.ngozi@accrageneral.org"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition"
                />
              </div>
            </div>

            <div className="space-y-1 col-span-2">
              <label htmlFor="doc-input-notes" className="block text-xs font-semibold text-slate-700">Clinical notes & consultation guidelines</label>
              <textarea
                id="doc-input-notes"
                rows={3}
                placeholder="e.g. Primary sickle cell clinician. Consult her for Hydroxyurea dosage or red cell exchange therapy."
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
              Save Clinician details
            </button>

          </form>
        </div>
      )}

    </div>
  );
}
