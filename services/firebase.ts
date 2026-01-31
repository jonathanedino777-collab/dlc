import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, deleteDoc, doc } from "firebase/firestore";
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

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

const REPORTS_COLLECTION = 'reports';

export const firestoreService = {
  saveReport: async (report: Omit<WeeklyReport, 'id' | 'submittedAt'>) => {
    try {
      const docRef = await addDoc(collection(db, REPORTS_COLLECTION), {
        ...report,
        submittedAt: new Date().toISOString()
      });
      return docRef.id;
    } catch (e: any) {
      console.error("Firestore write error: ", e);
      if (e.code === 'permission-denied') {
        throw new Error('Database is locked. Please contact admin to update Firestore security rules.');
      }
      throw e;
    }
  },

  subscribeToReports: (callback: (reports: WeeklyReport[]) => void, errorCallback?: (error: any) => void) => {
    const q = query(collection(db, REPORTS_COLLECTION), orderBy('submittedAt', 'desc'));
    return onSnapshot(
      q, 
      (querySnapshot) => {
        const reports: WeeklyReport[] = [];
        querySnapshot.forEach((doc) => {
          reports.push({ id: doc.id, ...doc.data() } as WeeklyReport);
        });
        callback(reports);
      },
      (error) => {
        if (errorCallback) errorCallback(error);
      }
    );
  },

  deleteReport: async (id: string) => {
    try {
      await deleteDoc(doc(db, REPORTS_COLLECTION, id));
    } catch (e: any) {
      console.error("Firestore delete error: ", e);
      if (e.code === 'permission-denied') {
        throw new Error('Deletion failed. Database permissions required.');
      }
      throw e;
    }
  }
};