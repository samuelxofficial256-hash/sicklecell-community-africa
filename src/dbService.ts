/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  PatientProfile,
  Doctor,
  Hospital,
  Appointment,
  Medication,
  PainCrisis,
  UserSession,
  HydrationLog,
  MoodLog,
  SleepLog,
  SyncOutboxItem
} from './types';

// Read values from build-time Vite secrets
const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

let supabaseClient: SupabaseClient | null = null;
if (isSupabaseConfigured) {
  try {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
  } catch (e) {
    console.error('Failed to initialize Supabase client:', e);
  }
}

// SQL helper instruction for the user to copy
export const SUPABASE_SQL_SCHEMA = `-- 1. Create Patient Profiles
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL,
  date_of_birth DATE,
  gender TEXT,
  country TEXT,
  blood_group TEXT,
  genotype TEXT,
  emergency_contacts JSONB DEFAULT '[]'::jsonb
);

-- 2. Create Doctors
CREATE TABLE IF NOT EXISTS doctors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  name TEXT NOT NULL,
  specialty TEXT,
  hospital_name TEXT,
  phone TEXT,
  email TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create Hospitals
CREATE TABLE IF NOT EXISTS hospitals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  contact_number TEXT,
  emergency_contact_info TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create Appointments
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  date_time TIMESTAMP WITH TIME ZONE NOT NULL,
  doctor_id UUID REFERENCES doctors ON DELETE SET NULL,
  hospital_id UUID REFERENCES hospitals ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create Medications
CREATE TABLE IF NOT EXISTS medications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  name TEXT NOT NULL,
  dosage TEXT,
  frequency TEXT,
  start_date DATE,
  end_date DATE,
  reminders JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Create Pain Crises
CREATE TABLE IF NOT EXISTS pain_crises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  pain_score INT CHECK (pain_score >= 1 AND pain_score <= 10),
  symptoms JSONB DEFAULT '[]'::jsonb,
  trigger_factors JSONB DEFAULT '[]'::jsonb,
  date_time TIMESTAMP WITH TIME ZONE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Create Hydration Logs
CREATE TABLE IF NOT EXISTS hydration_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  amount_ml INT NOT NULL,
  goal_ml INT NOT NULL DEFAULT 3500,
  date_time TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Create Mood Logs
CREATE TABLE IF NOT EXISTS mood_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  score INT NOT NULL CHECK (score >= 1 AND score <= 5),
  notes TEXT,
  date_time TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Create Sleep Logs
CREATE TABLE IF NOT EXISTS sleep_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  duration_hours FLOAT NOT NULL,
  quality TEXT NOT NULL,
  notes TEXT,
  date_time TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE hospitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE pain_crises ENABLE ROW LEVEL SECURITY;
ALTER TABLE hydration_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE mood_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sleep_logs ENABLE ROW LEVEL SECURITY;

-- Create Row-Level Security Policies
CREATE POLICY "Users can manage their own profile" ON profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "Users can manage their own doctors" ON doctors FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own hospitals" ON hospitals FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own appointments" ON appointments FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own medications" ON medications FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own pain crises" ON pain_crises FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own hydration" ON hydration_logs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own mood" ON mood_logs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own sleep" ON sleep_logs FOR ALL USING (auth.uid() = user_id);`;

// Pre-populate mock dynamic data to show off UI on initial load
const MOCK_PATIENT: PatientProfile = {
  id: 'patient-af-001',
  fullName: 'Kofi Mensah',
  dateOfBirth: '1998-05-15',
  gender: 'Male',
  country: 'Ghana',
  bloodGroup: 'O+',
  genotype: 'SS',
  emergencyContacts: [
    {
      id: 'contact-01',
      name: 'Abena Mensah',
      relationship: 'Mother',
      phone: '+233 24 123 4567',
      isPrimary: true,
    },
    {
      id: 'contact-02',
      name: 'Dr. Kwame Appiah',
      relationship: 'Primary Caregiver',
      phone: '+233 20 987 6543',
      isPrimary: false,
    }
  ]
};

const MOCK_DOCTORS: Doctor[] = [
  {
    id: 'doc-001',
    userId: 'patient-af-001',
    name: 'Dr. Ellen Ngozi',
    specialty: 'Hematologist (Sickle Cell Specialist)',
    hospitalName: 'Accra General Hospital',
    phone: '+233 55 432 1098',
    email: 'ellen.ngozi@accrageneral.org',
    notes: 'Primary sickle cell clinician. Available for crises guidance and hydroxyurea dosage adjustments.'
  },
  {
    id: 'doc-002',
    userId: 'patient-af-001',
    name: 'Dr. Samuel Okonjo',
    specialty: 'Pediatrician / Emergency Medicine',
    hospitalName: 'Lagos Medical Center',
    phone: '+234 80 1234 5678',
    email: 's.okonjo@lagosmed.ng',
    notes: 'Handles emergency triage & local referrals.'
  }
];

