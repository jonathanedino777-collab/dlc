
import { LGA, Team } from './types';

export const LGAS: LGA[] = ['BATAGARAWA', 'KATSINA', 'DAURA', 'MALUMFASHI', 'KANKIA'];

export const INITIAL_TEAMS: Team[] = [
  // KATSINA
  { id: '02162', lga: 'KATSINA', members: ['ZUWAIRA KALLA', 'DOGARA MUSA'], color: '#f97316' },
  { id: '02496', lga: 'KATSINA', members: ['ALICE AMEH', 'NIMMYEL FRIDAY'], color: '#0f172a' },
  { id: '02492', lga: 'KATSINA', members: ['JAMES OLATEJU', 'PATIENCE GABRIEL'], color: '#0891b2' },
  // BATAGARAWA
  { id: '03101', lga: 'BATAGARAWA', members: ['SANI ABUBAKAR', 'YUSUF BELLO'], color: '#ef4444' },
  { id: '03102', lga: 'BATAGARAWA', members: ['AMINU LAWAL', 'HALIMA IDRIS'], color: '#f43f5e' },
  // DAURA
  { id: '04101', lga: 'DAURA', members: ['MUSA DAURA', 'IBRAHIM SANI'], color: '#8b5cf6' },
  { id: '04102', lga: 'DAURA', members: ['SAFIYA USMAN', 'BELLO ADAMU'], color: '#a78bfa' },
  // MALUMFASHI
  { id: '05101', lga: 'MALUMFASHI', members: ['UMAR FARUK', 'AISHA KABIR'], color: '#10b981' },
  { id: '05102', lga: 'MALUMFASHI', members: ['GABRIEL OKOH', 'MARYAM JIBRIL'], color: '#059669' },
  // KANKIA
  { id: '06101', lga: 'KANKIA', members: ['SHEHU MUSA', 'ZAINAB ALIYU'], color: '#f59e0b' },
  { id: '06102', lga: 'KANKIA', members: ['KABIRU ISAH', 'FATIMA AHMED'], color: '#d97706' },
  // Additional Katsina Teams
  { id: '02495', lga: 'KATSINA', members: ['SENJONG DAWULENG', 'OGAR IYOWO'], color: '#15803d' },
  { id: '02166', lga: 'KATSINA', members: ['FATIMA YUSUF', 'VICTOR BALA'], color: '#a21caf' },
  { id: '02697', lga: 'KATSINA', members: ['PEACE JOSEPH', 'JAMES AYEREWAJU'], color: '#65a30d' },
];

export const MONTHS = [
  'Jan-26', 'Feb-26', 'Mar-26', 'Apr-26', 'May-26', 'Jun-26',
  'Jul-26', 'Aug-26', 'Sep-26', 'Oct-26', 'Nov-26', 'Dec-26'
];
