/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { PatientProfile, EmergencyContact, BloodGroup, Genotype, Gender } from '../types';
import { dbService } from '../dbService';
import { User, Phone, Globe, Heart, Stethoscope, AlertOctagon, HelpCircle, Save, Plus, Trash2, Edit, ChevronDown, Award, Copy, Share2 } from 'lucide-react';

interface PatientProfileTabProps {
  userId: string;
  onProfileUpdated?: (fullName: string) => void;
  showMessage: (text: string, type: 'success' | 'err') => void;
}

const AFRICAN_COUNTRIES = [
  'Nigeria', 'Ghana', 'Kenya', 'Uganda', 'Tanzania', 'South Africa', 
  'Cameroon', 'Sierra Leone', 'Liberia', 'Rwanda', 'Senegal', 'Zimbabwe',
  'Ethiopia', 'Zambia', 'Malawi', 'Other'
];

export default function PatientProfileTab({ userId, onProfileUpdated, showMessage }: PatientProfileTabProps) {
  const [loading, setLoading] = useState<boolean>(true);
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  
  // Edit Form Fields
  const [fullName, setFullName] = useState<string>('');
  const [dob, setDob] = useState<string>('');
  const [gender, setGender] = useState<Gender>('Prefer not to say');
  const [country, setCountry] = useState<string>('Nigeria');
  const [bloodGroup, setBloodGroup] = useState<BloodGroup>('Unknown');
  const [genotype, setGenotype] = useState<Genotype>('Unknown');
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([]);

  // Emergency Contact Form Inputs
  const [cName, setCName] = useState<string>('');
  const [cRelation, setCRelation] = useState<string>('');
  const [cPhone, setCPhone] = useState<string>('');
  const [cPrimary, setCPrimary] = useState<boolean>(false);

  // Load Profile from DB
  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = await dbService.getPatientProfile(userId);
      if (data) {
        setProfile(data);
        setFullName(data.fullName);
        setDob(data.dateOfBirth || '');
        setGender(data.gender);
        setCountry(data.country);
        setBloodGroup(data.bloodGroup);
        setGenotype(data.genotype);
        setEmergencyContacts(data.emergencyContacts || []);
      }
    } catch (err: any) {
      console.error(err);
      showMessage('Could not pull patient profile details.', 'err');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [userId]);

  // Handle Save Profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      showMessage('Full Name is required.', 'err');
      return;
    }

    try {
      const payload: Omit<PatientProfile, 'id'> = {
        fullName: fullName.trim(),
        dateOfBirth: dob,
        gender,
        country,
        bloodGroup,
        genotype,
        emergencyContacts
      };

      await dbService.updatePatientProfile(userId, payload);
      setProfile({ id: userId, ...payload });
      setIsEditing(false);
      showMessage('Your Patient Profile was successfully updated!', 'success');
      if (onProfileUpdated) {
        onProfileUpdated(fullName.trim());
      }
    } catch (err: any) {
      console.error(err);
      showMessage('Error saving profile changes.', 'err');
    }
  };

  // Add Emergency Contact
  const handleAddContact = () => {
    if (!cName.trim() || !cPhone.trim() || !cRelation.trim()) {
      showMessage('Please complete name, relationship and phone number for contact.', 'err');
      return;
    }

    const newContact: EmergencyContact = {
      id: `contact-${Date.now()}`,
      name: cName.trim(),
      relationship: cRelation.trim(),
      phone: cPhone.trim(),
      isPrimary: cPrimary || emergencyContacts.length === 0
    };

    // If marked primary, unmark other primary contacts
    let updatedContacts = [...emergencyContacts];
    if (newContact.isPrimary) {
      updatedContacts = updatedContacts.map(c => ({ ...c, isPrimary: false }));
    }

    updatedContacts.push(newContact);
    setEmergencyContacts(updatedContacts);

    // Clear inputs
    setCName('');
    setCRelation('');
    setCPhone('');
    setCPrimary(false);
    showMessage('Emergency contact appended!', 'success');
  };

  // Delete Emergency Contact
  const handleDeleteContact = (id: string) => {
    const updated = emergencyContacts.filter(c => c.id !== id);
    // If we deleted primary, set first contact as primary
    if (updated.length > 0 && !updated.some(c => c.isPrimary)) {
      updated[0].isPrimary = true;
    }
    setEmergencyContacts(updated);
    showMessage('Emergency contact removed.', 'success');
  };

  // Calculate age helper
  const calculateAge = (birthDateString: string): number | null => {
    if (!birthDateString) return null;
    const birthday = new Date(birthDateString);
    const today = new Date();
    let age = today.getFullYear() - birthday.getFullYear();
    const monthDiff = today.getMonth() - birthday.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthday.getDate())) {
      age--;
    }
    return isNaN(age) ? null : age;
  };

  // Copy urgent crisis passport details
  const handleCopyUrgentInfo = () => {
    if (!profile) return;
    const infoText = `URGENT MEDICAL PASSPORT:
Patient: ${profile.fullName}
DOB: ${profile.dateOfBirth} (${calculateAge(profile.dateOfBirth) || '?'} yrs old)
Genotype: Sickle Cell ${profile.genotype}
Blood Group: ${profile.bloodGroup}
Country: ${profile.country}
Emergency Contact: ${profile.emergencyContacts.length > 0 ? `${profile.emergencyContacts[0].name} (${profile.emergencyContacts[0].relationship}) - ${profile.emergencyContacts[0].phone}` : 'N/A'}`;
    
    navigator.clipboard.writeText(infoText);
    showMessage('Urgent Medical Passport text copied to clipboard!', 'success');
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
      
      {/* Interactive Emergency Medical Passport / ID banner */}
      {profile && (
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-brand-950 text-white rounded-3xl p-6 shadow-xl border border-slate-800 relative overflow-hidden transition-all">
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/10 rounded-full blur-2xl"></div>
          <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-accent-amber/10 rounded-full blur-xl"></div>
          
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div>
              <span className="bg-brand-500/20 text-brand-400 font-mono text-[10px] tracking-widest uppercase py-1 px-2.5 rounded-full border border-brand-500/30">
                Sickle Cell Emergency ID
              </span>
              <h3 className="text-xl font-bold mt-2.5 text-slate-100">{profile.fullName}</h3>
              <p className="text-xs text-slate-400 mt-1">
                {profile.dateOfBirth ? `${profile.dateOfBirth} (Age ${calculateAge(profile.dateOfBirth) || 'N/A'})` : 'No birthdate filled'}
              </p>
            </div>
            
            <div className="text-right">
              <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Genotype</div>
              <div className="text-2xl font-black text-emerald-400 drop-shadow">{profile.genotype}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-slate-700/60 pt-4 mt-4 text-xs relative z-10">
            <div>
              <span className="text-slate-400 block mb-0.5">Blood Group</span>
              <span className="font-bold text-slate-200">{profile.bloodGroup}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Location</span>
              <span className="font-bold text-slate-200">{profile.country}</span>
            </div>
          </div>

          {/* Emergency contacts summary in passport */}
          <div className="border-t border-slate-700/60 pt-4 mt-4 relative z-10">
            <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider mb-2">Emergency Crisis Contacts</span>
            {profile.emergencyContacts.length > 0 ? (
              <div className="space-y-2">
                {profile.emergencyContacts.slice(0, 2).map((contact) => (
                  <div key={contact.id} className="flex justify-between items-center bg-slate-800/50 p-2 rounded-xl border border-slate-700/40">
                    <div>
                      <span className="font-semibold text-white block text-xs">{contact.name}</span>
                      <span className="text-[10px] text-slate-400 font-medium">{contact.relationship} {contact.isPrimary && '• (Primary)'}</span>
                    </div>
                    <a
                      href={`tel:${contact.phone}`}
                      className="py-1 px-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 transition"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      Call Support
                    </a>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-2 bg-orange-900/20 text-orange-200 text-xs rounded-xl flex gap-2 items-center border border-orange-800/30">
                <AlertOctagon className="w-4 h-4 text-orange-500 shrink-0" />
                <span>No emergency contacts specified. Please edit your profile to add contacts!</span>
              </div>
            )}
          </div>

          {/* Passport CTAs */}
          <div className="flex gap-2.5 mt-5">
            <button
              onClick={handleCopyUrgentInfo}
              className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl transition border border-slate-700 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              Copy Emergency Text
            </button>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="flex-1 py-2 bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
              id="edit-profile-action-btn"
            >
              <Edit className="w-3.5 h-3.5" />
              {isEditing ? 'Cancel Edit' : 'Edit Profile Data'}
            </button>
          </div>
        </div>
      )}

      {/* Editor Block */}
      {isEditing && (
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-md">
          <h3 className="text-lg font-bold text-slate-900 mb-5 flex items-center gap-2">
            <User className="w-5 h-5 text-brand-600" />
            Update Warrior Profile Data
          </h3>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label htmlFor="prof-name" className="block text-xs font-semibold text-slate-700">Full Name</label>
                <input
                  id="prof-name"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="prof-dob" className="block text-xs font-semibold text-slate-700">Date of Birth</label>
                <input
                  id="prof-dob"
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="prof-country" className="block text-xs font-semibold text-slate-700">Country of Residence</label>
                <select
                  id="prof-country"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition"
                >
                  {AFRICAN_COUNTRIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label htmlFor="prof-gender" className="block text-xs font-semibold text-slate-700">Gender</label>
                <select
                  id="prof-gender"
                  value={gender}
                  onChange={(e) => setGender(e.target.value as Gender)}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>

              <div className="space-y-1">
                <label htmlFor="prof-blood" className="block text-xs font-semibold text-slate-700">Blood Group</label>
                <select
                  id="prof-blood"
                  value={bloodGroup}
                  onChange={(e) => setBloodGroup(e.target.value as BloodGroup)}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition"
                >
                  <option value="Unknown">Unknown</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>

              <div className="space-y-1">
                <label htmlFor="prof-genotype" className="block text-xs font-semibold text-slate-700 flex items-center gap-1">
                  Sickle Cell Genotype
                  <span className="text-slate-400 group relative">
                    <HelpCircle className="w-3.5 h-3.5 cursor-pointer" />
                    {/* Hover Tooltip */}
                  </span>
                </label>
                <select
                  id="prof-genotype"
                  value={genotype}
                  onChange={(e) => setGenotype(e.target.value as Genotype)}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition"
                >
                  <option value="Unknown">Unknown</option>
                  <option value="SS">SS (Homeozygous Sickle Cell Pain variant - highly acute)</option>
                  <option value="SC">SC (Heterozygous Sickle Cell Hemoglobin C variant)</option>
                  <option value="CC">CC (Hemoglobin CC)</option>
                  <option value="AS">AS (Sickle Cell Trait - Carrier)</option>
                  <option value="AC">AC (Carrier Carrier Hemoglobin C)</option>
                  <option value="AA">AA (Normal Adult Hemoglobin)</option>
                  <option value="Beta-Thalassemia">Beta-Thalassemia (Sickle Beta Plus/Zero variant)</option>
                </select>
              </div>
            </div>

            {/* Sub-form to manage emergency contacts in real time */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 mt-4">
              <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center justify-between">
                <span>Manage Crisis Care Contacts</span>
                <span className="text-[10px] bg-slate-200 text-slate-700 font-semibold px-2 py-0.5 rounded-full">
                  {emergencyContacts.length} Saved
                </span>
              </h4>

              {/* Current temporary contacts in editor state */}
              {emergencyContacts.length > 0 ? (
                <div className="space-y-2 mb-4">
                  {emergencyContacts.map((contact) => (
                    <div key={contact.id} className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-slate-200/60 text-xs shadow-sm">
                      <div>
                        <span className="font-bold text-slate-800">{contact.name}</span>
                        <span className="text-slate-500 font-medium ml-2">({contact.relationship})</span>
                        {contact.isPrimary && (
                          <span className="ml-2 text-[9px] bg-brand-100 text-brand-800 py-0.5 px-2 rounded-full font-bold">Primary</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-600 font-mono text-[11px]">{contact.phone}</span>
                        <button
                          type="button"
                          onClick={() => handleDeleteContact(contact.id)}
                          className="p-1 text-slate-400 hover:text-accent-crimson transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic mb-4">No emergency contacts listed. Add at least one first responder below.</p>
              )}

              {/* Add New Contact input fields */}
              <div className="space-y-3 pt-3 border-t border-slate-200">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label htmlFor="ec-name" className="block text-[11px] font-semibold text-slate-700">Name</label>
                    <input
                      id="ec-name"
                      type="text"
                      placeholder="e.g. Abena Mensah"
                      value={cName}
                      onChange={(e) => setCName(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="ec-relation" className="block text-[11px] font-semibold text-slate-700">Relationship</label>
                    <input
                      id="ec-relation"
                      type="text"
                      placeholder="e.g. Spouse / Brother"
                      value={cRelation}
                      onChange={(e) => setCRelation(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
                  <div className="space-y-1">
                    <label htmlFor="ec-phone" className="block text-[11px] font-semibold text-slate-700">Phone (with country code)</label>
                    <input
                      id="ec-phone"
                      type="tel"
                      placeholder="e.g. +233 24 123 4567"
                      value={cPhone}
                      onChange={(e) => setCPhone(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-500"
                    />
                  </div>

                  <div className="flex items-center gap-2 pb-2">
                    <input
                      id="ec-primary"
                      type="checkbox"
                      checked={cPrimary}
                      onChange={(e) => setCPrimary(e.target.checked)}
                      className="w-4 h-4 text-brand-600 focus:ring-brand-500 border-slate-300 rounded"
                    />
                    <label htmlFor="ec-primary" className="text-xs text-slate-700 font-medium">Flag as Primary Caregiver</label>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAddContact}
                  className="w-full py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold text-xs rounded-xl transition flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Append Emergency Contact
                </button>
              </div>
            </div>

            {/* Save Buttons */}
            <div className="flex gap-2.5 pt-4">
              <button
                type="submit"
                className="flex-1 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-brand-500/10"
              >
                <Save className="w-4 h-4" />
                Commit Patient Changes
              </button>
            </div>

          </form>
        </div>
      )}

      {/* Instructional Medical Banner specific to genotype selected */}
      {profile && profile.genotype !== 'Unknown' && (
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 text-xs text-emerald-950 flex gap-3">
          <Award className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block mb-1">Hematologist Recommendation ({profile.genotype})</span>
            {profile.genotype === 'SS' ? (
              <p>
                The homozygous <strong>SS genotype</strong> is subject to acute vaso-occlusive crisis. Maintain constant cell hydration (minimum 3L filtered fresh water daily), avoid extreme temperature changes (severe high heat workouts or freezing rain conditions), and consult your doctor for protective drugs like <strong>Hydroxyurea</strong> or daily <strong>Folic Acid</strong> supplements.
              </p>
            ) : profile.genotype === 'SC' ? (
              <p>
                The <strong>SC variant</strong> might generally see slightly lower average rates of extreme crisis but is exceptionally prone to splenomegaly, avascular necrosis in the femur/hip joint, and ocular blood vessel blockages. Ensure you secure periodic comprehensive eye tests.
              </p>
            ) : (
              <p>
                Sickle Cell warriors thrive with rigorous daily routines. Keep your emergency contact details updated below, track pain, log daily folic supplements, and schedule routine laboratory reviews before exams or long international journeys.
              </p>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