const MOCK_HOSPITALS: Hospital[] = [
  {
    id: 'hosp-001',
    userId: 'patient-af-001',
    name: 'Accra General Hospital - Sickle Cell Unit',
    address: 'Feather Street, Accra, Ghana',
    contactNumber: '+233 30 223 4567',
    emergencyContactInfo: 'Emergency Hotlines: +233 30 223 4599 (Direct Sickle Cell Crisis Ward)'
  },
  {
    id: 'hosp-002',
    userId: 'patient-af-001',
    name: 'Lagos University Teaching Hospital (LUTH)',
    address: 'Ishaga Rd, Idi-Araba, Surulere, Lagos, Nigeria',
    contactNumber: '+243 1 2714400',
    emergencyContactInfo: '24/7 Crisis Response: Extension 409'
  }
];

const MOCK_APPOINTMENTS: Appointment[] = [
  {
    id: 'appt-001',
    userId: 'patient-af-001',
    dateTime: '2026-06-15T10:00:00.000Z',
    doctorId: 'doc-001',
    hospitalId: 'hosp-001',
    notes: 'Routine 3-month hematology follow-up review. Bring recent blood count results.'
  },
  {
    id: 'appt-002',
    userId: 'patient-af-001',
    dateTime: '2026-07-02T14:30:00.000Z',
    doctorId: 'doc-002',
    hospitalId: 'hosp-002',
    notes: 'General checkup and prescription refill.'
  }
];

const MOCK_MEDICATIONS: Medication[] = [
  {
    id: 'med-001',
    userId: 'patient-af-001',
    name: 'Hydroxyurea',
    dosage: '1000 mg (2 Capsules)',
    frequency: 'Once daily',
    startDate: '2025-01-01',
    endDate: '2026-12-31',
    reminders: ['08:00']
  },
  {
    id: 'med-002',
    userId: 'patient-af-001',
    name: 'Folic Acid',
    dosage: '5 mg',
    frequency: 'Once daily',
    startDate: '2025-01-01',
    endDate: '2026-12-31',
    reminders: ['08:00']
  },
  {
    id: 'med-003',
    userId: 'patient-af-001',
    name: 'Artesunate/Amodiaquine',
    dosage: '1 tablet',
    frequency: 'As prescribed (Routine malaria prophylaxis)',
    startDate: '2026-05-10',
    endDate: '2026-06-10',
    reminders: ['12:00']
  }
];

const MOCK_CRISES: PainCrisis[] = [
  {
    id: 'crisis-001',
    userId: 'patient-af-001',
    painScore: 7,
    symptoms: ['Lower back pain', 'Leg joint throbbing', 'Fatigue'],
    triggerFactors: ['Sudden temperature drop', 'Dehydration after football matches'],
    dateTime: '2026-05-20T18:00:00.000Z',
    notes: 'Felt highly intense lower spinal and knee throbbing. Rehydrated and took oral paracetamol + warm packs. Pain reduced to 2 after 4 hours.'
  },
  {
    id: 'crisis-002',
    userId: 'patient-af-001',
    painScore: 4,
    symptoms: ['Shoulder stiffness', 'Mild localized chest discomfort'],
    triggerFactors: ['Exam stress', 'Poor sleep pattern'],
    dateTime: '2026-05-28T07:15:00.000Z',
    notes: 'Mild aches before heading to work/school. Took copious warm soup and rested.'
  }
];

const MOCK_HYDRATION: HydrationLog[] = [
  {
    id: 'hyd-001',
    userId: 'patient-af-001',
    amountMl: 2500,
    goalMl: 3500,
    dateTime: new Date(Date.now() - 3600000 * 2).toISOString() // 2 hrs ago
  },
  {
    id: 'hyd-002',
    userId: 'patient-af-001',
    amountMl: 3800,
    goalMl: 3500,
    dateTime: new Date(Date.now() - 86400000).toISOString() // yesterday
  },
  {
    id: 'hyd-003',
    userId: 'patient-af-001',
    amountMl: 3100,
    goalMl: 3500,
    dateTime: new Date(Date.now() - 86400000 * 2).toISOString() // 2 days ago
  },
  {
    id: 'hyd-004',
    userId: 'patient-af-001',
    amountMl: 2000,
    goalMl: 3500,
    dateTime: new Date(Date.now() - 86400000 * 3).toISOString() // 3 days ago
  }
];

const MOCK_MOODS: MoodLog[] = [
  {
    id: 'mood-001',
    userId: 'patient-af-001',
    score: 4, // Good
    notes: 'Feeling energetic and fully hydrated today!',
    dateTime: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: 'mood-002',
    userId: 'patient-af-001',
    score: 2, // Bad
    notes: 'Local back stiffness starting; need extra fluids.',
    dateTime: new Date(Date.now() - 86400000 - 3600000).toISOString()
  },
  {
    id: 'mood-003',
    userId: 'patient-af-001',
    score: 5, // Great
    notes: 'Excellent rest, full workout with hydration pacing.',
    dateTime: new Date(Date.now() - 86400000 * 2).toISOString()
  }
];

const MOCK_SLEEP: SleepLog[] = [
  {
    id: 'sleep-001',
    userId: 'patient-af-001',
    durationHours: 8,
    quality: 'Good',
    notes: 'Woke refreshed, minimal bone tightness.',
    dateTime: new Date().toISOString()
  },
  {
    id: 'sleep-002',
    userId: 'patient-af-001',
    durationHours: 5.5,
    quality: 'Poor',
    notes: 'Ache in elbows woke me up twice.',
    dateTime: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: 'sleep-003',
    userId: 'patient-af-001',
    durationHours: 7.5,
    quality: 'Excellent',
    notes: 'Extremely deep sleep under warming sheets.',
    dateTime: new Date(Date.now() - 86400000 * 2).toISOString()
  }
];

