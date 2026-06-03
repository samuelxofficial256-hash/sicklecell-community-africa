/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { dbService, isSupabaseConfigured } from './dbService';
import { PatientProfile, Appointment, Medication, PainCrisis, UserSession } from './types';

// Import subcomponents
import AuthScreen from './components/AuthScreen';
import PatientProfileTab from './components/PatientProfileTab';
import DoctorManager from './components/DoctorManager';
import HospitalManager from './components/HospitalManager';
import AppointmentManager from './components/AppointmentManager';
import MedicationTracker from './components/MedicationTracker';
import PainTracker from './components/PainTracker';
import { HydrationTracker } from './components/HydrationTracker';
import { MoodTracker } from './components/MoodTracker';
import { SleepTracker } from './components/SleepTracker';
import { EmergencyHealthCard } from './components/EmergencyHealthCard';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';

// Import new modular components
import { AiAssistant } from './components/AiAssistant';
import CommunityForums from './components/CommunityForums';
import EducationCenter from './components/EducationCenter';
import AdminDashboard from './components/AdminDashboard';

// Icons
import { 
  Heart, Shield, Flame, Activity, Pill, Calendar, 
  Map, Phone, Users, ShieldAlert, LogOut, CheckCircle, 
  Database, User, Sparkles, MessageCircle, AlertTriangle, 
  Clock, CheckSquare, Settings, Menu, X, ArrowRight,
  Droplet, Smile, Moon, QrCode, BarChart2, BookOpen
} from 'lucide-react';

