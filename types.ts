export type LGA = 'BATAGARAWA' | 'KATSINA' | 'DAURA' | 'MALUMFASHI' | 'KANKIA' | 'MANI' | 'MATAZU' | 'MAIADUA';

export type UserRole = 'ADMIN' | 'FIELD_OFFICER';

export interface AuthUser {
  role: UserRole;
  name: string;
  lga?: LGA;
}

export interface TeamMember {
  name: string;
}

export interface Team {
  id: string; // Team Code (e.g., 02162)
  lga: LGA;
  members: string[];
  color: string;
}

export interface WeeklyReport {
  id: string;
  teamId: string;
  month: string; // e.g., "Jan-26"
  week: number; // 1, 2, 3, 4
  score: number;
  status: 'P' | 'ABS' | 'NDB';
  submittedAt: string;
}

export interface AppState {
  reports: WeeklyReport[];
}