/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-' | 'Unknown';
export type Genotype = 'SS' | 'SC' | 'CC' | 'AS' | 'AC' | 'AA' | 'Beta-Thalassemia' | 'Unknown';
export type Gender = 'Male' | 'Female' | 'Other' | 'Prefer not to say';

export interface EmergencyContact {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  isPrimary: boolean;
}

export interface PatientProfile {
  id: string;
  fullName: string;
  dateOfBirth: string;
  gender: Gender;
  country: string;
  bloodGroup: BloodGroup;
  genotype: Genotype;
  emergencyContacts: EmergencyContact[];
  createdAt?: string;
}

export interface Doctor {
  id: string;
  userId: string;
  name: string;
  specialty: string;
  hospitalName: string;
  phone: string;
  email: string;
  notes: string;
  createdAt?: string;
}

export interface Hospital {
  id: string;
  userId: string;
  name: string;
  address: string;
  contactNumber: string;
  emergencyContactInfo: string;
  createdAt?: string;
}

export interface Appointment {
  id: string;
  userId: string;
  dateTime: string;
  doctorId: string; // References Doctor.id
  hospitalId: string; // References Hospital.id
  notes: string;
  createdAt?: string;
}

export interface Medication {
  id: string;
  userId: string;
  name: string;
  dosage: string; // e.g. "500mg"
  frequency: string; // e.g. "Once daily", "Every 8 hours"
  startDate: string;
  endDate: string;
  reminders: string[]; // array of times, e.g. ["08:00", "20:00"]
  createdAt?: string;
}

export interface PainCrisis {
  id: string;
  userId: string;
  painScore: number; // 1 to 10
  symptoms: string[]; // e.g. ["Joint pain", "Fatigue"]
  triggerFactors: string[]; // e.g. ["Cold weather", "Dehydration", "Stress"]
  dateTime: string;
  notes: string;
  createdAt?: string;
}

export interface UserSession {
  user: {
    id: string;
    email: string;
    fullName?: string;
  } | null;
  sessionMode: 'supabase' | 'sandbox';
}

export interface HydrationLog {
  id: string;
  userId: string;
  amountMl: number;
  goalMl: number;
  dateTime: string;
  createdAt?: string;
}

export interface MoodLog {
  id: string;
  userId: string;
  score: number; // 1 to 5
  notes?: string;
  dateTime: string;
  createdAt?: string;
}

export interface SleepLog {
  id: string;
  userId: string;
  durationHours: number;
  quality: 'Poor' | 'Fair' | 'Good' | 'Excellent';
  notes?: string;
  dateTime: string;
  createdAt?: string;
}

export interface SyncOutboxItem {
  id: string;
  table: string;
  action: 'insert' | 'update' | 'delete';
  payload: any;
  itemId?: string;
  timestamp: string;
}

// ==========================================
// NEW: COMMUNITY FORUM TYPES
// ==========================================
export type ForumCategory = 'patient' | 'caregiver';

export interface ForumPost {
  id: string;
  userId: string;
  authorName: string;
  title: string;
  content: string;
  category: ForumCategory;
  likes: string[]; // array of user IDs who liked it
  reports: string[]; // array of user IDs who reported it
  isAppropriate: boolean;
  createdAt: string;
  commentCount?: number;
}

export interface ForumComment {
  id: string;
  postId: string;
  userId: string;
  authorName: string;
  content: string;
  reports: string[]; // array of user IDs who reported it
  isAppropriate: boolean;
  createdAt: string;
}

// ==========================================
// NEW: EDUCATION CENTER TYPES
// ==========================================
export type EducationCategory = 'general-disease' | 'nutrition' | 'pain-management' | 'childcare' | 'pregnancy';

export interface EducationArticle {
  id: string;
  title: string;
  category: EducationCategory;
  summary: string;
  content: string; // Markdown or plain text content
  readTime: string; // e.g., "5 min read"
  author: string;
  createdAt: string;
}

// ==========================================
// NEW: AI ASSISTANT TYPES
// ==========================================
export interface AiMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  createdAt: string;
}

export interface AiChatSession {
  id: string;
  userId: string;
  messages: AiMessage[];
  createdAt: string;
}

