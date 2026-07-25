import { AppState, Collaborator, ScheduledAbsence, ShiftGroup } from '../types';

export function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

export function getTodayISO(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDateBR(dateStr: string): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  if (!year || !month || !day) return dateStr;
  return `${day}/${month}/${year}`;
}

export function formatDateLongBR(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d, 12, 0, 0);
    return new Intl.DateTimeFormat('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(date);
  } catch {
    return dateStr;
  }
}

/**
 * Checks if a collaborator is on scale off (Folga) for a given date.
 */
export function isScaleOff(calendar: Record<string, ShiftGroup>, dateStr: string, scale: ShiftGroup): boolean {
  return calendar[dateStr] === scale;
}

/**
 * Returns the active scheduled absence (Férias, Licença, Treinamento) for a collaborator on a given date, if any.
 */
export function getActiveAbsence(collaborator: Collaborator, dateStr: string): ScheduledAbsence | null {
  if (!collaborator.absences || collaborator.absences.length === 0) return null;
  return (
    collaborator.absences.find(
      (a) => dateStr >= a.startDate && dateStr <= a.endDate
    ) || null
  );
}

export type StatusType = 'presente' | 'ausente' | 'folga' | 'ferias' | 'licenca' | 'treinamento';

export interface CollaboratorDayStatus {
  status: StatusType;
  absenceDetail?: ScheduledAbsence | null;
  isOffScale: boolean;
  isManualOverride: boolean;
}

/**
 * Calculates the exact status of a collaborator on a specific date.
 */
export function getCollaboratorStatus(
  collaborator: Collaborator,
  dateStr: string,
  state: AppState
): CollaboratorDayStatus {
  // 1. Check if on scheduled vacation / leave / training
  const scheduledAbsence = getActiveAbsence(collaborator, dateStr);
  if (scheduledAbsence) {
    return {
      status: scheduledAbsence.type,
      absenceDetail: scheduledAbsence,
      isOffScale: isScaleOff(state.calendar, dateStr, collaborator.scale),
      isManualOverride: false,
    };
  }

  // 2. Check scale off
  const offScale = isScaleOff(state.calendar, dateStr, collaborator.scale);
  if (offScale) {
    return {
      status: 'folga',
      absenceDetail: null,
      isOffScale: true,
      isManualOverride: false,
    };
  }

  // 3. Check manual presence override
  const manual = state.attendance[dateStr]?.[collaborator.id];
  if (manual !== undefined) {
    return {
      status: manual ? 'presente' : 'ausente',
      absenceDetail: null,
      isOffScale: false,
      isManualOverride: true,
    };
  }

  // Default: Scheduled to work and assumed present
  return {
    status: 'presente',
    absenceDetail: null,
    isOffScale: false,
    isManualOverride: false,
  };
}

export function escapeSearchTerm(term: string): string {
  return term.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
}

export function matchesSearch(text: string | undefined | null, search: string): boolean {
  if (!search) return true;
  if (!text) return false;
  return escapeSearchTerm(text).includes(escapeSearchTerm(search));
}
