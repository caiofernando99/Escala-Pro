import { AppState, Collaborator, ScheduledAbsence, ShiftGroup } from '../types';

export function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

/**
 * Capitalizes a person's name into "Aaaa Aaaa Aaaa" / Title Case format.
 * E.g., "carlos eduardo santos" -> "Carlos Eduardo Santos"
 * "MARIA DA SILVA" -> "Maria da Silva"
 */
export function formatPersonName(name: string): string {
  if (!name || !name.trim()) return '';
  const lowercasePrepositions = new Set(['de', 'da', 'do', 'dos', 'das', 'e', 'del', 'di']);
  
  const words = name.trim().split(/\s+/);
  
  return words
    .map((word, idx) => {
      if (!word) return '';
      const lower = word.toLowerCase();
      if (idx > 0 && lowercasePrepositions.has(lower)) {
        return lower;
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
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
  isExtraPresence: boolean;
}

/**
 * Calculates the exact status of a collaborator on a specific date.
 */
export function getCollaboratorStatus(
  collaborator: Collaborator,
  dateStr: string,
  state: AppState
): CollaboratorDayStatus {
  const scheduledAbsence = getActiveAbsence(collaborator, dateStr);
  const offScale = isScaleOff(state.calendar, dateStr, collaborator.scale);
  const manual = state.attendance[dateStr]?.[collaborator.id];

  // Manual presence override explicitly set by manager
  if (manual !== undefined) {
    if (manual === true) {
      const isExtra = offScale || Boolean(scheduledAbsence);
      return {
        status: 'presente',
        absenceDetail: scheduledAbsence,
        isOffScale: offScale,
        isManualOverride: true,
        isExtraPresence: isExtra,
      };
    } else {
      return {
        status: 'ausente',
        absenceDetail: scheduledAbsence,
        isOffScale: offScale,
        isManualOverride: true,
        isExtraPresence: false,
      };
    }
  }

  // No manual override set
  if (scheduledAbsence) {
    return {
      status: scheduledAbsence.type,
      absenceDetail: scheduledAbsence,
      isOffScale: offScale,
      isManualOverride: false,
      isExtraPresence: false,
    };
  }

  if (offScale) {
    return {
      status: 'folga',
      absenceDetail: null,
      isOffScale: true,
      isManualOverride: false,
      isExtraPresence: false,
    };
  }

  return {
    status: 'presente',
    absenceDetail: null,
    isOffScale: false,
    isManualOverride: false,
    isExtraPresence: false,
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

/**
 * Serializes daily operational state into a compact URL-safe Base64 string
 */
export function encodeSharedState(state: AppState): string {
  try {
    const snapshot = {
      date: state.selectedDate,
      teamName: state.teamName,
      sector: state.sector,
      manager: state.manager,
      teamShift: state.teamShift,
      defaultTeamLeader: state.defaultTeamLeader,
      teamLeaders: state.teamLeaders,
      collaborators: state.collaborators,
      tasks: state.tasks,
      breaks: state.breaks,
      intervals: state.intervals[state.selectedDate] || {},
      calendar: state.calendar,
      attendance: state.attendance[state.selectedDate] || {},
    };
    const jsonStr = JSON.stringify(snapshot);
    const utf8Bytes = new TextEncoder().encode(jsonStr);
    let binary = '';
    for (let i = 0; i < utf8Bytes.length; i++) {
      binary += String.fromCharCode(utf8Bytes[i]);
    }
    const base64 = btoa(binary);
    return encodeURIComponent(base64);
  } catch (err) {
    console.error('Failed to encode shared state:', err);
    return '';
  }
}

/**
 * Decodes compressed Base64 string from URL parameter back into state snapshot
 */
export function decodeSharedState(encoded: string): any | null {
  if (!encoded) return null;
  try {
    const base64 = decodeURIComponent(encoded);
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const jsonStr = new TextDecoder().decode(bytes);
    return JSON.parse(jsonStr);
  } catch (err) {
    console.error('Failed to decode shared state:', err);
    return null;
  }
}