// LocalStore Keys prefix
const KEY_PREFIX = 'scca_';

function generateUuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function loadSandboxData<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(KEY_PREFIX + key);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error(`Error loading key ${key}`, e);
  }
  return defaultValue;
}

function saveSandboxData<T>(key: string, value: T): void {
  try {
    localStorage.setItem(KEY_PREFIX + key, JSON.stringify(value));
  } catch (e) {
    console.error(`Error saving key ${key}`, e);
  }
}

// Ensure sandbox local database is populated with some beautiful initial mock data
if (!localStorage.getItem(KEY_PREFIX + 'initialized')) {
  saveSandboxData('profiles', [MOCK_PATIENT]);
  saveSandboxData('doctors', MOCK_DOCTORS);
  saveSandboxData('hospitals', MOCK_HOSPITALS);
  saveSandboxData('appointments', MOCK_APPOINTMENTS);
  saveSandboxData('medications', MOCK_MEDICATIONS);
  saveSandboxData('crises', MOCK_CRISES);
  saveSandboxData('hydration_logs', MOCK_HYDRATION);
  saveSandboxData('mood_logs', MOCK_MOODS);
  saveSandboxData('sleep_logs', MOCK_SLEEP);
  
  // Pre-seed some default sandbox authentication credits
  saveSandboxData('users', [{ email: 'samuelxofficial256@gmail.com', password: 'password123', id: 'patient-af-001' }]);
  saveSandboxData('active_user', { id: 'patient-af-001', email: 'samuelxofficial256@gmail.com', fullName: 'Kofi Mensah' });
  localStorage.setItem(KEY_PREFIX + 'initialized', 'true');
}

/**
 * DATABASE OPERATIONS ADAPTER
 */
