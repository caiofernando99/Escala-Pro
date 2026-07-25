export type ShiftGroup = 'A' | 'B' | 'C' | 'D';

export type AbsenceType = 'ferias' | 'licenca' | 'treinamento';

export interface ScheduledAbsence {
  id: string;
  type: AbsenceType;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  notes?: string;
}

export interface Collaborator {
  id: string;
  name: string;
  login?: string;
  registration?: string;
  shift: string; // T1, T2, T3, T4, T5, Noite, etc.
  scale: ShiftGroup; // A, B, C, D
  role: string;
  category: string;
  skills?: Record<string, number>; // skillName -> level (0-3)
  notes?: string;
  absences?: ScheduledAbsence[]; // Scheduled vacations, leaves, trainings
}

export interface Task {
  id: string;
  name: string;
  members: string[]; // Collaborator IDs
  allowedRoles?: string[]; // Cargo(s) vinculados
  allowedCategories?: string[]; // Categoria(s) vinculadas
}

export interface BreakSlot {
  id: string;
  time: string; // HH:mm
  shift?: string;
  capacity: number;
}

export interface DailyReport {
  generatedAt?: string;
  absenceReasons?: Record<string, string>; // collaboratorId -> reason
  occurrences?: Record<string, string>; // collaboratorId -> text
  generalNotes?: string;
  snapshot?: Array<{
    id: string;
    name: string;
    status: 'presente' | 'ausente' | 'folga' | 'ferias' | 'licenca' | 'treinamento';
    task: string;
    interval: string;
    absenceReason?: string;
    occurrence?: string;
  }>;
}

export type ThemeOption =
  | 'slate'
  | 'emerald'
  | 'indigo'
  | 'material-you'
  | 'material-teal'
  | 'material-terracotta'
  | 'sage-matte'
  | 'nord-frost'
  | 'material-dark'
  | 'obsidian-dark'
  | 'dark'
  | 'high-contrast';

export interface AppState {
  brandId?: string;
  teamName: string;
  manager: string;
  sector: string;
  teamShift: string;
  roles: string[];
  categories: string[];
  skills: string[];
  year: number;
  selectedDate: string; // YYYY-MM-DD
  theme: ThemeOption;
  calendar: Record<string, ShiftGroup>; // YYYY-MM-DD -> ShiftGroup on OFF
  collaborators: Collaborator[];
  tasks: Task[];
  breaks: BreakSlot[];
  attendance: Record<string, Record<string, boolean>>; // date -> collaboratorId -> isPresent (manual override)
  intervals: Record<string, Record<string, string[]>>; // date -> breakId -> collaboratorId[]
  history: Array<{
    id: string;
    date: string;
    peoplePresent: number;
    peopleVacation: number;
    peopleLeave: number;
    peopleTraining: number;
    timestamp: string;
  }>;
  dailyReports: Record<string, DailyReport>;
}
