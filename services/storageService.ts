import { WeeklyReport } from '../types';

const STORAGE_KEY = 'dl4all_reports';

export const storageService = {
  saveReport: (report: WeeklyReport) => {
    try {
      const reports = storageService.getReports();
      reports.push(report);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
    } catch (e) {
      console.error('Error saving report:', e);
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
  deleteReport: (id: string) => {
    try {
      const reports = storageService.getReports().filter(r => r.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
    } catch (e) {
      console.error('Error deleting report:', e);
    }
  },
  clearAll: () => {
    localStorage.removeItem(STORAGE_KEY);
  }
};