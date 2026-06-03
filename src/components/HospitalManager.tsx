/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Hospital } from '../types';
import { dbService } from '../dbService';
import { MapPin, Plus, Trash2, Edit, Phone, FileText, ArrowLeft, X, Save, Copy } from 'lucide-react';

interface HospitalManagerProps {
  userId: string;
  showMessage: (text: string, type: 'success' | 'err') => void;
}

export default function HospitalManager({ userId, showMessage }: HospitalManagerProps) {
  const [loading, setLoading] = useState<boolean>(true);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | undefined>(undefined);

  // Form Fields
  const [name, setName] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [contactNumber, setContactNumber] = useState<string>('');
  const [emergencyContactInfo, setEmergencyContactInfo] = useState<string>('');

  const loadHospitals = async () => {
    try {
      setLoading(true);
      const data = await dbService.getHospitals(userId);
      setHospitals(data);
    } catch (err: any) {
      console.error(err);
      showMessage('Could not pull hospitals team registry.', 'err');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHospitals();
  }, [userId]);

  const handleOpenCreateForm = () => {
    setEditingId(undefined);
    setName('');
    setAddress('');
    setContactNumber('');
    setEmergencyContactInfo('');
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (hosp: Hospital) => {
    setEditingId(hosp.id);
    setName(hosp.name);
    setAddress(hosp.address);
    setContactNumber(hosp.contactNumber);
    setEmergencyContactInfo(hosp.emergencyContactInfo);
    setIsFormOpen(true);
  };

  const handleSaveHosp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showMessage('Hospital Name is required.', 'err');
      return;
    }

    try {
      const payload: Omit<Hospital, 'id'> = {
        userId,
        name: name.trim(),
        address: address.trim(),
        contactNumber: contactNumber.trim(),
        emergencyContactInfo: emergencyContactInfo.trim()
      };

      await dbService.saveHospital(payload, editingId);
      showMessage(
        editingId ? 'Hospital record updated.' : 'Hospital record appended successfully!',
        'success'
      );
      setIsFormOpen(false);
      loadHospitals();
    } catch (err: any) {
      console.error(err);
      showMessage('Could not commit hospital record.', 'err');
    }
  };

  const handleDeleteHosp = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to remove ${name} from your healthcare providers?`)) {
      return;
    }

    try {
      await dbService.deleteHospital(id);
      showMessage(`Removed ${name} successfully.`, 'success');
      loadHospitals();
    } catch (err: any) {
      console.error(err);
      showMessage('Unable to remove hospital.', 'err');
    }
  };

  const handleCopyHospitalInfo = (hosp: Hospital) => {
    const infoText = `HOSPITAL EMERGENCY DETAILS:
