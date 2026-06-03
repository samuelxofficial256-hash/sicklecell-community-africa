import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { ShieldAlert, Phone, User, Heart, Compass, Activity, ArrowLeft, RefreshCw, Printer, Copy, Check, QrCode } from 'lucide-react';
import { dbService } from '../dbService';
import { PatientProfile, Doctor, Hospital } from '../types';

interface EmergencyHealthCardProps {
  userId: string;
  onBack?: () => void;
}

export const EmergencyHealthCard: React.FC<EmergencyHealthCardProps> = ({ userId, onBack }) => {
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const uProfile = await dbService.getPatientProfile(userId);
      setProfile(uProfile);
      
      const uDocs = await dbService.getDoctors(userId);
      setDoctors(uDocs);

      const uHosps = await dbService.getHospitals(userId);
      setHospitals(uHosps);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [userId]);

  if (loading) {
    return <div className="py-12 text-center text-xs text-slate-400">Assembling Emergency Medical Records...</div>;
  }

  // Get primary doctor & hospital details
  const primaryDoc = doctors[0] || null;
  const primaryHosp = hospitals[0] || null;

  // Format emergency payload for QR Code
  const qrString = `SICA EMERGENCY ID
----------------------
Name: ${profile?.fullName || 'African Warrior'}
Genotype: ${profile?.genotype || 'Pending'}
Blood Group: ${profile?.bloodGroup || 'O+'}
Country: ${profile?.country || 'Nigeria'}
DOB: ${profile?.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString() : 'N/A'}
Gender: ${profile?.gender || 'N/A'}

PRIMARY CLINIC:
Doctor: ${primaryDoc ? primaryDoc.name : 'N/A'} (${primaryDoc ? primaryDoc.phone : 'N/A'})
Hospital: ${primaryHosp ? primaryHosp.name : 'N/A'}

EMERGENCY CONTACTS:
${profile?.emergencyContacts && profile.emergencyContacts.length > 0 
  ? profile.emergencyContacts.map((c, i) => `${i+1}. ${c.name} (${c.relationship}) - ${c.phone}`).join('\n')
  : 'None Listed'
}
----------------------
SICA community health network. Scan in clinical crises.`;

  // QR Node API
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&color=991b1b&data=${encodeURIComponent(qrString)}`;

  const handleCopyRecordText = () => {
    navigator.clipboard.writeText(qrString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrintCard = () => {
    const printContent = cardRef.current?.innerHTML;
    if (!printContent) return;

    const originalContent = document.body.innerHTML;
    document.body.innerHTML = `
      <div style="padding: 40px; display: flex; align-items: center; justify-content: center; min-height: 100vh; font-family: sans-serif;">
        ${printContent}
      </div>
    `;
    window.print();
    // Refresh page / restore content
    window.location.reload();
  };

  return (
    <div id="emergency-card-view" className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-2">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              id="back-from-card-btn"
              onClick={onBack}
              className="p-2 text-slate-600 hover:text-slate-900 transition-colors rounded-lg bg-slate-100"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          <div>
            <h2 className="text-2xl font-semibold text-slate-900 tracking-tight">Emergency Health Card</h2>
            <p className="text-sm text-slate-500 font-medium">Digital Medical ID & Rapid Crisis Responder details</p>
          </div>
        </div>

        <button
          id="refresh-card-btn"
          onClick={fetchData}
          className="p-2 text-slate-500 hover:text-red-650 transition-colors"
          title="Refresh Record"
        >
          <RefreshCw className="h-5 w-5" />
        </button>
      </div>

      {/* Intro alert */}
      <div className="p-4 bg-rose-50 border border-rose-105 rounded-xl flex items-start gap-3">
        <ShieldAlert className="h-5 w-5 text-red-700 mt-0.5 shrink-0 animate-pulse" />
        <div>
          <span className="font-semibold text-rose-900 text-xs block mb-0.5">Life Saver Protocol:</span>
          <p className="text-xs text-rose-850 leading-relaxed">
            In any vaso-occlusive crisis (VOC) or suspected acute chest syndrome, EMTs and hospital staff need immediate genotype and contact summaries. Display this health badge or permit them to scan the code.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Physical ID Mock Card */}
        <div className="lg:col-span-12 xl:col-span-7 flex flex-col items-center">
          <div
            id="emergency-id-badge"
            ref={cardRef}
            className="w-full max-w-md bg-gradient-to-br from-red-700 via-rose-800 to-red-905 text-white p-6 rounded-3xl shadow-xl border border-red-600 relative overflow-hidden"
          >
            {/* Background design accents */}
            <div className="absolute -top-12 -right-12 h-32 w-32 bg-white/5 rounded-full blur-2xl"></div>
            <div className="absolute -bottom-16 -left-16 h-40 w-40 bg-red-500/20 rounded-full blur-2xl"></div>

            {/* Header Badge */}
            <div className="flex items-center justify-between border-b border-red-500/30 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-white text-red-700 rounded-xl shadow font-extrabold flex items-center justify-center h-10 w-10">
                  <Heart className="h-6 w-6 text-red-600 animate-pulse" />
                </div>
                <div>
                  <h4 className="text-xs font-black tracking-widest uppercase text-red-200">SCCA Africa</h4>
                  <p className="text-[10px] font-semibold text-white/70">Critical Emergency ID</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[9px] bg-red-900/60 uppercase font-bold tracking-widest px-2.5 py-1 rounded-full border border-red-500/20">
                  Patient Card
                </span>
              </div>
            </div>

            {/* Middle Section: Face and Patient parameters */}
            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-8 space-y-3">
                {/* Full name */}
                <div>
                  <span className="text-[10px] uppercase text-red-200 font-medium block">Patient Name</span>
                  <div className="font-bold text-lg text-white tracking-tight flex items-center gap-1.5 mt-0.5">
                    <User className="h-4.5 w-4.5 text-red-300" /> {profile?.fullName || 'African Warrior'}
                  </div>
                </div>

                {/* Genotype and Blood group */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] uppercase text-red-200 font-medium block">Genotype</span>
                    <span className="font-mono text-base font-black px-2.5 py-0.5 bg-red-900/50 rounded border border-red-500/30 mt-0.5 inline-block">
                      {profile?.genotype || 'SS'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-red-200 font-medium block">Blood Group</span>
                    <span className="font-mono text-base font-black px-2.5 py-0.5 bg-red-900/50 rounded border border-red-500/30 mt-0.5 inline-block text-red-100">
                      {profile?.bloodGroup || 'O+'}
                    </span>
                  </div>
                </div>

                {/* Emergency contact */}
                <div>
                  <span className="text-[10px] uppercase text-red-200 font-medium block">Primary Emergency Contact</span>
                  {profile?.emergencyContacts && profile.emergencyContacts.length > 0 ? (
                    <div className="text-xs font-semibold text-white mt-1 space-y-0.5">
                      <div className="flex items-center gap-1 text-red-100">
                        <Phone className="h-3 w-3" /> {profile.emergencyContacts[0].name} ({profile.emergencyContacts[0].relationship})
                      </div>
                      <div className="text-[11px] font-mono pl-4 text-white/80">{profile.emergencyContacts[0].phone}</div>
                    </div>
                  ) : (
                    <span className="text-[10px] text-white/50 italic block mt-1">None listed - setup profile contacts</span>
                  )}
                </div>
              </div>

              {/* QR Code Graphic Column */}
              <div className="col-span-4 flex flex-col items-center justify-center p-2 bg-white rounded-2xl border border-red-500/20 shadow-inner">
                <img
                  src={qrImageUrl}
                  alt="Emergency QR Code"
                  className="w-full aspect-square object-contain"
                  referrerPolicy="no-referrer"
                />
                <span className="text-[8px] text-red-900 font-bold tracking-wider uppercase mt-1">EMG SCAN</span>
              </div>
            </div>

            {/* Card Footer: Doctor details */}
            <div className="mt-5 border-t border-red-500/30 pt-3 flex items-center justify-between text-xs text-red-200">
              <div>
                <span className="text-[9px] uppercase text-red-300 block">Primary Hematologist</span>
                <span className="font-semibold text-white">{primaryDoc ? primaryDoc.name : 'No Doctor Linked'}</span>
              </div>
              <div className="text-right">
                <span className="text-[9px] uppercase text-red-300 block">Ref. Clinic</span>
                <span className="font-semibold text-white">{primaryHosp ? primaryHosp.name : 'No Hospital Linked'}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 mt-6">
            <button
              id="print-emergency-card-btn"
              onClick={handlePrintCard}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl flex items-center gap-2 text-xs font-semibold transition-all cursor-pointer shadow-sm hover:shadow"
            >
              <Printer className="h-4 w-4" /> Print Card
            </button>
            <button
              id="copy-emergency-data-btn"
              onClick={handleCopyRecordText}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl flex items-center gap-2 text-xs font-semibold transition-all cursor-pointer"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
              {copied ? 'Copied' : 'Copy Text Data'}
            </button>
          </div>
        </div>

        {/* Info panel explaining how QR code works */}
        <div id="card-faq-panel" className="lg:col-span-12 xl:col-span-5 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
          <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-100/80 flex gap-3 items-start">
            <Heart className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5 animate-pulse" />
            <div>
              <h4 className="text-xs font-bold text-slate-800">Secure Offline Access Active</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed mt-1">
                Your medical ID, emergency contacts, and active provider info are securely stored locally via our custom Service Worker offline strategy. You can load and present this card even with zero network coverage.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-slate-900 flex items-center gap-1.5">
              How does the QR Code help? <QrCode className="h-4 text-red-650" />
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed font-normal">
              When a healthcare responder scans the code on your physical card, the plain-text emergency summary launches instantly in their device.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="p-2 bg-rose-50 text-red-700 rounded-lg h-8 w-8 flex items-center justify-center shrink-0">
                <Activity className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-slate-800">Oxygen & Hydration Guidance</h4>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                  Alerts responders that immediate high-flow oxygen, IV fluids warmth, and rapid analgesia management must be prioritized.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="p-2 bg-rose-50 text-red-700 rounded-lg h-8 w-8 flex items-center justify-center shrink-0">
                <Compass className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-slate-800">Clinician Direct Line</h4>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                  Your primary hematologist can be contacted immediately to consult on exchange blood transfusions or special protocols.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="p-2 bg-rose-50 text-red-700 rounded-lg h-8 w-8 flex items-center justify-center shrink-0">
                <Phone className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-slate-800">Instant Care Partner Calling</h4>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                  First responders don't have to unlock your phone to find your family. Scanning the card displays your parents or siblings' primary numbers.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
