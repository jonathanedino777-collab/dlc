
import { WeeklyReport } from '../types';

const STORAGE_KEY = 'dl4all_reports';

export const storageService = {
  saveReport: (report: WeeklyReport) => {
    try {
      const reports = storageService.getReports();
      reports.push(report);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
      return reports;
    } catch (e) {
      console.error('Error saving report:', e);
      return [];
    }
  },
  getReports: (): WeeklyReport[] => {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    try {
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error('Failed to parse reports from storage:', e);
      return [];
    }
  },
  saveAllReports: (reports: WeeklyReport[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
  },
  deleteReport: (id: string) => {
    try {
      const reports = storageService.getReports().filter(r => r.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
      return reports;
    } catch (e) {
      console.error('Error deleting report:', e);
      return [];
    }
  },
  // Merges imported reports with local ones, avoiding duplicates
  importReports: (importedJson: string): WeeklyReport[] => {
    try {
      const imported = JSON.parse(importedJson);
      if (!Array.isArray(imported)) return storageService.getReports();
      
      const current = storageService.getReports();
      const currentIds = new Set(current.map(r => r.id));
      
      const newReports = imported.filter(r => r.id && !currentIds.has(r.id));
      const merged = [...current, ...newReports];
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      return merged;
    } catch (e) {
      console.error('Import failed:', e);
      throw new Error('Invalid data format');
    }
  },
  clearAll: () => {
    localStorage.removeItem(STORAGE_KEY);
  }
};
