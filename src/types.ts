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
  teamLeader?: string; // e.g. "Time do TL Bruno"
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
  active?: boolean; // Se a tarefa está ativa ou oculta
}

export interface BreakSlot {
  id: string;
  time: string; // HH:mm
  shift?: string;
  capacity?: number; // Opcional - sem limite de capacidade
}

export interface AutoBackupInfo {
  timestamp: string;
  formattedDate: string;
  reason: string;
  collaboratorCount: number;
  taskCount: number;
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
  | 'emerald'
  | 'slate'
  | 'indigo'
  | 'teal'
  | 'terracotta'
  | 'obsidian';

export interface OnlineSpreadsheetConfig {
  name: string; // e.g. "Planilha Oficial de Turnos - Logística T2"
  url: string; // e.g. "https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit"
  webhookUrl?: string; // Optional Google Apps Script Web App / Webhook URL
  autoSyncEnabled?: boolean; // Real-time auto sync on edit
  lastSyncedAt?: string; // e.g. "25/07/2026 12:30:00"
  syncCount?: number;
  syncStatus?: 'success' | 'error' | 'testing';
  lastError?: string;
}

export interface DeletedCollaborator {
  id: string;
  collaborator: Collaborator;
  deletedAt: string; // ISO date string
  expiresAt: string; // ISO date string (60 days later)
}

export type ProcessType = 'caracteristica' | 'curiosidade' | 'explicacao' | 'procedimento' | 'seguranca' | 'qualidade';

export interface ProcessKnowledge {
  id: string;
  title: string;
  category: string;
  type: ProcessType;
  description: string;
  keyTakeaways?: string[];
  imageUrl?: string;
  iconName?: string;
  active?: boolean;
}

export interface BriefingConfig {
  coverBgUrl?: string;
  motivationalQuote?: string;
  showQuote?: boolean;
  pdfUrl?: string;
  pdfPageNumber?: number;
  pdfDirectImageUrl?: string;
  qaQuestions?: string[];
}

export interface AppState {
  updatedAtMs?: number;
  brandId?: string;
  teamName: string;
  manager: string;
  sector: string;
  teamShift: string;
  defaultTeamLeader?: string;
  teamLeaders: string[];
  roles: string[];
  categories: string[];
  skills: string[];
  year: number;
  selectedDate: string; // YYYY-MM-DD
  theme: ThemeOption;
  calendar: Record<string, ShiftGroup>; // YYYY-MM-DD -> ShiftGroup on OFF
  collaborators: Collaborator[];
  deletedCollaborators?: DeletedCollaborator[];
  tasks: Task[];
  breaks: BreakSlot[];
  attendance: Record<string, Record<string, boolean>>; // date -> collaboratorId -> isPresent (manual override)
  intervals: Record<string, Record<string, string[]>>; // date -> breakId -> collaboratorId[]
  processKnowledgeList?: ProcessKnowledge[];
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
  onlineSpreadsheet?: OnlineSpreadsheetConfig | null;
  isSidebarCollapsed?: boolean;
  showBriefingSlide?: boolean;
  showEmployeePortal?: boolean;
  selectedShiftFilter?: string;
  selectedTLFilter?: string;
  briefingConfig?: BriefingConfig;
}