Hospital: ${hosp.name}
Address: ${hosp.address}
Contact No: ${hosp.contactNumber}
Emergency Desk: ${hosp.emergencyContactInfo}`;

    navigator.clipboard.writeText(infoText);
    showMessage(`Emergency details for ${hosp.name} copied! Ready to text/share.`, 'success');
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
              <h3 className="text-sm font-bold text-slate-800">My Medical Centers</h3>
              <p className="text-xs text-slate-500 mt-0.5">Specialized Sickle Cell Units, Pediatric Wards, and local care centers.</p>
            </div>
            <button
              onClick={handleOpenCreateForm}
              className="py-1.5 px-3 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-brand-500/15"
              id="add-hospital-button"
            >
              <Plus className="w-4 h-4" />
              Add Hospital
            </button>
          </div>

          {hospitals.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {hospitals.map((hosp) => (
                <div key={hosp.id} className="bg-white rounded-3xl p-5 border border-slate-100 shadow-md flex flex-col justify-between hover:shadow-lg transition">
                  <div>
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 shrink-0">
                          <MapPin className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-800 leading-tight">{hosp.name}</h4>
                          <span className="text-[10px] text-slate-400 mt-1 block font-medium">
                            {hosp.address || 'No address added'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-slate-400">
                        <button
                          onClick={() => handleCopyHospitalInfo(hosp)}
                          className="p-1.5 hover:text-brand-500 hover:bg-slate-50 rounded-lg transition"
                          title="Copy details"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenEditForm(hosp)}
                          className="p-1.5 hover:text-brand-500 hover:bg-slate-50 rounded-lg transition"
                          title="Edit"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteHosp(hosp.id, hosp.name)}
                          className="p-1.5 hover:text-accent-crimson hover:bg-slate-50 rounded-lg transition"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2 mt-4 text-xs font-semibold text-slate-600 border-t border-slate-50 pt-3">
                      {hosp.contactNumber && (
                        <p className="flex items-center gap-2">
                          <span className="text-slate-400 font-bold text-[10px] uppercase w-16">Contact:</span>
                          <span className="text-slate-700 font-mono">{hosp.contactNumber}</span>
                        </p>
                      )}

                      {hosp.emergencyContactInfo && (
                        <div className="bg-red-50 text-amber-950 p-2.5 rounded-xl border border-red-100/60 mt-2 flex gap-2 items-start text-xs font-medium">
                          <Phone className="w-3.5 h-3.5 text-accent-crimson shrink-0 mt-0.5 animate-bounce" />
                          <div>
                            <span className="font-bold text-slate-800 text-[10px] uppercase block mb-0.5">Emergency Hotline:</span>
                            <span className="text-accent-crimson font-bold">{hosp.emergencyContactInfo}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Call Direct */}
                  {hosp.contactNumber && (
                    <div className="flex gap-2.5 border-t border-slate-100 pt-3.5 mt-4">
                      <a
                        href={`tel:${hosp.contactNumber}`}
                        className="flex-1 py-1.5 px-3 bg-brand-50 hover:bg-brand-100 text-brand-800 rounded-xl text-center text-xs font-bold flex items-center justify-center gap-1.5 transition"
                      >
                        <Phone className="w-3.5 h-3.5 text-brand-600" />
                        Dial Main Desk
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-slate-50 rounded-3xl p-8 text-center border-2 border-dashed border-slate-200">
              <p className="text-slate-500 font-medium text-sm">No hospital centers logged.</p>
              <button
                type="button"
                onClick={handleOpenCreateForm}
                className="mt-4 py-2 px-4 bg-brand-600 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                Add Hospital Info
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
              List
            </button>
            <h3 className="text-base font-bold text-slate-800 shrink-0">
              {editingId ? 'Edit Hospital Data' : 'Add New Hospital'}
            </h3>
            <button
              onClick={() => setIsFormOpen(false)}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-50 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSaveHosp} className="space-y-4">
            
            <div className="space-y-1">
              <label htmlFor="hosp-input-name" className="block text-xs font-semibold text-slate-700">Hospital Name</label>
              <input
                id="hosp-input-name"
                type="text"
                required
                placeholder="e.g. Lagos University Teaching Hospital (LUTH)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="hosp-input-address" className="block text-xs font-semibold text-slate-700">Physical Address</label>
              <input
                id="hosp-input-address"
                type="text"
                placeholder="e.g. Idi-Araba, Surulere, Lagos, Nigeria"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label htmlFor="hosp-input-phone" className="block text-xs font-semibold text-slate-700">Reception/Main Desk Number</label>
                <input
                  id="hosp-input-phone"
                  type="tel"
                  placeholder="e.g. +234 1 2714400"
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="hosp-input-emerg" className="block text-xs font-semibold text-slate-700">Direct Crisis Ward Hotline / Emergency No</label>
                <input
                  id="hosp-input-emerg"
                  type="text"
                  placeholder="e.g. LUTH Sickle Cell Desk: Ext 409"
                  value={emergencyContactInfo}
                  onChange={(e) => setEmergencyContactInfo(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition text-accent-crimson font-semibold placeholder:font-normal placeholder:text-slate-400"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm rounded-xl transition flex items-center justify-center gap-1 cursor-pointer shadow-md shadow-brand-500/10"
            >
              <Save className="w-4 h-4" />
              Save Medical Center
            </button>

          </form>
        </div>
      )}

    </div>
  );
}
