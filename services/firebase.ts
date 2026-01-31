import { initializeApp, getApp, getApps } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  deleteDoc, 
  doc,
  Firestore
} from "firebase/firestore";
import { WeeklyReport } from "../types";

const firebaseConfig = {
  apiKey: "AIzaSyBeqQWtgZuvs92QyJM_uqQWNXFG8o30zSE",
  authDomain: "dlcs-b8f53.firebaseapp.com",
  projectId: "dlcs-b8f53",
  storageBucket: "dlcs-b8f53.firebasestorage.app",
  messagingSenderId: "395079601257",
  appId: "1:395079601257:web:eb1410a2aa3cb1b15be6f8",
  measurementId: "G-PCTDFZYEK5"
};

let app;
let db: Firestore | null = null;

try {
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  db = getFirestore(app);
} catch (error) {
  console.error("Firebase Initialization Critical Error:", error);
}

const REPORTS_COLLECTION = 'reports';

const isPermissionError = (err: any) => {
  if (!err) return false;
  const msg = err.message?.toLowerCase() || '';
  const code = err.code?.toLowerCase() || '';
  return code === 'permission-denied' || msg.includes('permission') || msg.includes('insufficient');
};

export const firestoreService = {
  saveReport: async (report: Omit<WeeklyReport, 'id' | 'submittedAt'>) => {
    if (!db) throw new Error("Database Service Offline");
    
    try {
      const docRef = await addDoc(collection(db, REPORTS_COLLECTION), {
        ...report,
        submittedAt: new Date().toISOString()
      });
      return docRef.id;
    } catch (e: any) {
      console.error("Firestore Write Failed:", e.message);
      if (isPermissionError(e)) {
        throw new Error('PERMISSION_DENIED');
      }
      throw e;
    }
  },

  subscribeToReports: (callback: (reports: WeeklyReport[]) => void, errorCallback?: (error: any) => void) => {
    if (!db) {
      if (errorCallback) errorCallback(new Error("DB_NOT_INIT"));
      return () => {};
    }

    const q = query(collection(db, REPORTS_COLLECTION), orderBy('submittedAt', 'desc'));
    
    return onSnapshot(q, {
      next: (querySnapshot) => {
        const reports: WeeklyReport[] = [];
        querySnapshot.forEach((doc) => {
          reports.push({ id: doc.id, ...doc.data() } as WeeklyReport);
        });
        callback(reports);
      },
      error: (error) => {
        console.error("Firestore Subscription Error:", error.message);
        if (errorCallback) {
          if (isPermissionError(error)) {
            errorCallback(new Error('PERMISSION_DENIED'));
          } else {
            errorCallback(error);
          }
        }
      }
    });
  },

  deleteReport: async (id: string) => {
    if (!db) return;
    try {
      await deleteDoc(doc(db, REPORTS_COLLECTION, id));
    } catch (e) {
      console.error("Delete failed:", e);
    }
  }
};