export default function App() {
  // Authentication & session state
  const [currentUser, setCurrentUser] = useState<{ id: string; email: string; fullName: string } | null>(null);
  const [sessionMode, setSessionMode] = useState<'supabase' | 'sandbox'>('sandbox');
  const [loading, setLoading] = useState<boolean>(true);

  // Layout Tab control
  const [activeTab, setActiveTab] = useState<
    | 'overview'
    | 'passport'
    | 'meds'
    | 'pain'
    | 'doctors'
    | 'hospitals'
    | 'appointments'
    | 'hydration'
    | 'mood'
    | 'sleep'
    | 'emergencyCard'
    | 'analytics'
    | 'aiAssistant'
    | 'forums'
    | 'education'
    | 'adminPanel'
  >('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Global Toast alerts
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'err'>('success');

  // Real-time Overview Dashboard State
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [meds, setMeds] = useState<Medication[]>([]);
  const [crises, setCrises] = useState<PainCrisis[]>([]);
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [todayTicksState, setTodayTicksState] = useState<Record<string, boolean>>({});

  const showToast = (text: string, type: 'success' | 'err') => {
    setToastMsg(text);
    setToastType(type);
    setTimeout(() => {
      setToastMsg(null);
    }, 4000);
  };

  const getLocalDateKey = () => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  };

  // Pull overview details
  const pullOverviewStats = async (userId: string) => {
    try {
      const [apptsData, medsData, crisesData, profData] = await Promise.all([
        dbService.getAppointments(userId),
        dbService.getMedications(userId),
        dbService.getPainCrises(userId),
        dbService.getPatientProfile(userId)
      ]);
      setAppointments(apptsData);
      setMeds(medsData);
      setCrises(crisesData);
      if (profData) setProfile(profData);

      // Pull daily checked meds for today
      const dateKey = getLocalDateKey();
      const rawTicks = localStorage.getItem(`scca_ticks_${userId}_${dateKey}`);
      if (rawTicks) {
        setTodayTicksState(JSON.parse(rawTicks));
      } else {
        setTodayTicksState({});
      }
    } catch (e) {
      console.error('Error fetching dashboard preview summaries', e);
    }
  };

  const checkSession = async () => {
    try {
      setLoading(true);
      const session = await dbService.getAuthenticatedUser();
      if (session.user) {
        setCurrentUser(session.user);
        setSessionMode(session.sessionMode);
        await pullOverviewStats(session.user.id);
      } else {
        setCurrentUser(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkSession();
  }, []);

  const handleAuthSuccess = (user: { id: string; email: string; fullName: string }, mode: 'supabase' | 'sandbox') => {
    setCurrentUser(user);
    setSessionMode(mode);
    pullOverviewStats(user.id);
    showToast(`Welcome to the SCCA Community, ${user.fullName || 'Warrior'}!`, 'success');
  };

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to sign out?')) {
      await dbService.signOut();
      setCurrentUser(null);
      showToast('Successfully logged out.', 'success');
    }
  };

  const handleProfileNameChanged = (newName: string) => {
    if (currentUser) {
      setCurrentUser({ ...currentUser, fullName: newName });
    }
    if (currentUser) {
      pullOverviewStats(currentUser.id);
    }
  };

  // Reload current tab state if we navigate to it
  useEffect(() => {
    if (currentUser) {
      pullOverviewStats(currentUser.id);
    }
  }, [activeTab, currentUser]);

  const toggleHomeMedTick = (medId: string) => {
    if (!currentUser) return;
    const dateKey = getLocalDateKey();
    const updated = {
      ...todayTicksState,
      [medId]: !todayTicksState[medId]
    };
    setTodayTicksState(updated);
    try {
      localStorage.setItem(`scca_ticks_${currentUser.id}_${dateKey}`, JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
    showToast(updated[medId] ? 'Supplement checked off!' : 'Supplement unmarked.', 'success');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center font-sans">
        <div className="w-12 h-12 border-4 border-brand-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-semibold text-slate-500 mt-4">Initializing SickleCell Community Africa...</p>
      </div>
    );
  }

  if (!currentUser) {
    return <AuthScreen onAuthSuccess={handleAuthSuccess} />;
  }

  // Next upcoming checkup calculation
  const upcomingAppointments = appointments.filter(a => new Date(a.dateTime).getTime() > new Date().getTime());
  const nextAppt = upcomingAppointments.length > 0 ? upcomingAppointments[0] : null;

  // Latest Pain event recorded info
  const latestCrisis = crises.length > 0 ? crises[0] : null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans selection:bg-brand-500 selection:text-white antialiased">
      
      {/* Toast Alert Banner */}
      {toastMsg && (
        <div id="toast" className={`fixed top-4 right-4 z-[9999] p-4 rounded-2xl shadow-xl border flex items-center gap-2 max-w-sm animate-pulse-subtle ${toastType === 'success' ? 'bg-white border-brand-100 text-slate-800' : 'bg-red-50 border-red-200 text-red-900'}`}>
          <div className={`w-2 h-2 rounded-full ${toastType === 'success' ? 'bg-brand-500' : 'bg-red-500'}`}></div>
          <span className="text-xs font-bold leading-relaxed">{toastMsg}</span>
        </div>
      )}

      {/* MOBILE HEADER BAR */}
      <header className="md:hidden bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-brand-600 rounded-xl flex items-center justify-center text-white font-black shadow-md shadow-brand-500/20">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-black text-slate-900 leading-tight">SCCA Warriors</h1>
            <span className="text-[10px] font-semibold text-brand-600 tracking-wider">Africa</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {sessionMode === 'sandbox' && (
            <span className="text-[9px] bg-amber-50 text-amber-700 font-bold border border-amber-200 py-0.5 px-2 rounded-full uppercase">Demo</span>
          )}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 text-slate-600 hover:bg-slate-50 rounded-lg transition"
            id="mobile-navigation-toggle"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* SIDEBAR NAVIGATION CONTROLS (Responsive) */}
      <aside className={`w-full md:w-64 bg-slate-900 text-slate-400 flex flex-col justify-between shrink-0 sticky top-0 h-auto md:h-screen z-40 border-r border-slate-850 md:flex ${mobileMenuOpen ? 'block' : 'hidden md:block'}`}>
        <div className="overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-slate-800">
          {/* Sidebar BRAND HEADER */}
          <div className="hidden md:flex items-center gap-3 px-6 py-6 border-b border-slate-800/80">
            <div className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-brand-500/20">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100 leading-tight">SickleCell</h2>
              <span className="text-[11px] font-semibold text-brand-400 tracking-wider">Community Africa</span>
            </div>
          </div>

          {/* Current Warrior Quick ID */}
          <div className="px-6 py-4 bg-slate-850/40 border-b border-slate-800/70 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-brand-700/60 font-semibold text-white uppercase text-xs flex items-center justify-center border border-brand-500/30">
              {currentUser.fullName.charAt(0)}
            </div>
            <div className="min-w-0">
              <span className="text-xs text-slate-400 font-medium block">Active Warrior:</span>
              <strong className="text-xs font-bold text-slate-200 truncate block">{currentUser.fullName}</strong>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5">
            <button
              id="nav-tab-overview"
              onClick={() => { setActiveTab('overview'); setMobileMenuOpen(false); }}
              className={`w-full py-2 px-3.5 rounded-xl text-left text-xs font-semibold flex items-center gap-3 transition cursor-pointer ${activeTab === 'overview' ? 'bg-brand-600 text-white font-bold' : 'hover:bg-slate-800 text-slate-400'}`}
            >
              <Activity className="w-4 h-4" />
              Overview Portal
            </button>

            <button
              id="nav-tab-passport"
              onClick={() => { setActiveTab('passport'); setMobileMenuOpen(false); }}
              className={`w-full py-2 px-3.5 rounded-xl text-left text-xs font-semibold flex items-center gap-3 transition cursor-pointer ${activeTab === 'passport' ? 'bg-brand-600 text-white font-bold' : 'hover:bg-slate-800 text-slate-400'}`}
            >
              <User className="w-4 h-4" />
              Patient Passport
            </button>

            <button
              id="nav-tab-meds"
              onClick={() => { setActiveTab('meds'); setMobileMenuOpen(false); }}
              className={`w-full py-2 px-3.5 rounded-xl text-left text-xs font-semibold flex items-center gap-3 transition cursor-pointer ${activeTab === 'meds' ? 'bg-brand-600 text-white font-bold' : 'hover:bg-slate-800 text-slate-400'}`}
            >
              <Pill className="w-4 h-4" />
              Medication Tracker
            </button>

            <button
              id="nav-tab-pain"
              onClick={() => { setActiveTab('pain'); setMobileMenuOpen(false); }}
              className={`w-full py-2 px-3.5 rounded-xl text-left text-xs font-semibold flex items-center gap-3 transition cursor-pointer ${activeTab === 'pain' ? 'bg-brand-600 text-white font-bold' : 'hover:bg-slate-800 text-slate-400'}`}
            >
              <Flame className="w-4 h-4" />
              Pain Crisis Diary
            </button>

            <button
              id="nav-tab-appointments"
              onClick={() => { setActiveTab('appointments'); setMobileMenuOpen(false); }}
              className={`w-full py-2 px-3.5 rounded-xl text-left text-xs font-semibold flex items-center gap-3 transition cursor-pointer ${activeTab === 'appointments' ? 'bg-brand-600 text-white font-bold' : 'hover:bg-slate-800 text-slate-400'}`}
            >
              <Calendar className="w-4 h-4" />
              Appointments
            </button>

            <div className="pt-4 pb-1 border-t border-slate-800/80 mt-2.5">
              <span className="text-[9px] uppercase font-bold tracking-widest text-slate-500 block px-3.5 mb-1.5">Wellness Trackers</span>
              <button
                id="nav-tab-hydration"
                onClick={() => { setActiveTab('hydration'); setMobileMenuOpen(false); }}
                className={`w-full py-2 px-3.5 rounded-xl text-left text-xs font-semibold flex items-center gap-3 transition cursor-pointer ${activeTab === 'hydration' ? 'bg-brand-600 text-white font-bold' : 'hover:bg-slate-800 text-slate-400'}`}
              >
                <Droplet className="w-4 h-4 text-sky-400" />
                Hydration Tracker
              </button>
              <button
                id="nav-tab-mood"
                onClick={() => { setActiveTab('mood'); setMobileMenuOpen(false); }}
                className={`w-full py-2 px-3.5 rounded-xl text-left text-xs font-semibold flex items-center gap-3 transition cursor-pointer ${activeTab === 'mood' ? 'bg-brand-600 text-white font-bold' : 'hover:bg-slate-800 text-slate-400'}`}
              >
                <Smile className="w-4 h-4 text-emerald-400" />
                Mood Tracker
              </button>
              <button
                id="nav-tab-sleep"
                onClick={() => { setActiveTab('sleep'); setMobileMenuOpen(false); }}
                className={`w-full py-2 px-3.5 rounded-xl text-left text-xs font-semibold flex items-center gap-3 transition cursor-pointer ${activeTab === 'sleep' ? 'bg-brand-600 text-white font-bold' : 'hover:bg-slate-800 text-slate-400'}`}
              >
                <Moon className="w-4 h-4 text-indigo-400" />
                Sleep & Rest Rest
              </button>
            </div>

            <div className="pt-4 pb-1 border-t border-slate-800/80 mt-2.5">
              <span className="text-[9px] uppercase font-bold tracking-widest text-slate-500 block px-3.5 mb-1.5">Emergency & ID</span>
              <button
                id="nav-tab-emergencyCard"
                onClick={() => { setActiveTab('emergencyCard'); setMobileMenuOpen(false); }}
                className={`w-full py-2 px-3.5 rounded-xl text-left text-xs font-semibold flex items-center gap-3 transition cursor-pointer ${activeTab === 'emergencyCard' ? 'bg-brand-600 text-white font-bold' : 'hover:bg-slate-800 text-slate-400'}`}
              >
                <QrCode className="w-4 h-4 text-rose-500" />
                Emergency Health Card
              </button>
              <button
                id="nav-tab-analytics"
                onClick={() => { setActiveTab('analytics'); setMobileMenuOpen(false); }}
                className={`w-full py-2 px-3.5 rounded-xl text-left text-xs font-semibold flex items-center gap-3 transition cursor-pointer ${activeTab === 'analytics' ? 'bg-brand-600 text-white font-bold' : 'hover:bg-slate-800 text-slate-400'}`}
              >
                <BarChart2 className="w-4 h-4 text-teal-400" />
                Analytics Dashboard
              </button>
            </div>

            <div className="pt-4 pb-1 border-t border-slate-800/80 mt-2.5">
              <span className="text-[9px] uppercase font-bold tracking-widest text-slate-500 block px-3.5 mb-1.5">Support Directories</span>
              <button
                id="nav-tab-doctors"
                onClick={() => { setActiveTab('doctors'); setMobileMenuOpen(false); }}
                className={`w-full py-2 px-3.5 rounded-xl text-left text-xs font-semibold flex items-center gap-3 transition cursor-pointer ${activeTab === 'doctors' ? 'bg-brand-600 text-white font-bold' : 'hover:bg-slate-800 text-slate-400'}`}
              >
                <Users className="w-4 h-4" />
                Clinic Doctors Team
              </button>

              <button
                id="nav-tab-hospitals"
                onClick={() => { setActiveTab('hospitals'); setMobileMenuOpen(false); }}
                className={`w-full py-2 px-3.5 rounded-xl text-left text-xs font-semibold flex items-center gap-3 transition cursor-pointer ${activeTab === 'hospitals' ? 'bg-brand-600 text-white font-bold' : 'hover:bg-slate-800 text-slate-400'}`}
              >
                <Map className="w-4 h-4" />
                Hospitals & Wards
              </button>
            </div>

            <div className="pt-4 pb-1 border-t border-slate-800/80 mt-2.5">
              <span className="text-[9px] uppercase font-bold tracking-widest text-slate-500 block px-3.5 mb-1.5">Social & AI Knowledge</span>
              <button
                id="nav-tab-aiAssistant"
                onClick={() => { setActiveTab('aiAssistant'); setMobileMenuOpen(false); }}
                className={`w-full py-2 px-3.5 rounded-xl text-left text-xs font-semibold flex items-center gap-3 transition cursor-pointer ${activeTab === 'aiAssistant' ? 'bg-brand-600 text-white font-bold' : 'hover:bg-slate-800 text-slate-400'}`}
              >
                <Sparkles className="w-4 h-4 text-brand-400 animate-pulse" />
                SCCA Edu-AI Assistant
              </button>
              <button
                id="nav-tab-forums"
                onClick={() => { setActiveTab('forums'); setMobileMenuOpen(false); }}
                className={`w-full py-2 px-3.5 rounded-xl text-left text-xs font-semibold flex items-center gap-3 transition cursor-pointer ${activeTab === 'forums' ? 'bg-brand-600 text-white font-bold' : 'hover:bg-slate-800 text-slate-400'}`}
              >
                <MessageCircle className="w-4 h-4 text-indigo-400" />
                Community Forum
              </button>
              <button
                id="nav-tab-education"
                onClick={() => { setActiveTab('education'); setMobileMenuOpen(false); }}
                className={`w-full py-2 px-3.5 rounded-xl text-left text-xs font-semibold flex items-center gap-3 transition cursor-pointer ${activeTab === 'education' ? 'bg-brand-600 text-white font-bold' : 'hover:bg-slate-800 text-slate-400'}`}
              >
                <BookOpen className="w-4 h-4 text-emerald-450" />
                Education Center
              </button>
              
              {currentUser && (currentUser.fullName === 'Kofi Mensah' || currentUser.email === 'samuelxofficial256@gmail.com') && (
                <button
                  id="nav-tab-adminPanel"
                  onClick={() => { setActiveTab('adminPanel'); setMobileMenuOpen(false); }}
                  className={`w-full py-2 px-3.5 rounded-xl text-left text-xs font-bold flex items-center gap-3 transition border border-dashed border-red-500/30 cursor-pointer ${activeTab === 'adminPanel' ? 'bg-red-650 text-white font-black' : 'hover:bg-slate-800 text-red-400'}`}
                >
                  <ShieldAlert className="w-4 h-4 text-rose-500 animate-pulse" />
                  Admin Moderator Panel
                </button>
              )}
            </div>
          </nav>
        </div>

        {/* Database modes & logout triggers */}
        <div className="p-4 border-t border-slate-800/80 space-y-2">
          <div className="p-2.5 rounded-xl bg-slate-950 text-[10px] text-slate-400 flex items-center justify-between border border-slate-800">
            <span className="flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-slate-500" />
              Connection Mode:
            </span>
            {sessionMode === 'supabase' ? (
              <span className="text-emerald-500 font-bold">Cloud</span>
            ) : (
              <span className="text-amber-500 font-bold">Sandbox</span>
            )}
          </div>

          <button
            onClick={handleLogout}
            className="w-full py-2 px-3 hover:bg-red-950/40 text-red-400 hover:text-red-300 rounded-xl text-left text-xs font-semibold flex items-center gap-3 transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Sign Out Session
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT DISPLAY */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 max-w-5xl mx-auto w-full">
        
        {/* VIEW SEGMENT: OVERVIEW PORTAL (CONVERGED DASHBOARD) */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            
            {/* Header segment with welcoming shield */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
              <div>
                <span className="text-slate-400 text-xs font-semibold block uppercase tracking-wider font-mono">Warrior Dashboard</span>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1 flex items-center gap-1">
                  Warm Greetings, {currentUser.fullName}!
                  <Sparkles className="w-5 h-5 text-brand-500 shrink-0" />
                </h1>
                <p className="text-xs text-slate-500 mt-1">Today is a beautiful day to hydrate and record your sickle cell health metrics.</p>
              </div>

              {/* Speedy shortcut indicators */}
              <div className="flex gap-2 w-full sm:w-auto shrink-0">
                <button
                  id="dashboard-record-pain-cta"
                  onClick={() => setActiveTab('pain')}
                  className="flex-1 py-1.5 px-3 bg-red-50 hover:bg-red-100 text-accent-crimson rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition border border-red-100 cursor-pointer"
                >
                  <Flame className="w-4 h-4" />
                  Log Pain State
                </button>
                <button
                  id="dashboard-schedule-appt-cta"
                  onClick={() => setActiveTab('appointments')}
                  className="flex-1 py-1.5 px-3 bg-brand-50 hover:bg-brand-100 text-brand-800 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition border border-brand-100 cursor-pointer"
                >
                  <Calendar className="w-4 h-4" />
                  Book Clinic
                </button>
              </div>
            </div>

            {/* URGENT EMERGENCY QUICK ACTION BAR (PROMINENT AT COGNITION SIGHT) */}
            <div className="bg-gradient-to-br from-red-600 via-orange-600 to-amber-700 text-white rounded-3xl p-5 shadow-lg relative overflow-hidden flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
              <div className="relative z-10">
                <h3 className="text-base font-black flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-white animate-bounce" />
                  Crisis Support Hub
                </h3>
                <p className="text-xs text-slate-200 mt-1 max-w-md">
                  In acute pain event, remain calm. Reach primary clinic dispatch and medical caretakers instantly below.
                </p>
              </div>
              
              <div className="flex gap-2.5 shrink-0 relative z-10 w-full sm:w-auto">
                {profile && profile.emergencyContacts.length > 0 ? (
                  <a
                    href={`tel:${profile.emergencyContacts[0].phone}`}
                    className="flex-1 py-2 px-4 bg-white text-orange-950 font-bold text-xs rounded-xl hover:bg-slate-50 transition text-center shadow flex items-center justify-center gap-1.5"
                  >
                    <Phone className="w-4 h-4 text-accent-sunset" />
                    Call primary: {profile.emergencyContacts[0].name}
                  </a>
                ) : (
                  <button
                    onClick={() => setActiveTab('passport')}
                    className="flex-1 py-2 px-4 bg-white/25 text-white font-bold text-xs rounded-xl hover:bg-white/35 transition border border-white/30 cursor-pointer text-center"
                  >
                    Set emergency Caregiver
                  </button>
                )}
                
                <button
                  onClick={() => setActiveTab('emergencyCard')}
                  className="py-2 px-3 bg-slate-900 border border-slate-800 text-white text-xs font-bold rounded-xl hover:bg-slate-950 transition flex items-center justify-center gap-1 cursor-pointer"
                >
                  Medical Card
                </button>
              </div>
            </div>

            {/* MAIN TWO-COLUMN DASHBOARD */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* UPPER APPOINTMENT CHECK & TIMER */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Next Upcoming Review</h3>

                {nextAppt ? (
                  <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] bg-accent-sunset/15 text-accent-sunset font-mono font-black px-2.5 py-0.5 rounded-full inline-block">
                        Clinic Calendar
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 mt-2.5">
                        {new Date(nextAppt.dateTime).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </h4>
                      
                      <div className="space-y-1.5 mt-3.5 text-xs text-slate-600">
                        {nextAppt.notes && (
                          <p className="italic text-slate-500 bg-slate-50 p-2 text-[11px] rounded-lg">
                            "{nextAppt.notes}"
                          </p>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => setActiveTab('appointments')}
                      className="mt-4 pt-3.5 border-t border-slate-50 text-brand-600 hover:text-brand-700 font-bold text-xs flex items-center justify-between w-full"
                    >
                      <span>Manage all appointments</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="bg-white rounded-3xl p-6 border-2 border-dashed border-slate-200 text-center text-slate-500">
                    <p className="text-xs font-semibold">No appointments scheduled.</p>
                    <button
                      onClick={() => setActiveTab('appointments')}
                      className="mt-3.5 py-1.5 px-3 bg-brand-50 hover:bg-brand-100 text-brand-700 rounded-xl font-bold text-xs inline-block cursor-pointer"
                    >
                      Book Routine Review
                    </button>
                  </div>
                )}

                {/* PAIN TELEMETRY JOURNAL PREVIEW */}
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 pt-2">Last Pain Logged</h3>

                {latestCrisis ? (
                  <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-850 font-black text-center flex flex-col items-center justify-center font-mono text-sm border border-orange-200 shrink-0">
                        <span>{latestCrisis.painScore}</span>
                        <span className="text-[7px] uppercase font-bold text-orange-900">Score</span>
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-800">
                          Logged {new Date(latestCrisis.dateTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit' })}
                        </h4>
                        <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
                          Symptoms: {latestCrisis.symptoms.slice(0, 2).join(', ') || 'None'}
                        </p>
                      </div>
                    </div>
                    {latestCrisis.notes && (
                      <p className="text-[11px] text-slate-500 italic bg-slate-50 p-2 rounded-lg mt-3">
                        "{latestCrisis.notes}"
                      </p>
                    )}
                    <button
                      onClick={() => setActiveTab('pain')}
                      className="mt-3.5 pt-3.5 border-t border-slate-50 text-brand-600 hover:text-brand-700 font-bold text-xs flex items-center justify-between w-full"
                    >
                      <span>Update pain history diary</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="bg-white rounded-3xl p-6 border-2 border-dashed border-slate-200 text-center text-slate-500">
                    <p className="text-xs font-semibold">No pain episodes logged yet.</p>
                    <button
                      onClick={() => setActiveTab('pain')}
                      className="mt-3.5 py-1.5 px-3 bg-brand-50 hover:bg-brand-100 text-brand-700 rounded-xl font-bold text-xs inline-block cursor-pointer"
                    >
                      Log Pain Score
                    </button>
                  </div>
                )}
              </div>

              {/* DAILY COMPLEMENTS TARGET ADHERENCE PROGRESS */}
              <div className="space-y-4">
                {/* SCCA AI ASSISTANT PROMO CARD */}
                <div className="bg-gradient-to-r from-brand-900 to-indigo-950 text-white rounded-3xl p-5 border border-brand-800 shadow-md relative overflow-hidden">
                  <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-brand-500/10 rounded-full blur-xl"></div>
                  <div className="flex items-start justify-between gap-4 relative z-10">
                    <div>
                      <span className="text-[9px] bg-brand-500/20 text-brand-300 font-mono font-bold px-2.5 py-0.5 rounded-full inline-block uppercase tracking-wider">
                        Interactive Knowledge
                      </span>
                      <h4 className="text-sm font-bold text-white mt-2 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-brand-450 animate-pulse" />
                        SCCA Edu-AI Assistant
                      </h4>
                      <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                        Have questions about Hydroxyurea, genotypes (SS/SC), VOC triggers, or home-care? Ask our trained hematology assistant instantly.
                      </p>
                    </div>
                  </div>
                  <button
                    id="overview-launch-ai-assistant-cta"
                    onClick={() => setActiveTab('aiAssistant')}
                    className="mt-4 w-full py-2 px-4 bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-brand-900/30"
                  >
                    <span>Launch AI Consultation Chat</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Daily Supplement Ticks</h3>

                <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-3.5">
                  <div className="flex justify-between items-center bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    <span className="text-xs font-bold text-slate-800">Today's Supplement intake:</span>
                    <span className="text-xs bg-emerald-100 text-emerald-800 font-bold py-0.5 px-2.5 rounded-full">
                      {Object.values(todayTicksState).filter(Boolean).length} / {meds.length}
                    </span>
                  </div>

                  {meds.length > 0 ? (
                    <div className="space-y-2">
                      {meds.map((med) => {
                        const isChecked = !!todayTicksState[med.id];
                        return (
                          <div
                            key={med.id}
                            onClick={() => toggleHomeMedTick(med.id)}
                            className={`p-3 rounded-2xl border text-xs flex justify-between items-center cursor-pointer transition ${isChecked ? 'bg-brand-50/20 border-brand-500/30 text-slate-600' : 'bg-white border-slate-200 hover:border-brand-500'}`}
                          >
                            <div>
                              <span className={`font-bold block ${isChecked ? 'line-through text-slate-500' : 'text-slate-800'}`}>
                                {med.name}
                              </span>
                              <span className="text-[10px] text-slate-400 font-semibold block mt-1">Dosage: {med.dosage}</span>
                            </div>
                            <CheckCircle className={`w-5 h-5 ${isChecked ? 'text-brand-600' : 'text-slate-300'}`} />
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-xs text-slate-400 italic">
                      No prescription medicines added yet.
                      <button
                        onClick={() => setActiveTab('meds')}
                        className="text-brand-600 font-bold block mx-auto underline mt-2"
                      >
                        Add supplement now
                      </button>
                    </div>
                  )}

                  <button
                    onClick={() => setActiveTab('meds')}
                    className="pt-3.5 border-t border-slate-100 text-brand-600 hover:text-brand-700 font-bold text-xs flex items-center justify-between w-full"
                  >
                    <span>Manage all medications</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                {/* QUICK WELLNESS TRACKERS PANEL */}
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 pt-3">Wellness Trackers Summary</h3>
                <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-4">
                  <p className="text-[11px] text-slate-500 leading-relaxed font-normal">
                    Prevent blood viscosity spikes and VOC triggers by maintaining consistent fluid hydration, mental strength, and deep night resting routines.
                  </p>

                  <div className="space-y-3">
                    {/* Water row */}
                    <div className="p-3 bg-sky-50/40 rounded-2xl border border-sky-100 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-sky-100 text-sky-600 rounded-xl">
                          <Droplet className="h-4 w-4" />
                        </div>
                        <div>
                          <span className="font-bold text-slate-800 text-xs block">Fluid Hydration</span>
                          <span className="text-[10px] text-slate-450 block mt-0.5">Target: 3.5L+ Daily</span>
                        </div>
                      </div>
                      <button
                        onClick={() => setActiveTab('hydration')}
                        className="py-1 px-3 bg-white hover:bg-sky-50 text-sky-700 font-bold rounded-lg border border-sky-200 text-[10px] transition cursor-pointer"
                      >
                        Drink Water
                      </button>
                    </div>

                    {/* Mood row */}
                    <div className="p-3 bg-emerald-50/40 rounded-2xl border border-emerald-100 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl">
                          <Smile className="h-4 w-4" />
                        </div>
                        <div>
                          <span className="font-bold text-slate-800 text-xs block">Mental Wellness</span>
                          <span className="text-[10px] text-slate-450 block mt-0.5 font-normal">Track coping metrics</span>
                        </div>
                      </div>
                      <button
                        onClick={() => setActiveTab('mood')}
                        className="py-1 px-3 bg-white hover:bg-emerald-50 text-emerald-700 font-bold rounded-lg border border-emerald-200 text-[10px] transition cursor-pointer"
                      >
                        Check-in
                      </button>
                    </div>

                    {/* Sleep row */}
                    <div className="p-3 bg-indigo-50/40 rounded-2xl border border-indigo-100 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl">
                          <Moon className="h-4 w-4" />
                        </div>
                        <div>
                          <span className="font-bold text-slate-800 text-xs block">Sleep & Rest Hours</span>
                          <span className="text-[10px] text-slate-450 block mt-0.5">Target: 7–9 hrs rest</span>
                        </div>
                      </div>
                      <button
                        onClick={() => setActiveTab('sleep')}
                        className="py-1 px-3 bg-white hover:bg-indigo-50 text-indigo-700 font-bold rounded-lg border border-indigo-200 text-[10px] transition cursor-pointer"
                      >
                        Log Rest
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveTab('analytics')}
                    className="pt-3 border-t border-slate-100 text-brand-600 hover:text-brand-700 font-bold text-xs flex items-center justify-between w-full"
                  >
                    <span>View complex health charts</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* VIEW SEGMENT: PATIENT PASSPORT */}
        {activeTab === 'passport' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Urgent Patient Passport ID</h2>
            <PatientProfileTab 
              userId={currentUser.id} 
              onProfileUpdated={handleProfileNameChanged}
              showMessage={showToast} 
            />
          </div>
        )}

        {/* VIEW SEGMENT: MEDS TRACKER */}
        {activeTab === 'meds' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Supplemental Medicine Schedules</h2>
            <MedicationTracker 
              userId={currentUser.id} 
              showMessage={showToast} 
            />
          </div>
        )}

        {/* VIEW SEGMENT: PAIN CRISIS TRACKER */}
        {activeTab === 'pain' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Pain Crisis Telemetry Diary</h2>
            <PainTracker 
              userId={currentUser.id} 
              showMessage={showToast} 
            />
          </div>
        )}

        {/* VIEW SEGMENT: APPOINTMENTS BOOKING */}
        {activeTab === 'appointments' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Appointments Booking</h2>
            <AppointmentManager 
              userId={currentUser.id} 
              showMessage={showToast} 
            />
          </div>
        )}

        {/* VIEW SEGMENT: DOCTORS TEAM */}
        {activeTab === 'doctors' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Primary Caregivers & Hematologists</h2>
            <DoctorManager 
              userId={currentUser.id} 
              showMessage={showToast} 
            />
          </div>
        )}

        {/* VIEW SEGMENT: HOSPITALS */}
        {activeTab === 'hospitals' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Specialized Sickle Cell emergency Units</h2>
            <HospitalManager 
              userId={currentUser.id} 
              showMessage={showToast} 
            />
          </div>
        )}

        {/* VIEW SEGMENT: HYDRATION TRACKER */}
        {activeTab === 'hydration' && (
          <div className="space-y-6">
            <HydrationTracker 
              userId={currentUser.id} 
              onBack={() => setActiveTab('overview')}
            />
          </div>
        )}

        {/* VIEW SEGMENT: MOOD TRACKER */}
        {activeTab === 'mood' && (
          <div className="space-y-6">
            <MoodTracker 
              userId={currentUser.id} 
              onBack={() => setActiveTab('overview')}
            />
          </div>
        )}

        {/* VIEW SEGMENT: SLEEP TRACKER */}
        {activeTab === 'sleep' && (
          <div className="space-y-6">
            <SleepTracker 
              userId={currentUser.id} 
              onBack={() => setActiveTab('overview')}
            />
          </div>
        )}

        {/* VIEW SEGMENT: EMERGENCY CELL ID CARD */}
        {activeTab === 'emergencyCard' && (
          <div className="space-y-6">
            <EmergencyHealthCard 
              userId={currentUser.id} 
              onBack={() => setActiveTab('overview')}
            />
          </div>
        )}

        {/* VIEW SEGMENT: ANALYTICS DASHBOARD */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <AnalyticsDashboard 
              userId={currentUser.id} 
              onBack={() => setActiveTab('overview')}
            />
          </div>
        )}

        {/* VIEW SEGMENT: SCCA AI ASSISTANT */}
        {activeTab === 'aiAssistant' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">SCCA Warriors AI Knowledge Center</h2>
            <AiAssistant 
              userId={currentUser.id} 
              onBack={() => setActiveTab('overview')}
            />
          </div>
        )}

        {/* VIEW SEGMENT: SCCA FORUMS */}
        {activeTab === 'forums' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">SCCA Warrior Discussion Boards</h2>
            <CommunityForums 
              userId={currentUser.id} 
              userName={currentUser.fullName}
              showMessage={showToast} 
            />
          </div>
        )}

        {/* VIEW SEGMENT: EDUCATION CENTER */}
        {activeTab === 'education' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">SCCA Hematology Library</h2>
            <EducationCenter />
          </div>
        )}

        {/* VIEW SEGMENT: ADMIN PANEL */}
        {activeTab === 'adminPanel' && (
          <div className="space-y-6">
            <AdminDashboard 
              userId={currentUser.id} 
              showMessage={showToast} 
              onBack={() => setActiveTab('overview')}
            />
          </div>
        )}

      </main>

    </div>
  );
}
