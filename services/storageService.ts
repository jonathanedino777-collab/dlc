
import { WeeklyReport } from '../types';

const STORAGE_KEY = 'dl4all_reports';

export const storageService = {
  saveReport: (report: WeeklyReport) => {
    const reports = storageService.getReports();
    reports.push(report);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
  },
  getReports: (): WeeklyReport[] => {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  },
  deleteReport: (id: string) => {
    const reports = storageService.getReports().filter(r => r.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
  },
  clearAll: () => {
    localStorage.removeItem(STORAGE_KEY);
  }
};
