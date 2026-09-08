/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Firebase Client SDK Initialization
 * Configured with user's project 'sih-hospital-database-c18e8'
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

export const firebaseConfig = {
  apiKey: "AIzaSyDJI6M9Hv1GUk3p1G4o4yUG6IKoi9yZeE0",
  authDomain: "sih-hospital-database-c18e8.firebaseapp.com",
  projectId: "sih-hospital-database-c18e8",
  storageBucket: "sih-hospital-database-c18e8.firebasestorage.app",
  messagingSenderId: "692404551015",
  appId: "1:692404551015:web:e0eac08b913c217ab243c2",
  measurementId: "G-DYCYPF5CC4"
};

// Initialize Firebase safely (avoid multi-initialization in HMR / reloads)
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firestore Database (default)
export const db = getFirestore(app);

// Initialize Firebase Authentication
export const auth = getAuth(app);