export const dbService = {
  // Config state
  isSupabase: () => isSupabaseConfigured && supabaseClient !== null,

  // Authentication Mock + Real
  getAuthenticatedUser: async (): Promise<UserSession> => {
    if (dbService.isSupabase() && supabaseClient) {
      const { data: { user }, error } = await supabaseClient.auth.getUser();
      if (user && !error) {
        // Fetch or create profile
        const { data: profile } = await supabaseClient
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single();

        return {
          user: {
            id: user.id,
            email: user.email || '',
            fullName: profile?.full_name || user.user_metadata?.fullName || 'African Warrior',
          },
          sessionMode: 'supabase'
        };
      }
    }

    // Default Sandbox user state
    const active = loadSandboxData<{ id: string; email: string; fullName: string } | null>('active_user', null);
    return {
      user: active ? { id: active.id, email: active.email, fullName: active.fullName } : null,
      sessionMode: 'sandbox'
    };
  },

  signUp: async (email: string, password: string, fullName: string): Promise<{ success: boolean; message: string; user?: any }> => {
    const safeEmail = email.toLowerCase().trim();
    if (dbService.isSupabase() && supabaseClient) {
      const { data, error } = await supabaseClient.auth.signUp({
        email: safeEmail,
        password,
        options: {
          data: {
            fullName: fullName,
          }
        }
      });
      if (error) throw error;
      if (data.user) {
        // Automatically insert empty profiles row in Postgres
        const { error: profileError } = await supabaseClient
          .from('profiles')
          .insert({
            id: data.user.id,
            full_name: fullName,
            country: 'Nigeria',
            blood_group: 'O+',
            genotype: 'SS',
            date_of_birth: '2000-01-01',
            gender: 'Prefer not to say',
            emergency_contacts: []
          });
        if (profileError) console.error('Error auto-creating PG profile row:', profileError);

        return { success: true, message: 'Check your email for confirmation link or proceed!', user: data.user };
      }
    }

    // Sandbox signup
    const users = loadSandboxData<any[]>('users', []);
    if (users.find(u => u.email === safeEmail)) {
      throw new Error('Account with this email already exists.');
    }

    const newId = `user-${Date.now()}`;
    const newUser = { id: newId, email: safeEmail, password };
    users.push(newUser);
    saveSandboxData('users', users);

    // Initial Patient profile for them
    const profiles = loadSandboxData<PatientProfile[]>('profiles', []);
    const newProfile: PatientProfile = {
      id: newId,
      fullName,
      dateOfBirth: '2000-01-01',
      gender: 'Prefer not to say',
      country: 'Nigeria',
      bloodGroup: 'Unknown',
      genotype: 'SS',
      emergencyContacts: []
    };
    profiles.push(newProfile);
    saveSandboxData('profiles', profiles);

    // Auto login
    saveSandboxData('active_user', { id: newId, email: safeEmail, fullName });
    return { success: true, message: 'Signup successful in Sandbox mode!', user: { id: newId, email: safeEmail } };
  },

  signIn: async (email: string, password: string): Promise<{ success: boolean; user: any }> => {
    const safeEmail = email.toLowerCase().trim();
    if (dbService.isSupabase() && supabaseClient) {
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: safeEmail,
        password,
      });
      if (error) throw error;
      return { success: true, user: data.user };
    }

    // Sandbox login
    const users = loadSandboxData<any[]>('users', []);
    const matching = users.find(u => u.email === safeEmail && u.password === password);
    if (!matching) {
      throw new Error('Invalid email or password.');
    }

    // Load full name
    const profiles = loadSandboxData<PatientProfile[]>('profiles', []);
    const profile = profiles.find(p => p.id === matching.id);
    const fullName = profile ? profile.fullName : 'African Warrior';

    saveSandboxData('active_user', { id: matching.id, email: matching.email, fullName });
    return { success: true, user: { id: matching.id, email: matching.email } };
  },

  resetPassword: async (email: string): Promise<{ success: boolean; message: string }> => {
    if (dbService.isSupabase() && supabaseClient) {
      const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin,
      });
      if (error) throw error;
      return { success: true, message: 'Password reset link sent to your email.' };
    }

    // Sandbox password reset simulation
    const users = loadSandboxData<any[]>('users', []);
    const matching = users.find(u => u.email === email.toLowerCase().trim());
    if (!matching) {
      throw new Error('No user register with this email in Sandbox.');
    }
    return { success: true, message: `[Sandbox Mode] Simulation: Password reset code would be sent to ${email}. Temporarily your password is: "${matching.password}"` };
  },

  signOut: async (): Promise<void> => {
    if (dbService.isSupabase() && supabaseClient) {
      await supabaseClient.auth.signOut();
    }
    saveSandboxData('active_user', null);
  },

  // PATIENT PROFILES
  getPatientProfile: async (userId: string): Promise<PatientProfile | null> => {
    const localProfile = loadSandboxData<PatientProfile[]>('profiles', []).find(p => p.id === userId) || null;
    
    if (dbService.isSupabase() && supabaseClient) {
      try {
        const { data, error } = await supabaseClient
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (error) throw error;
        if (data) {
          const fetched: PatientProfile = {
            id: data.id,
            fullName: data.full_name,
            dateOfBirth: data.date_of_birth || '',
            gender: (data.gender as any) || 'Prefer not to say',
            country: data.country || '',
            bloodGroup: (data.blood_group as any) || 'Unknown',
            genotype: (data.genotype as any) || 'Unknown',
            emergencyContacts: Array.isArray(data.emergency_contacts)
              ? data.emergency_contacts
              : [],
          };

          // Cache locally
          const profiles = loadSandboxData<PatientProfile[]>('profiles', []);
          const idx = profiles.findIndex(p => p.id === userId);
          if (idx !== -1) {
            profiles[idx] = fetched;
          } else {
            profiles.push(fetched);
          }
          saveSandboxData('profiles', profiles);

          return fetched;
        }
      } catch (e) {
        console.warn('Failed to query Supabase profile, falling back to local cache:', e);
      }
    }

    return localProfile;
  },

  updatePatientProfile: async (userId: string, profile: Omit<PatientProfile, 'id'>): Promise<void> => {
    const updatedModel: PatientProfile = { id: userId, ...profile };
    
    // Save to local cache instantly
    const profiles = loadSandboxData<PatientProfile[]>('profiles', []);
    const idx = profiles.findIndex(p => p.id === userId);
    if (idx !== -1) {
      profiles[idx] = updatedModel;
    } else {
      profiles.push(updatedModel);
    }
    saveSandboxData('profiles', profiles);

    // Sync state
    const pgPayload = {
      full_name: profile.fullName,
      date_of_birth: profile.dateOfBirth,
      gender: profile.gender,
      country: profile.country,
      blood_group: profile.bloodGroup,
      genotype: profile.genotype,
      emergency_contacts: profile.emergencyContacts
    };

    await dbService.runOfflineMutate('profiles', 'update', userId, pgPayload);

    // Sync local active user name too
    const active = loadSandboxData<any>('active_user', null);
    if (active && active.id === userId) {
      active.fullName = profile.fullName;
      saveSandboxData('active_user', active);
    }
  },

  // DOCTOR MANAGEMENT
  getDoctors: async (userId: string): Promise<Doctor[]> => {
    const local = loadSandboxData<Doctor[]>('doctors', []).filter(d => d.userId === userId);
    
    if (dbService.isSupabase() && supabaseClient) {
      try {
        const { data, error } = await supabaseClient
          .from('doctors')
          .select('*')
          .eq('user_id', userId)
          .order('name', { ascending: true });

        if (error) throw error;
        const fetched = (data || []).map(row => ({
          id: row.id,
          userId: row.user_id,
          name: row.name,
          specialty: row.specialty,
          hospitalName: row.hospital_name,
          phone: row.phone,
          email: row.email,
          notes: row.notes,
          createdAt: row.created_at
        }));

        const others = loadSandboxData<Doctor[]>('doctors', []).filter(d => d.userId !== userId);
        saveSandboxData('doctors', [...others, ...fetched]);
        return fetched;
      } catch (e) {
        console.warn('Network issue fetching doctors, using offline backup:', e);
      }
    }
    return local;
  },

  saveDoctor: async (doc: Omit<Doctor, 'id'>, existingId?: string): Promise<Doctor> => {
    const id = existingId || generateUuid();
    const item: Doctor = { id, ...doc };

    // Update cache instantly
    const doctors = loadSandboxData<Doctor[]>('doctors', []);
    if (existingId) {
      const idx = doctors.findIndex(d => d.id === existingId);
      if (idx !== -1) doctors[idx] = item;
    } else {
      doctors.push(item);
    }
    saveSandboxData('doctors', doctors);

    const pgPayload = {
      user_id: doc.userId,
      name: doc.name,
      specialty: doc.specialty,
      hospital_name: doc.hospitalName,
      phone: doc.phone,
      email: doc.email,
      notes: doc.notes
    };

    await dbService.runOfflineMutate('doctors', existingId ? 'update' : 'insert', id, pgPayload);
    return item;
  },

  deleteDoctor: async (id: string): Promise<void> => {
    const doctors = loadSandboxData<Doctor[]>('doctors', []);
    saveSandboxData('doctors', doctors.filter(d => d.id !== id));

    await dbService.runOfflineMutate('doctors', 'delete', id, {});
  },

  // HOSPITAL MANAGEMENT
  getHospitals: async (userId: string): Promise<Hospital[]> => {
    const local = loadSandboxData<Hospital[]>('hospitals', []).filter(h => h.userId === userId);
    
    if (dbService.isSupabase() && supabaseClient) {
      try {
        const { data, error } = await supabaseClient
          .from('hospitals')
          .select('*')
          .eq('user_id', userId)
          .order('name', { ascending: true });

        if (error) throw error;
        const fetched = (data || []).map(row => ({
          id: row.id,
          userId: row.user_id,
          name: row.name,
          address: row.address,
          contactNumber: row.contact_number,
          emergencyContactInfo: row.emergency_contact_info,
          createdAt: row.created_at
        }));

        const others = loadSandboxData<Hospital[]>('hospitals', []).filter(h => h.userId !== userId);
        saveSandboxData('hospitals', [...others, ...fetched]);
        return fetched;
      } catch (e) {
        console.warn('Network issue fetching hospitals, using offline backup:', e);
      }
    }
    return local;
  },

  saveHospital: async (hosp: Omit<Hospital, 'id'>, existingId?: string): Promise<Hospital> => {
    const id = existingId || generateUuid();
    const item: Hospital = { id, ...hosp };

    const hospitals = loadSandboxData<Hospital[]>('hospitals', []);
    if (existingId) {
      const idx = hospitals.findIndex(h => h.id === existingId);
      if (idx !== -1) hospitals[idx] = item;
    } else {
      hospitals.push(item);
    }
    saveSandboxData('hospitals', hospitals);

    const pgPayload = {
      user_id: hosp.userId,
      name: hosp.name,
      address: hosp.address,
      contact_number: hosp.contactNumber,
      emergency_contact_info: hosp.emergencyContactInfo
    };

    await dbService.runOfflineMutate('hospitals', existingId ? 'update' : 'insert', id, pgPayload);
    return item;
  },

  deleteHospital: async (id: string): Promise<void> => {
    const hospitals = loadSandboxData<Hospital[]>('hospitals', []);
    saveSandboxData('hospitals', hospitals.filter(h => h.id !== id));

    await dbService.runOfflineMutate('hospitals', 'delete', id, {});
  },

  // APPOINTMENT MANAGEMENT
  getAppointments: async (userId: string): Promise<Appointment[]> => {
    const local = loadSandboxData<Appointment[]>('appointments', []).filter(a => a.userId === userId);
    
    if (dbService.isSupabase() && supabaseClient) {
      try {
        const { data, error } = await supabaseClient
          .from('appointments')
          .select('*')
          .eq('user_id', userId)
          .order('date_time', { ascending: true });

        if (error) throw error;
        const fetched = (data || []).map(row => ({
          id: row.id,
          userId: row.user_id,
          dateTime: row.date_time,
          doctorId: row.doctor_id || '',
          hospitalId: row.hospital_id || '',
          notes: row.notes,
          createdAt: row.created_at
        }));

        const others = loadSandboxData<Appointment[]>('appointments', []).filter(a => a.userId !== userId);
        saveSandboxData('appointments', [...others, ...fetched]);
        return fetched;
      } catch (e) {
        console.warn('Network issue fetching appointments, using offline backup:', e);
      }
    }
    return local.sort((a,b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());
  },

  saveAppointment: async (appt: Omit<Appointment, 'id'>, existingId?: string): Promise<Appointment> => {
    const id = existingId || generateUuid();
    const item: Appointment = { id, ...appt };

    const appointments = loadSandboxData<Appointment[]>('appointments', []);
    if (existingId) {
      const idx = appointments.findIndex(a => a.id === existingId);
      if (idx !== -1) appointments[idx] = item;
    } else {
      appointments.push(item);
    }
    saveSandboxData('appointments', appointments);

    const pgPayload = {
      user_id: appt.userId,
      date_time: appt.dateTime,
      doctor_id: appt.doctorId || null,
      hospital_id: appt.hospitalId || null,
      notes: appt.notes
    };

    await dbService.runOfflineMutate('appointments', existingId ? 'update' : 'insert', id, pgPayload);
    return item;
  },

  deleteAppointment: async (id: string): Promise<void> => {
    const appointments = loadSandboxData<Appointment[]>('appointments', []);
    saveSandboxData('appointments', appointments.filter(a => a.id !== id));

    await dbService.runOfflineMutate('appointments', 'delete', id, {});
  },

  // MEDICATION MANAGEMENT
  getMedications: async (userId: string): Promise<Medication[]> => {
    const local = loadSandboxData<Medication[]>('medications', []).filter(m => m.userId === userId);
    
    if (dbService.isSupabase() && supabaseClient) {
      try {
        const { data, error } = await supabaseClient
          .from('medications')
          .select('*')
          .eq('user_id', userId)
          .order('name', { ascending: true });

        if (error) throw error;
        const fetched = (data || []).map(row => ({
          id: row.id,
          userId: row.user_id,
          name: row.name,
          dosage: row.dosage,
          frequency: row.frequency,
          startDate: row.start_date,
          endDate: row.end_date,
          reminders: Array.isArray(row.reminders) ? row.reminders : [],
          createdAt: row.created_at
        }));

        const others = loadSandboxData<Medication[]>('medications', []).filter(m => m.userId !== userId);
        saveSandboxData('medications', [...others, ...fetched]);
        return fetched;
      } catch (e) {
        console.warn('Network issue fetching medications, using offline backup:', e);
      }
    }
    return local;
  },

  saveMedication: async (med: Omit<Medication, 'id'>, existingId?: string): Promise<Medication> => {
    const id = existingId || generateUuid();
    const item: Medication = { id, ...med };

    const medications = loadSandboxData<Medication[]>('medications', []);
    if (existingId) {
      const idx = medications.findIndex(m => m.id === existingId);
      if (idx !== -1) medications[idx] = item;
    } else {
      medications.push(item);
    }
    saveSandboxData('medications', medications);

    const pgPayload = {
      user_id: med.userId,
      name: med.name,
      dosage: med.dosage,
      frequency: med.frequency,
      start_date: med.startDate,
      end_date: med.endDate,
      reminders: med.reminders
    };

    await dbService.runOfflineMutate('medications', existingId ? 'update' : 'insert', id, pgPayload);
    return item;
  },

  deleteMedication: async (id: string): Promise<void> => {
    const medications = loadSandboxData<Medication[]>('medications', []);
    saveSandboxData('medications', medications.filter(m => m.id !== id));

    await dbService.runOfflineMutate('medications', 'delete', id, {});
  },

  // PAIN CRISIS TRACKER
  getPainCrises: async (userId: string): Promise<PainCrisis[]> => {
    const local = loadSandboxData<PainCrisis[]>('crises', []).filter(c => c.userId === userId);
    
    if (dbService.isSupabase() && supabaseClient) {
      try {
        const { data, error } = await supabaseClient
          .from('pain_crises')
          .select('*')
          .eq('user_id', userId)
          .order('date_time', { ascending: false });

        if (error) throw error;
        const fetched = (data || []).map(row => ({
          id: row.id,
          userId: row.user_id,
          painScore: row.pain_score,
          symptoms: Array.isArray(row.symptoms) ? row.symptoms : [],
          triggerFactors: Array.isArray(row.trigger_factors) ? row.trigger_factors : [],
          dateTime: row.date_time,
          notes: row.notes,
          createdAt: row.created_at
        }));

        const others = loadSandboxData<PainCrisis[]>('crises', []).filter(c => c.userId !== userId);
        saveSandboxData('crises', [...others, ...fetched]);
        return fetched;
      } catch (e) {
        console.warn('Network issue fetching pain crises, using offline backup:', e);
      }
    }
    return local.sort((a,b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());
  },

  savePainCrisis: async (crisis: Omit<PainCrisis, 'id'>, existingId?: string): Promise<PainCrisis> => {
    const id = existingId || generateUuid();
    const item: PainCrisis = { id, ...crisis };

    const crises = loadSandboxData<PainCrisis[]>('crises', []);
    if (existingId) {
      const idx = crises.findIndex(c => c.id === existingId);
      if (idx !== -1) crises[idx] = item;
    } else {
      crises.push(item);
    }
    saveSandboxData('crises', crises);

    const pgPayload = {
      user_id: crisis.userId,
      pain_score: crisis.painScore,
      symptoms: crisis.symptoms,
      trigger_factors: crisis.triggerFactors,
      date_time: crisis.dateTime,
      notes: crisis.notes
    };

    await dbService.runOfflineMutate('pain_crises', existingId ? 'update' : 'insert', id, pgPayload);
    return item;
  },

  deletePainCrisis: async (id: string): Promise<void> => {
    const crises = loadSandboxData<PainCrisis[]>('crises', []);
    saveSandboxData('crises', crises.filter(c => c.id !== id));

    await dbService.runOfflineMutate('pain_crises', 'delete', id, {});
  },

  // ==========================================
  // HYDRATION TRACKING SERVICE
  // ==========================================
  getHydrationLogs: async (userId: string): Promise<HydrationLog[]> => {
    const local = loadSandboxData<HydrationLog[]>('hydration_logs', []).filter(h => h.userId === userId);
    
    if (dbService.isSupabase() && supabaseClient) {
      try {
        const { data, error } = await supabaseClient
          .from('hydration_logs')
          .select('*')
          .eq('user_id', userId)
          .order('date_time', { ascending: false });

        if (error) throw error;
        const fetched = (data || []).map(row => ({
          id: row.id,
          userId: row.user_id,
          amountMl: row.amount_ml,
          goalMl: row.goal_ml,
          dateTime: row.date_time,
          createdAt: row.created_at
        }));

        const others = loadSandboxData<HydrationLog[]>('hydration_logs', []).filter(h => h.userId !== userId);
        saveSandboxData('hydration_logs', [...others, ...fetched]);
        return fetched;
      } catch (e) {
        console.warn('Failed to query Supabase hydration, returning cache:', e);
      }
    }
    return local.sort((a,b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());
  },

  saveHydrationLog: async (log: Omit<HydrationLog, 'id'>, existingId?: string): Promise<HydrationLog> => {
    const id = existingId || generateUuid();
    const item: HydrationLog = { id, ...log };

    const logs = loadSandboxData<HydrationLog[]>('hydration_logs', []);
    if (existingId) {
      const idx = logs.findIndex(h => h.id === existingId);
      if (idx !== -1) logs[idx] = item;
    } else {
      logs.push(item);
    }
    saveSandboxData('hydration_logs', logs);

    const pgPayload = {
      user_id: log.userId,
      amount_ml: log.amountMl,
      goal_ml: log.goalMl,
      date_time: log.dateTime
    };

    await dbService.runOfflineMutate('hydration_logs', existingId ? 'update' : 'insert', id, pgPayload);
    return item;
  },

  deleteHydrationLog: async (id: string): Promise<void> => {
    const logs = loadSandboxData<HydrationLog[]>('hydration_logs', []);
    saveSandboxData('hydration_logs', logs.filter(h => h.id !== id));

    await dbService.runOfflineMutate('hydration_logs', 'delete', id, {});
  },

  // ==========================================
  // MOOD LOGGING SERVICE
  // ==========================================
  getMoodLogs: async (userId: string): Promise<MoodLog[]> => {
    const local = loadSandboxData<MoodLog[]>('mood_logs', []).filter(m => m.userId === userId);
    
    if (dbService.isSupabase() && supabaseClient) {
      try {
        const { data, error } = await supabaseClient
          .from('mood_logs')
          .select('*')
          .eq('user_id', userId)
          .order('date_time', { ascending: false });

        if (error) throw error;
        const fetched = (data || []).map(row => ({
          id: row.id,
          userId: row.user_id,
          score: row.score,
          notes: row.notes,
          dateTime: row.date_time,
          createdAt: row.created_at
        }));

        const others = loadSandboxData<MoodLog[]>('mood_logs', []).filter(m => m.userId !== userId);
        saveSandboxData('mood_logs', [...others, ...fetched]);
        return fetched;
      } catch (e) {
        console.warn('Failed to query Supabase mood logs, returning cache:', e);
      }
    }
    return local.sort((a,b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());
  },

  saveMoodLog: async (log: Omit<MoodLog, 'id'>, existingId?: string): Promise<MoodLog> => {
    const id = existingId || generateUuid();
    const item: MoodLog = { id, ...log };

    const logs = loadSandboxData<MoodLog[]>('mood_logs', []);
    if (existingId) {
      const idx = logs.findIndex(m => m.id === existingId);
      if (idx !== -1) logs[idx] = item;
    } else {
      logs.push(item);
    }
    saveSandboxData('mood_logs', logs);

    const pgPayload = {
      user_id: log.userId,
      score: log.score,
      notes: log.notes,
      date_time: log.dateTime
    };

    await dbService.runOfflineMutate('mood_logs', existingId ? 'update' : 'insert', id, pgPayload);
    return item;
  },

  deleteMoodLog: async (id: string): Promise<void> => {
    const logs = loadSandboxData<MoodLog[]>('mood_logs', []);
    saveSandboxData('mood_logs', logs.filter(m => m.id !== id));

    await dbService.runOfflineMutate('mood_logs', 'delete', id, {});
  },

  // ==========================================
  // SLEEP TRACKING SERVICE
  // ==========================================
  getSleepLogs: async (userId: string): Promise<SleepLog[]> => {
    const local = loadSandboxData<SleepLog[]>('sleep_logs', []).filter(s => s.userId === userId);
    
    if (dbService.isSupabase() && supabaseClient) {
      try {
        const { data, error } = await supabaseClient
          .from('sleep_logs')
          .select('*')
          .eq('user_id', userId)
          .order('date_time', { ascending: false });

        if (error) throw error;
        const fetched = (data || []).map(row => ({
          id: row.id,
          userId: row.user_id,
          durationHours: row.duration_hours,
          quality: row.quality as any,
          notes: row.notes,
          dateTime: row.date_time,
          createdAt: row.created_at
        }));

        const others = loadSandboxData<SleepLog[]>('sleep_logs', []).filter(s => s.userId !== userId);
        saveSandboxData('sleep_logs', [...others, ...fetched]);
        return fetched;
      } catch (e) {
        console.warn('Failed to query Supabase sleep logs, returning cache:', e);
      }
    }
    return local.sort((a,b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());
  },

  saveSleepLog: async (log: Omit<SleepLog, 'id'>, existingId?: string): Promise<SleepLog> => {
    const id = existingId || generateUuid();
    const item: SleepLog = { id, ...log };

    const logs = loadSandboxData<SleepLog[]>('sleep_logs', []);
    if (existingId) {
      const idx = logs.findIndex(s => s.id === existingId);
      if (idx !== -1) logs[idx] = item;
    } else {
      logs.push(item);
    }
    saveSandboxData('sleep_logs', logs);

    const pgPayload = {
      user_id: log.userId,
      duration_hours: log.durationHours,
      quality: log.quality,
      notes: log.notes,
      date_time: log.dateTime
    };

    await dbService.runOfflineMutate('sleep_logs', existingId ? 'update' : 'insert', id, pgPayload);
    return item;
  },

  deleteSleepLog: async (id: string): Promise<void> => {
    const logs = loadSandboxData<SleepLog[]>('sleep_logs', []);
    saveSandboxData('sleep_logs', logs.filter(s => s.id !== id));

    await dbService.runOfflineMutate('sleep_logs', 'delete', id, {});
  },

  // ==========================================
  // SYNC OUTBOX ENGINE & CONCURRENCY SYSTEM
  // ==========================================
  getOutbox: (): SyncOutboxItem[] => {
    return loadSandboxData<SyncOutboxItem[]>('sync_outbox', []);
  },

  saveOutbox: (outbox: SyncOutboxItem[]): void => {
    saveSandboxData('sync_outbox', outbox);
  },

  addToOutbox: (item: Omit<SyncOutboxItem, 'id' | 'timestamp'>): void => {
    const outbox = dbService.getOutbox();
    const newItem: SyncOutboxItem = {
      id: `outbox-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      ...item
    };
    outbox.push(newItem);
    dbService.saveOutbox(outbox);
  },

  syncOutbox: async (): Promise<{ successCount: number; failedCount: number }> => {
    if (!dbService.isSupabase() || !supabaseClient) {
      return { successCount: 0, failedCount: 0 };
    }

    const outbox = dbService.getOutbox();
    if (outbox.length === 0) return { successCount: 0, failedCount: 0 };

    const remaining: SyncOutboxItem[] = [];
    let successCount = 0;
    let failedCount = 0;

    for (const item of outbox) {
      try {
        if (item.action === 'insert') {
          const { error } = await supabaseClient
            .from(item.table)
            .insert({ ...item.payload, id: item.itemId });
          if (error) throw error;
        } else if (item.action === 'update' && item.itemId) {
          const { error } = await supabaseClient
            .from(item.table)
            .update(item.payload)
            .eq('id', item.itemId);
          if (error) throw error;
        } else if (item.action === 'delete' && item.itemId) {
          const { error } = await supabaseClient
            .from(item.table)
            .delete()
            .eq('id', item.itemId);
          if (error) throw error;
        }
        successCount++;
      } catch (err) {
        console.error('Failed to sync outbox item:', item, err);
        remaining.push(item);
        failedCount++;
      }
    }

    dbService.saveOutbox(remaining);
    return { successCount, failedCount };
  },

  runOfflineMutate: async (table: string, action: 'insert' | 'update' | 'delete', itemId: string, pgPayload: any): Promise<void> => {
    if (!dbService.isSupabase() || !supabaseClient) return;
    
    if (navigator.onLine) {
      try {
        let error = null;
        if (action === 'insert') {
          const { error: err } = await supabaseClient.from(table).insert({ ...pgPayload, id: itemId });
          error = err;
        } else if (action === 'update') {
          const { error: err } = await supabaseClient.from(table).update(pgPayload).eq('id', itemId);
          error = err;
        } else if (action === 'delete') {
          const { error: err } = await supabaseClient.from(table).delete().eq('id', itemId);
          error = err;
        }
        
        if (!error) return; // Successfully sent to Supabase direct!
        console.warn(`Direct Supabase write failed on table "${table}", queuing in offline outbox. Error: `, error);
      } catch (err) {
        console.warn(`Network offline error on write table "${table}", queuing to outbox.`, err);
      }
    } else {
      console.log(`Working offline. Enqueued action "${action}" on table "${table}" to outbox sync queue.`);
    }

    // Queue in outbox if failed direct or offline
    dbService.addToOutbox({
      table,
      action,
      payload: pgPayload,
      itemId
    });
  },

  // STORAGE MOCK + REAL: Upload avatar/report files
  uploadFile: async (file: File, path: string): Promise<string> => {
    if (dbService.isSupabase() && supabaseClient) {
      const { data, error } = await supabaseClient.storage
        .from('patient-documents')
        .upload(path, file, { cacheControl: '3600', upsert: true });

      if (error) throw error;
      const { data: { publicUrl } } = supabaseClient.storage
        .from('patient-documents')
        .getPublicUrl(data.path);

      return publicUrl;
    }

    // Sandbox uploads
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result as string || 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?q=80&w=2000&auto=format&fit=crop');
      };
      reader.readAsDataURL(file);
    });
  }
};
