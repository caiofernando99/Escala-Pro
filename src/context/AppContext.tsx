import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { AppState, AutoBackupInfo, BreakSlot, Collaborator, DeletedCollaborator, OnlineSpreadsheetConfig, ProcessKnowledge, ScheduledAbsence, ShiftGroup, Task, ThemeOption } from '../types';
import { generateId, isScaleOff, getTodayISO, formatDateBR, getCollaboratorStatus, formatPersonName } from '../utils/helpers';
import { initialAppState } from '../utils/initialData';

const STORAGE_KEY = 'people-scheduler-v3';
const AUTO_BACKUP_KEY = 'escalapro_auto_backup_v1';

interface AppContextType {
  state: AppState;
  setDate: (date: string) => void;
  setYear: (year: number) => void;
  setTeamInfo: (info: { teamName?: string; sector?: string; manager?: string; teamShift?: string }) => void;
  setTheme: (theme: ThemeOption) => void;
  setBrandId: (brandId: string) => void;
  addCollaborator: (col?: Partial<Collaborator>) => void;
  updateCollaborator: (id: string, updates: Partial<Collaborator>) => void;
  deleteCollaborator: (id: string) => void;
  restoreCollaborator: (deletedId: string) => void;
  permanentlyDeleteCollaborator: (deletedId: string) => void;
  clearTrashBin: () => void;
  addScheduledAbsence: (collaboratorId: string, absence: Omit<ScheduledAbsence, 'id'>) => void;
  removeScheduledAbsence: (collaboratorId: string, absenceId: string) => void;
  addTask: (name: string, allowedRoles?: string[], allowedCategories?: string[]) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  addBreakSlot: (time: string, capacity?: number, shift?: string) => void;
  updateBreakSlot: (id: string, updates: Partial<BreakSlot>) => void;
  deleteBreakSlot: (id: string) => void;
  markDayScale: (dateStr: string, scale: ShiftGroup | '') => void;
  generate6x2Scale: (startDate: string, firstGroup: ShiftGroup) => void;
  toggleAttendance: (collaboratorId: string, present: boolean) => void;
  resetAttendance: () => void;
  assignTask: (collaboratorId: string, taskId: string) => void;
  unassignTask: (collaboratorId: string) => void;
  clearAssignments: () => void;
  clearTaskAssignments: (taskId: string) => void;
  autoAssign: () => void;
  undo: () => boolean;
  canUndo: boolean;
  moveBreakInterval: (collaboratorId: string, fromBreakId: string | null, toBreakId: string | null) => void;
  generateBreaks: () => void;
  addCatalogItem: (key: 'roles' | 'categories' | 'skills', item: string) => void;
  removeCatalogItem: (key: 'roles' | 'categories' | 'skills', item: string) => void;
  editCatalogItem: (key: 'roles' | 'categories' | 'skills', oldItem: string, newItem: string) => void;
  editTeamLeader: (oldName: string, newName: string) => void;
  setSelectedGlobalFilters: (filters: { shift?: string; teamLeader?: string }) => void;
  setModuleVisibility: (modules: { showBriefingSlide?: boolean; showEmployeePortal?: boolean }) => void;
  setSkillLevel: (collaboratorId: string, skill: string, level: number) => void;
  setAbsenceReason: (collaboratorId: string, reason: string) => void;
  setOccurrence: (collaboratorId: string, text: string) => void;
  setGeneralNotes: (notes: string) => void;
  saveDailyReport: () => void;
  saveHistory: () => void;
  importFullState: (newState: Partial<AppState>) => void;
  importRosterRows: (rows: any[]) => number;
  resetAllData: () => void;
  clearSampleData: () => void;
  lastAutoBackupInfo: AutoBackupInfo | null;
  createAutoBackup: (reason?: string) => AutoBackupInfo | null;
  restoreFromAutoBackup: () => boolean;
  disconnectOnlineSpreadsheet: () => void;
  noticeMessage: string | null;
  noticeActionLabel?: string | null;
  onNoticeAction?: (() => void) | null;
  showNotice: (msg: string, actionLabel?: string, onAction?: () => void) => void;
  addTeamLeader: (name: string) => void;
  removeTeamLeader: (name: string) => void;
  setOnlineSpreadsheetConfig: (config: OnlineSpreadsheetConfig | null) => void;
  syncToOnlineSpreadsheet: (isAutoSync?: boolean) => Promise<boolean>;
  fetchFromOnlineSpreadsheet: (isSilent?: boolean) => Promise<boolean>;
  exportLocalSpreadsheet: () => void;
  exportTeamRosterSpreadsheet: () => void;
  generateTemplateSpreadsheet: () => void;
  addProcessKnowledge: (item: Omit<ProcessKnowledge, 'id'>) => void;
  updateProcessKnowledge: (id: string, updates: Partial<ProcessKnowledge>) => void;
  deleteProcessKnowledge: (id: string) => void;
  toggleSidebarCollapsed: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const isExampleSpreadsheet =
          parsed.onlineSpreadsheet?.url?.includes('1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms');
        const formattedCols = (parsed.collaborators || initialAppState.collaborators).map((c: Collaborator) => ({
          ...c,
          name: formatPersonName(c.name),
        }));
        return {
          ...initialAppState,
          ...parsed,
          collaborators: formattedCols,
          processKnowledgeList: parsed.processKnowledgeList || initialAppState.processKnowledgeList,
          onlineSpreadsheet: isExampleSpreadsheet ? null : parsed.onlineSpreadsheet || null,
          theme: parsed.theme || 'slate',
        };
      }
    } catch {
      // Fallback
    }
    const formattedInitialCols = initialAppState.collaborators.map((c) => ({
      ...c,
      name: formatPersonName(c.name),
    }));
    return {
      ...initialAppState,
      collaborators: formattedInitialCols,
    };
  });

  const [noticeState, setNoticeState] = useState<{
    message: string | null;
    actionLabel?: string | null;
    onAction?: (() => void) | null;
  }>({ message: null });

  const [lastAutoBackupInfo, setLastAutoBackupInfo] = useState<AutoBackupInfo | null>(() => {
    try {
      const raw = localStorage.getItem(AUTO_BACKUP_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          timestamp: parsed.timestamp || '',
          formattedDate: parsed.formattedDate || '',
          reason: parsed.reason || 'Backup Automático',
          collaboratorCount: parsed.state?.collaborators?.length || 0,
          taskCount: parsed.state?.tasks?.length || 0,
        };
      }
    } catch {
      // Fallback
    }
    return null;
  });

  const undoStackRef = useRef<AppState[]>([]);
  const [canUndo, setCanUndo] = useState(false);

  const pushUndo = (prevState: AppState) => {
    undoStackRef.current.push(prevState);
    if (undoStackRef.current.length > 40) {
      undoStackRef.current.shift();
    }
    setCanUndo(true);
  };

  const undo = (): boolean => {
    if (undoStackRef.current.length === 0) {
      showNotice('Nenhuma ação recente para desfazer.');
      setCanUndo(false);
      return false;
    }
    const previous = undoStackRef.current.pop()!;
    setState(previous);
    setCanUndo(undoStackRef.current.length > 0);
    showNotice('Ação desfeita com sucesso! (Ctrl+Z)');
    return true;
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        const activeEl = document.activeElement;
        if (
          activeEl &&
          (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || (activeEl as HTMLElement).isContentEditable)
        ) {
          return;
        }
        e.preventDefault();
        undo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const showNotice = (msg: string, actionLabel?: string, onAction?: () => void) => {
    setNoticeState({ message: msg, actionLabel, onAction });
    setTimeout(() => {
      setNoticeState((prev) => (prev.message === msg ? { message: null } : prev));
    }, 7000);
  };

  const createAutoBackup = (reason: string = 'Backup de Segurança Pré-Limpeza'): AutoBackupInfo | null => {
    try {
      const now = new Date();
      const formattedDate = `${now.toLocaleDateString('pt-BR')} às ${now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
      const backupData = {
        timestamp: now.toISOString(),
        formattedDate,
        reason,
        state,
      };
      localStorage.setItem(AUTO_BACKUP_KEY, JSON.stringify(backupData));
      const info: AutoBackupInfo = {
        timestamp: now.toISOString(),
        formattedDate,
        reason,
        collaboratorCount: state.collaborators.length,
        taskCount: state.tasks.length,
      };
      setLastAutoBackupInfo(info);
      return info;
    } catch (e) {
      console.error('Erro ao criar backup automático:', e);
      return null;
    }
  };

  const restoreFromAutoBackup = (): boolean => {
    try {
      const raw = localStorage.getItem(AUTO_BACKUP_KEY);
      if (!raw) {
        showNotice('Nenhum backup automático disponível para restauração.');
        return false;
      }
      const parsed = JSON.parse(raw);
      if (parsed && parsed.state) {
        setState(parsed.state);
        showNotice(`Dados restaurados com sucesso do backup automático de ${parsed.formattedDate || 'data anterior'}!`);
        return true;
      }
    } catch (e) {
      console.error('Erro ao restaurar do backup automático:', e);
      showNotice('Erro ao tentar restaurar os dados do backup automático.');
    }
    return false;
  };

  const disconnectOnlineSpreadsheet = () => {
    setState((prev) => ({
      ...prev,
      onlineSpreadsheet: null,
    }));
    showNotice('Sincronização com a Planilha Online desconectada. Seus dados locais continuam preservados.');
  };

  // Save state to localStorage and broadcast live changes across tabs whenever state changes
  useEffect(() => {
    try {
      const jsonStr = JSON.stringify(state);
      localStorage.setItem(STORAGE_KEY, jsonStr);

      // Broadcast to any open Portal or Manager tab in real-time
      if (typeof BroadcastChannel !== 'undefined') {
        const channel = new BroadcastChannel('escalapro_live_channel');
        channel.postMessage({ type: 'STATE_UPDATED', state });
        channel.close();
      }
    } catch (err) {
      console.error('Failed to save or broadcast state', err);
    }
  }, [state]);

  // Listen for live updates from other tabs
  useEffect(() => {
    let bc: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== 'undefined') {
      bc = new BroadcastChannel('escalapro_live_channel');
      bc.onmessage = (event) => {
        if (event.data && event.data.type === 'STATE_UPDATED' && event.data.state) {
          setState((prev) => {
            // Only update if data is actually different to avoid render loops
            if (JSON.stringify(prev) !== JSON.stringify(event.data.state)) {
              return event.data.state;
            }
            return prev;
          });
        }
      };
    }

    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (parsed) {
            setState(parsed);
          }
        } catch {
          // ignore
        }
      }
    };

    window.addEventListener('storage', handleStorageEvent);
    return () => {
      window.removeEventListener('storage', handleStorageEvent);
      if (bc) bc.close();
    };
  }, []);

  // Apply theme to document element
  useEffect(() => {
    const currentTheme = state.theme || 'slate';
    document.documentElement.setAttribute('data-theme', currentTheme);
    const isDark = ['dark', 'material-dark', 'obsidian-dark'].includes(currentTheme);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [state.theme]);

  const setDate = (selectedDate: string) => {
    setState((prev) => ({ ...prev, selectedDate }));
  };

  const setYear = (year: number) => {
    setState((prev) => ({ ...prev, year }));
  };

  const setTeamInfo = (info: { teamName?: string; sector?: string; manager?: string; teamShift?: string }) => {
    setState((prev) => {
      const nextShift = info.teamShift !== undefined ? info.teamShift : prev.teamShift;
      const updatedCols = prev.collaborators.map((c) => ({
        ...c,
        shift: nextShift || c.shift,
      }));
      const updatedBreaks = prev.breaks.map((b) => ({
        ...b,
        shift: nextShift || b.shift,
      }));
      return {
        ...prev,
        ...info,
        collaborators: updatedCols,
        breaks: updatedBreaks,
      };
    });
    showNotice('Informações da equipe atualizadas.');
  };

  const setTheme = (theme: ThemeOption) => {
    setState((prev) => ({ ...prev, theme }));
    showNotice(`Tema alterado para ${theme}.`);
  };

  const setBrandId = (brandId: string) => {
    setState((prev) => ({ ...prev, brandId }));
    showNotice(`Identidade visual da marca alterada com sucesso!`);
  };

  const addCollaborator = (customProps?: Partial<Collaborator>) => {
    const rawName = customProps?.name || 'Novo Colaborador';
    const newCol: Collaborator = {
      id: generateId(),
      name: formatPersonName(rawName),
      login: customProps?.login || '',
      registration: customProps?.registration || '',
      shift: customProps?.shift || state.teamShift || 'Geral',
      scale: customProps?.scale || 'A',
      teamLeader: customProps?.teamLeader || state.defaultTeamLeader || (state.teamLeaders?.[0] || 'Time 1'),
      role: customProps?.role || (state.roles[0] || 'Operador de Processo'),
      category: customProps?.category || (state.categories[0] || 'Inbound'),
      skills: customProps?.skills || {},
      notes: customProps?.notes || '',
      absences: customProps?.absences || [],
    };
    setState((prev) => {
      pushUndo(prev);
      return {
        ...prev,
        collaborators: [...prev.collaborators, newCol],
      };
    });
    showNotice('Novo colaborador cadastrado.');
  };

  const addTeamLeader = (name: string) => {
    const clean = name.trim();
    if (!clean) return;
    setState((prev) => {
      pushUndo(prev);
      const current = prev.teamLeaders || [];
      if (current.includes(clean)) return prev;
      return {
        ...prev,
        teamLeaders: [...current, clean],
        defaultTeamLeader: prev.defaultTeamLeader || clean,
      };
    });
    showNotice(`Time / TL "${clean}" adicionado com sucesso!`);
  };

  const removeTeamLeader = (name: string) => {
    setState((prev) => {
      pushUndo(prev);
      const current = prev.teamLeaders || [];
      const updated = current.filter((t) => t !== name);
      return {
        ...prev,
        teamLeaders: updated,
        defaultTeamLeader: prev.defaultTeamLeader === name ? updated[0] || '' : prev.defaultTeamLeader,
      };
    });
    showNotice(`Time / TL "${name}" removido.`);
  };

  const updateCollaborator = (id: string, updates: Partial<Collaborator>) => {
    const formattedUpdates = { ...updates };
    if (formattedUpdates.name) {
      formattedUpdates.name = formatPersonName(formattedUpdates.name);
    }
    setState((prev) => {
      pushUndo(prev);
      return {
        ...prev,
        collaborators: prev.collaborators.map((c) => (c.id === id ? { ...c, ...formattedUpdates } : c)),
      };
    });
  };

  const addProcessKnowledge = (item: Omit<ProcessKnowledge, 'id'>) => {
    const newItem: ProcessKnowledge = {
      ...item,
      id: generateId(),
      active: item.active !== undefined ? item.active : true,
    };
    setState((prev) => ({
      ...prev,
      processKnowledgeList: [...(prev.processKnowledgeList || []), newItem],
    }));
    showNotice(`Processo "${item.title}" cadastrado com sucesso!`);
  };

  const updateProcessKnowledge = (id: string, updates: Partial<ProcessKnowledge>) => {
    setState((prev) => ({
      ...prev,
      processKnowledgeList: (prev.processKnowledgeList || []).map((p) =>
        p.id === id ? { ...p, ...updates } : p
      ),
    }));
    showNotice('Item de processo atualizado.');
  };

  const deleteProcessKnowledge = (id: string) => {
    setState((prev) => ({
      ...prev,
      processKnowledgeList: (prev.processKnowledgeList || []).filter((p) => p.id !== id),
    }));
    showNotice('Item de processo removido.');
  };

  const deleteCollaborator = (id: string) => {
    const target = state.collaborators.find((c) => c.id === id);
    if (!target) return;

    const now = new Date();
    const expires = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000); // 60 days retention
    const deletedEntry: DeletedCollaborator = {
      id: generateId(),
      collaborator: target,
      deletedAt: now.toISOString(),
      expiresAt: expires.toISOString(),
    };

    setState((prev) => ({
      ...prev,
      collaborators: prev.collaborators.filter((c) => c.id !== id),
      deletedCollaborators: [...(prev.deletedCollaborators || []), deletedEntry],
      tasks: prev.tasks.map((t) => ({
        ...t,
        members: t.members.filter((m) => m !== id),
      })),
      intervals: Object.fromEntries(
        Object.entries(prev.intervals).map(([dateKey, dayIntervals]) => [
          dateKey,
          Object.fromEntries(
            Object.entries(dayIntervals).map(([breakId, memberIds]) => [
              breakId,
              memberIds.filter((m) => m !== id),
            ])
          ),
        ])
      ),
    }));

    showNotice(
      `Colaborador "${target.name}" movido para a Lixeira (mantido por 60 dias).`,
      'Desfazer Exclusão',
      () => restoreCollaborator(deletedEntry.id)
    );
  };

  const restoreCollaborator = (deletedId: string) => {
    const entry = state.deletedCollaborators?.find((d) => d.id === deletedId);
    if (!entry) return;

    setState((prev) => ({
      ...prev,
      collaborators: [...prev.collaborators, entry.collaborator],
      deletedCollaborators: (prev.deletedCollaborators || []).filter((d) => d.id !== deletedId),
    }));

    showNotice(`Colaborador "${entry.collaborator.name}" restaurado com sucesso!`);
  };

  const permanentlyDeleteCollaborator = (deletedId: string) => {
    const entry = state.deletedCollaborators?.find((d) => d.id === deletedId);
    setState((prev) => ({
      ...prev,
      deletedCollaborators: (prev.deletedCollaborators || []).filter((d) => d.id !== deletedId),
    }));

    showNotice(`Colaborador "${entry?.collaborator.name || ''}" excluído permanentemente.`);
  };

  const clearTrashBin = () => {
    setState((prev) => ({
      ...prev,
      deletedCollaborators: [],
    }));
    showNotice('Lixeira de colaboradores esvaziada.');
  };

  const addScheduledAbsence = (collaboratorId: string, absence: Omit<ScheduledAbsence, 'id'>) => {
    const newAbsence: ScheduledAbsence = {
      ...absence,
      id: generateId(),
    };
    setState((prev) => {
      pushUndo(prev);
      return {
        ...prev,
        collaborators: prev.collaborators.map((c) => {
          if (c.id === collaboratorId) {
            return {
              ...c,
              absences: [...(c.absences || []), newAbsence],
            };
          }
          return c;
        }),
      };
    });
    showNotice('Afastamento (Férias/Licença/Treinamento) cadastrado.');
  };

  const removeScheduledAbsence = (collaboratorId: string, absenceId: string) => {
    setState((prev) => {
      pushUndo(prev);
      return {
        ...prev,
        collaborators: prev.collaborators.map((c) => {
          if (c.id === collaboratorId) {
            return {
              ...c,
              absences: (c.absences || []).filter((a) => a.id !== absenceId),
            };
          }
          return c;
        }),
      };
    });
    showNotice('Afastamento removido.');
  };

  const addTask = (name: string, allowedRoles: string[] = [], allowedCategories: string[] = []) => {
    if (!name.trim()) return;
    const newTask: Task = {
      id: generateId(),
      name: name.trim(),
      members: [],
      allowedRoles,
      allowedCategories,
    };
    setState((prev) => {
      pushUndo(prev);
      return {
        ...prev,
        tasks: [...prev.tasks, newTask],
      };
    });
    showNotice(`Tarefa "${name}" adicionada.`);
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    setState((prev) => {
      pushUndo(prev);
      return {
        ...prev,
        tasks: prev.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
      };
    });
  };

  const deleteTask = (id: string) => {
    setState((prev) => {
      pushUndo(prev);
      return {
        ...prev,
        tasks: prev.tasks.filter((t) => t.id !== id),
      };
    });
    showNotice('Tarefa excluída.');
  };

  const addBreakSlot = (time: string, capacity?: number, shift?: string) => {
    const newSlot: BreakSlot = {
      id: generateId(),
      time: time || '20:00',
      shift: shift || state.teamShift || 'T2',
      capacity: capacity || undefined,
    };
    setState((prev) => {
      pushUndo(prev);
      return {
        ...prev,
        breaks: [...prev.breaks, newSlot],
      };
    });
    showNotice('Horário de intervalo adicionado.');
  };

  const updateBreakSlot = (id: string, updates: Partial<BreakSlot>) => {
    setState((prev) => {
      pushUndo(prev);
      return {
        ...prev,
        breaks: prev.breaks.map((b) => (b.id === id ? { ...b, ...updates } : b)),
      };
    });
  };

  const deleteBreakSlot = (id: string) => {
    setState((prev) => {
      pushUndo(prev);
      return {
        ...prev,
        breaks: prev.breaks.filter((b) => b.id !== id),
      };
    });
    showNotice('Horário de intervalo removido.');
  };

  const markDayScale = (dateStr: string, scale: ShiftGroup | '') => {
    setState((prev) => {
      pushUndo(prev);
      const newCal = { ...prev.calendar };
      if (scale) {
        newCal[dateStr] = scale;
      } else {
        delete newCal[dateStr];
      }
      return { ...prev, calendar: newCal };
    });
  };

  const generate6x2Scale = (startDate: string, firstGroup: ShiftGroup) => {
    setState((prev) => {
      const OFF: ShiftGroup[] = ['A', 'B', 'C', 'D'];
      const newCal = { ...prev.calendar };
      const start = new Date(startDate + 'T12:00:00');
      const end = new Date(prev.year, 11, 31);
      const startIndex = OFF.indexOf(firstGroup);

      for (let d = new Date(Math.max(start.getTime(), new Date(prev.year, 0, 1).getTime())); d <= end; d.setDate(d.getDate() + 1)) {
        const cycleDays = Math.floor((d.getTime() - start.getTime()) / 86400000);
        const groupIndex = (startIndex + Math.floor(cycleDays / 2)) % 4;
        const group = OFF[(groupIndex + 4) % 4];
        const dayKey = d.toISOString().slice(0, 10);
        newCal[dayKey] = group;
      }
      return { ...prev, calendar: newCal };
    });
    showNotice('Ciclo de escala 6x2 gerado com sucesso.');
  };

  const toggleAttendance = (collaboratorId: string, present: boolean) => {
    setState((prev) => {
      pushUndo(prev);
      const dateKey = prev.selectedDate;
      const dayAtt = { ...(prev.attendance[dateKey] || {}) };
      dayAtt[collaboratorId] = present;
      return {
        ...prev,
        attendance: {
          ...prev.attendance,
          [dateKey]: dayAtt,
        },
      };
    });
  };

  const resetAttendance = () => {
    setState((prev) => {
      pushUndo(prev);
      const dateKey = prev.selectedDate;
      const newAtt = { ...prev.attendance };
      delete newAtt[dateKey];
      return { ...prev, attendance: newAtt };
    });
    showNotice('Presença restaurada conforme o cálculo automático da escala.');
  };

  const assignTask = (collaboratorId: string, taskId: string) => {
    setState((prev) => {
      pushUndo(prev);
      const updatedTasks = prev.tasks.map((t) => {
        const filtered = t.members.filter((m) => m !== collaboratorId);
        if (t.id === taskId) {
          return { ...t, members: [...filtered, collaboratorId] };
        }
        return { ...t, members: filtered };
      });
      return { ...prev, tasks: updatedTasks };
    });
  };

  const unassignTask = (collaboratorId: string) => {
    setState((prev) => {
      pushUndo(prev);
      return {
        ...prev,
        tasks: prev.tasks.map((t) => ({
          ...t,
          members: t.members.filter((m) => m !== collaboratorId),
        })),
      };
    });
  };

  const clearAssignments = () => {
    setState((prev) => {
      pushUndo(prev);
      return {
        ...prev,
        tasks: prev.tasks.map((t) => ({ ...t, members: [] })),
      };
    });
    showNotice('Dimensionamento de tarefas limpo.');
  };

  const clearTaskAssignments = (taskId: string) => {
    const targetTask = state.tasks.find((t) => t.id === taskId);
    setState((prev) => {
      pushUndo(prev);
      return {
        ...prev,
        tasks: prev.tasks.map((t) => (t.id === taskId ? { ...t, members: [] } : t)),
      };
    });
    showNotice(`Dimensionamento da tarefa "${targetTask?.name || ''}" foi limpo.`);
  };

  const autoAssign = () => {
    setState((prev) => {
      if (!prev.tasks.length) return prev;
      pushUndo(prev);
      const activePeople = prev.collaborators.filter((c) => {
        // active if not on vacation/leave/training and not scale off
        const hasAbsence = (c.absences || []).some((a) => prev.selectedDate >= a.startDate && prev.selectedDate <= a.endDate);
        const off = isScaleOff(prev.calendar, prev.selectedDate, c.scale);
        const manual = prev.attendance[prev.selectedDate]?.[c.id];
        if (hasAbsence) return false;
        if (manual !== undefined) return manual;
        return !off;
      });

      // Filter only active tasks
      const activeTasks = prev.tasks.filter((t) => t.active !== false);
      if (!activeTasks.length) return prev;

      const sorted = [...activePeople].sort((a, b) => a.name.localeCompare(b.name));
      const newTasks = prev.tasks.map((t) => ({ ...t, members: t.active === false ? [] : ([] as string[]) }));

      sorted.forEach((p, idx) => {
        // Try matching active task by role/category if set
        let matchedTaskIndex = newTasks.findIndex(
          (t) =>
            t.active !== false &&
            (t.allowedRoles?.length ? t.allowedRoles.includes(p.role) : true) &&
            (t.allowedCategories?.length ? t.allowedCategories.includes(p.category) : true)
        );
        if (matchedTaskIndex === -1) {
          const activeIndices = newTasks
            .map((t, index) => (t.active !== false ? index : -1))
            .filter((i) => i !== -1);
          matchedTaskIndex = activeIndices[idx % activeIndices.length];
        }
        if (matchedTaskIndex !== -1 && newTasks[matchedTaskIndex]) {
          newTasks[matchedTaskIndex].members.push(p.id);
        }
      });

      return { ...prev, tasks: newTasks };
    });
    showNotice('Auto dimensionamento concluído.');
  };

  const moveBreakInterval = (collaboratorId: string, fromBreakId: string | null, toBreakId: string | null) => {
    setState((prev) => {
      pushUndo(prev);
      const dateKey = prev.selectedDate;
      const dayIntervals = { ...(prev.intervals[dateKey] || {}) };

      if (fromBreakId && dayIntervals[fromBreakId]) {
        dayIntervals[fromBreakId] = dayIntervals[fromBreakId].filter((m) => m !== collaboratorId);
      }

      if (toBreakId) {
        dayIntervals[toBreakId] = [...(dayIntervals[toBreakId] || []).filter((m) => m !== collaboratorId), collaboratorId];
      }

      return {
        ...prev,
        intervals: {
          ...prev.intervals,
          [dateKey]: dayIntervals,
        },
      };
    });
  };

  const generateBreaks = () => {
    setState((prev) => {
      pushUndo(prev);
      if (!prev.breaks.length) return prev;
      const dateKey = prev.selectedDate;
      const result: Record<string, string[]> = Object.fromEntries(prev.breaks.map((b) => [b.id, []]));

      const activePeople = prev.collaborators.filter((c) => {
        const hasAbsence = (c.absences || []).some((a) => dateKey >= a.startDate && dateKey <= a.endDate);
        const off = isScaleOff(prev.calendar, dateKey, c.scale);
        const manual = prev.attendance[dateKey]?.[c.id];
        if (hasAbsence) return false;
        if (manual !== undefined) return manual;
        return !off;
      });

      const taskFor: Record<string, string> = {};
      prev.tasks.forEach((t) => t.members.forEach((m) => (taskFor[m] = t.id)));

      const loadCount: Record<string, number> = {};

      for (const person of activePeople) {
        const eligible = prev.breaks.filter(
          (b) => !b.shift || b.shift === 'Geral' || b.shift === person.shift
        );
        const pool = eligible.length ? eligible : prev.breaks;
        pool.sort((a, b) => {
          const taskA = loadCount[`${taskFor[person.id] || 'none'}-${a.id}`] || 0;
          const taskB = loadCount[`${taskFor[person.id] || 'none'}-${b.id}`] || 0;
          if (taskA !== taskB) return taskA - taskB;
          return result[a.id].length - result[b.id].length;
        });

        const chosen = pool[0];
        if (chosen) {
          result[chosen.id].push(person.id);
          const key = `${taskFor[person.id] || 'none'}-${chosen.id}`;
          loadCount[key] = (loadCount[key] || 0) + 1;
        }
      }

      return {
        ...prev,
        intervals: {
          ...prev.intervals,
          [dateKey]: result,
        },
      };
    });
    showNotice('Intervalos de refeição distribuídos e balanceados.');
  };

  const addCatalogItem = (key: 'roles' | 'categories' | 'skills', item: string) => {
    const trimmed = item.trim();
    if (!trimmed) return;
    setState((prev) => {
      pushUndo(prev);
      if (prev[key].includes(trimmed)) return prev;
      return { ...prev, [key]: [...prev[key], trimmed] };
    });
    showNotice(`Item "${trimmed}" adicionado a ${key}.`);
  };

  const removeCatalogItem = (key: 'roles' | 'categories' | 'skills', item: string) => {
    setState((prev) => {
      pushUndo(prev);
      return {
        ...prev,
        [key]: prev[key].filter((i) => i !== item),
      };
    });
    showNotice('Item removido.');
  };

  const editCatalogItem = (key: 'roles' | 'categories' | 'skills', oldItem: string, newItem: string) => {
    const trimmed = newItem.trim();
    if (!trimmed || trimmed === oldItem) return;
    setState((prev) => {
      pushUndo(prev);
      const updatedList = prev[key].map((item) => (item === oldItem ? trimmed : item));
      let updatedCollaborators = prev.collaborators;
      let updatedTasks = prev.tasks;

      if (key === 'roles') {
        updatedCollaborators = prev.collaborators.map((c) =>
          c.role === oldItem ? { ...c, role: trimmed } : c
        );
        updatedTasks = prev.tasks.map((t) => ({
          ...t,
          allowedRoles: (t.allowedRoles || []).map((r) => (r === oldItem ? trimmed : r)),
        }));
      } else if (key === 'categories') {
        updatedCollaborators = prev.collaborators.map((c) =>
          c.category === oldItem ? { ...c, category: trimmed } : c
        );
        updatedTasks = prev.tasks.map((t) => ({
          ...t,
          allowedCategories: (t.allowedCategories || []).map((cat) => (cat === oldItem ? trimmed : cat)),
        }));
      } else if (key === 'skills') {
        updatedCollaborators = prev.collaborators.map((c) => {
          if (c.skills && oldItem in c.skills) {
            const newSkills = { ...c.skills, [trimmed]: c.skills[oldItem] };
            delete newSkills[oldItem];
            return { ...c, skills: newSkills };
          }
          return c;
        });
      }

      return {
        ...prev,
        [key]: updatedList,
        collaborators: updatedCollaborators,
        tasks: updatedTasks,
      };
    });
    showNotice(`Item renomeado de "${oldItem}" para "${trimmed}".`);
  };

  const editTeamLeader = (oldName: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed || trimmed === oldName) return;
    setState((prev) => {
      pushUndo(prev);
      const updatedLeaders = (prev.teamLeaders || []).map((tl) => (tl === oldName ? trimmed : tl));
      const updatedDefault = prev.defaultTeamLeader === oldName ? trimmed : prev.defaultTeamLeader;
      const updatedCollaborators = prev.collaborators.map((c) =>
        c.teamLeader === oldName ? { ...c, teamLeader: trimmed } : c
      );
      return {
        ...prev,
        teamLeaders: updatedLeaders,
        defaultTeamLeader: updatedDefault,
        collaborators: updatedCollaborators,
      };
    });
    showNotice(`Time / TL renomeado para "${trimmed}".`);
  };

  const setSelectedGlobalFilters = (filters: { shift?: string; teamLeader?: string }) => {
    setState((prev) => ({
      ...prev,
      selectedShiftFilter: filters.shift !== undefined ? filters.shift : prev.selectedShiftFilter,
      selectedTLFilter: filters.teamLeader !== undefined ? filters.teamLeader : prev.selectedTLFilter,
      teamShift: filters.shift && filters.shift !== 'ALL' && filters.shift !== 'todos' ? filters.shift : prev.teamShift,
      defaultTeamLeader: filters.teamLeader && filters.teamLeader !== 'ALL' && filters.teamLeader !== 'todos' ? filters.teamLeader : prev.defaultTeamLeader,
    }));
  };

  const setModuleVisibility = (modules: { showBriefingSlide?: boolean; showEmployeePortal?: boolean }) => {
    setState((prev) => ({
      ...prev,
      showBriefingSlide: modules.showBriefingSlide !== undefined ? modules.showBriefingSlide : prev.showBriefingSlide,
      showEmployeePortal: modules.showEmployeePortal !== undefined ? modules.showEmployeePortal : prev.showEmployeePortal,
    }));
    showNotice('Visibilidade dos módulos atualizada com sucesso.');
  };

  const setSkillLevel = (collaboratorId: string, skill: string, level: number) => {
    setState((prev) => ({
      ...prev,
      collaborators: prev.collaborators.map((c) => {
        if (c.id === collaboratorId) {
          return {
            ...c,
            skills: { ...(c.skills || {}), [skill]: level },
          };
        }
        return c;
      }),
    }));
  };

  const setAbsenceReason = (collaboratorId: string, reason: string) => {
    setState((prev) => {
      const dateKey = prev.selectedDate;
      const dayReport = prev.dailyReports[dateKey] || {};
      return {
        ...prev,
        dailyReports: {
          ...prev.dailyReports,
          [dateKey]: {
            ...dayReport,
            absenceReasons: {
              ...(dayReport.absenceReasons || {}),
              [collaboratorId]: reason,
            },
          },
        },
      };
    });
  };

  const setOccurrence = (collaboratorId: string, text: string) => {
    setState((prev) => {
      const dateKey = prev.selectedDate;
      const dayReport = prev.dailyReports[dateKey] || {};
      return {
        ...prev,
        dailyReports: {
          ...prev.dailyReports,
          [dateKey]: {
            ...dayReport,
            occurrences: {
              ...(dayReport.occurrences || {}),
              [collaboratorId]: text,
            },
          },
        },
      };
    });
  };

  const setGeneralNotes = (notes: string) => {
    setState((prev) => {
      const dateKey = prev.selectedDate;
      const dayReport = prev.dailyReports[dateKey] || {};
      return {
        ...prev,
        dailyReports: {
          ...prev.dailyReports,
          [dateKey]: {
            ...dayReport,
            generalNotes: notes,
          },
        },
      };
    });
  };

  const saveDailyReport = () => {
    setState((prev) => {
      const dateKey = prev.selectedDate;
      const dayReport = prev.dailyReports[dateKey] || {};
      const snapshot = prev.collaborators.map((c) => {
        const hasAbsence = (c.absences || []).find((a) => dateKey >= a.startDate && dateKey <= a.endDate);
        const off = isScaleOff(prev.calendar, dateKey, c.scale);
        const manual = prev.attendance[dateKey]?.[c.id];

        let status: 'presente' | 'ausente' | 'folga' | 'ferias' | 'licenca' | 'treinamento' = 'presente';
        if (hasAbsence) {
          status = hasAbsence.type;
        } else if (off) {
          status = 'folga';
        } else if (manual === false) {
          status = 'ausente';
        }

        const task = prev.tasks.find((t) => t.members.includes(c.id))?.name || 'Não direcionado';
        const dayInt = prev.intervals[dateKey] || {};
        const breakSlot = prev.breaks.find((b) => (dayInt[b.id] || []).includes(c.id))?.time || 'Sem intervalo';

        return {
          id: c.id,
          name: c.name,
          status,
          task,
          interval: breakSlot,
          absenceReason: dayReport.absenceReasons?.[c.id] || '',
          occurrence: dayReport.occurrences?.[c.id] || '',
        };
      });

      return {
        ...prev,
        dailyReports: {
          ...prev.dailyReports,
          [dateKey]: {
            ...dayReport,
            generatedAt: new Date().toLocaleString('pt-BR'),
            snapshot,
          },
        },
      };
    });
    showNotice('Relatório diário salvo com sucesso.');
  };

  const saveHistory = () => {
    setState((prev) => {
      const dateKey = prev.selectedDate;
      const presentCount = prev.collaborators.filter((c) => {
        const hasAbsence = (c.absences || []).some((a) => dateKey >= a.startDate && dateKey <= a.endDate);
        const off = isScaleOff(prev.calendar, dateKey, c.scale);
        const manual = prev.attendance[dateKey]?.[c.id];
        if (hasAbsence || off) return false;
        return manual !== false;
      }).length;

      const vacationCount = prev.collaborators.filter((c) =>
        (c.absences || []).some((a) => dateKey >= a.startDate && dateKey <= a.endDate && a.type === 'ferias')
      ).length;

      const leaveCount = prev.collaborators.filter((c) =>
        (c.absences || []).some((a) => dateKey >= a.startDate && dateKey <= a.endDate && a.type === 'licenca')
      ).length;

      const trainingCount = prev.collaborators.filter((c) =>
        (c.absences || []).some((a) => dateKey >= a.startDate && dateKey <= a.endDate && a.type === 'treinamento')
      ).length;

      const newItem = {
        id: generateId(),
        date: dateKey,
        peoplePresent: presentCount,
        peopleVacation: vacationCount,
        peopleLeave: leaveCount,
        peopleTraining: trainingCount,
        timestamp: new Date().toLocaleString('pt-BR'),
      };

      return {
        ...prev,
        history: [...prev.history, newItem],
      };
    });
    showNotice('Resumo diário gravado no histórico.');
  };

  const importFullState = (newState: Partial<AppState>) => {
    const isExampleSpreadsheet =
      newState.onlineSpreadsheet?.url?.includes('1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms');

    const importedSpreadsheet = isExampleSpreadsheet ? null : newState.onlineSpreadsheet || null;

    setState((prev) => ({
      ...initialAppState,
      ...newState,
      onlineSpreadsheet: importedSpreadsheet,
      theme: newState.theme || prev.theme || 'slate',
    }));

    if (importedSpreadsheet?.webhookUrl) {
      showNotice(
        `Configurações e dados importados! Conexão com "${importedSpreadsheet.name}" restaurada e pronta para sincronizar.`,
        'Testar Agora',
        () => {
          syncToOnlineSpreadsheet();
        }
      );
    } else {
      showNotice('Configurações e dados importados com sucesso!');
    }
  };

  const importRosterRows = (rows: any[]) => {
    let count = 0;
    setState((prev) => {
      const newCols = [...prev.collaborators];
      const newRoles = new Set(prev.roles);
      const newCats = new Set(prev.categories);

      rows.forEach((row) => {
        const getVal = (...keys: string[]) => {
          const foundKey = Object.keys(row).find((k) => keys.includes(k.trim().toLowerCase()));
          return foundKey ? String(row[foundKey]).trim() : '';
        };

        const rawName = getVal('nome', 'colaborador', 'name');
        if (!rawName) return;
        const name = formatPersonName(rawName);

        const role = getVal('cargo', 'função', 'funcao', 'role') || 'Operador de Processo';
        const category = getVal('categoria', 'category') || 'Inbound';

        if (role) newRoles.add(role);
        if (category) newCats.add(category);

        newCols.push({
          id: generateId(),
          name,
          login: getVal('ldap', 'login', 'login amazon', 'user'),
          registration: getVal('re', 're (matrícula)', 're (matricula)', 'matrícula', 'matricula', 'id', 'reg'),
          shift: prev.teamShift || getVal('turno', 'shift') || 'T2',
          scale: (getVal('escala', 'scale') || 'A').toUpperCase() as ShiftGroup,
          role,
          category,
          skills: {},
          notes: getVal('observação', 'observacao', 'notes'),
          absences: [],
        });
        count++;
      });

      return {
        ...prev,
        collaborators: newCols,
        roles: Array.from(newRoles),
        categories: Array.from(newCats),
      };
    });
    showNotice(`${count} colaborador(es) importados com sucesso.`);
    return count;
  };

  const resetAllData = () => {
    // Automatically create a backup snapshot before resetting
    const backupInfo = createAutoBackup('Backup de emergência automático pré-reset');

    localStorage.removeItem(STORAGE_KEY);
    setState({
      ...initialAppState,
      selectedDate: getTodayISO(),
    });

    const timeDetail = backupInfo ? ` (Backup automático gravado às ${backupInfo.formattedDate})` : '';
    showNotice(
      `Dados locais da aplicação limpos com sucesso!${timeDetail}. Seus dados de planilha online foram preservados.`,
      'Restaurar Backup',
      () => restoreFromAutoBackup()
    );
  };

  const clearSampleData = () => {
    setState((prev) => ({
      ...prev,
      collaborators: [],
      deletedCollaborators: [],
      tasks: prev.tasks.map((t) => ({ ...t, members: [] })),
      attendance: {},
      intervals: {},
      history: [],
      dailyReports: {},
    }));
    showNotice('Dados de exemplo removidos! Você já pode cadastrar sua equipe real.');
  };

  const exportTeamRosterSpreadsheet = () => {
    if (!state.collaborators || state.collaborators.length === 0) {
      generateTemplateSpreadsheet();
      return;
    }

    let csv = '\uFEFF';
    csv += 'RE (Matrícula);Nome;LDAP;Setor;Gestor;Turno;Team Leader / Time;Escala;Cargo;Categoria;Observações\n';

    state.collaborators.forEach((col) => {
      const tlName = col.teamLeader || state.defaultTeamLeader || 'Sem Time';
      csv += `"${col.registration || ''}";"${col.name}";"${col.login || ''}";"${state.sector || ''}";"${state.manager || ''}";"${col.shift || state.teamShift || 'Geral'}";"${tlName}";"${col.scale}";"${col.role}";"${col.category}";"${col.notes || ''}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `planilha-equipe-${(state.teamName || 'equipe').replace(/\s+/g, '_').toLowerCase()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showNotice(`Planilha com dados preenchidos de ${state.collaborators.length} colaborador(es) exportada em .CSV!`);
  };

  const exportLocalSpreadsheet = () => {
    const activeDate = state.selectedDate;
    const formattedDate = formatDateBR(activeDate);

    // CSV Header with BOM for Excel UTF-8 Portuguese character support
    let csv = '\uFEFF';
    csv += 'Data (DD/MM/AAAA);RE (Matrícula);Nome do Colaborador;LDAP;Setor;Gestor;Turno;Team Leader / Time;Escala;Cargo;Categoria;Status no Dia;Tarefa Operacional;Horário de Refeição;Habilidades\n';

    state.collaborators.forEach((col) => {
      const st = getCollaboratorStatus(col, activeDate, state);
      const taskName = state.tasks.find((t) => t.members.includes(col.id))?.name || 'Não Dimensionado';
      const dayInt = state.intervals[activeDate] || {};
      const breakSlot = state.breaks.find((b) => (dayInt[b.id] || []).includes(col.id))?.time || 'Sem Intervalo';
      const skillsStr = col.skills && Object.keys(col.skills).length > 0 ? Object.keys(col.skills).join(', ') : 'Nenhuma';
      const tlName = col.teamLeader || state.defaultTeamLeader || 'Geral';

      let statusLabel = 'Presente';
      if (st.status === 'folga') statusLabel = 'Folga (6x2)';
      else if (st.status === 'ferias') statusLabel = 'Férias';
      else if (st.status === 'licenca') statusLabel = 'Licença Médica';
      else if (st.status === 'treinamento') statusLabel = 'Treinamento';
      else if (st.status === 'ausente') statusLabel = 'Ausente (Falta)';

      csv += `"${formattedDate}";"${col.registration || ''}";"${col.name}";"${col.login || ''}";"${state.sector}";"${state.manager}";"${col.shift || state.teamShift}";"${tlName}";"${col.scale}";"${col.role}";"${col.category}";"${statusLabel}";"${taskName}";"${breakSlot}";"${skillsStr}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `escala-local-${state.teamName.replace(/\s+/g, '_')}-${formattedDate.replace(/\//g, '-')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showNotice(`Planilha local baixada com sucesso (${formattedDate}).`);
  };

  const generateTemplateSpreadsheet = () => {
    let csv = '\uFEFF';
    csv += 'RE (Matrícula);Nome;LDAP;Setor;Gestor;Turno;Team Leader / Time;Escala;Cargo;Categoria;Observações\n';
    csv += 'RE-1001;João Silva;joaos;Recebimento;Carlos Santos;T2;Time do TL Bruno;A;Operador de Processo;Inbound;Colaborador T2\n';
    csv += 'RE-1002;Maria Oliveira;mariao;Recebimento;Carlos Santos;T2;Time da TL Mariana;B;Analista de Qualidade;ICQA;Líder de Turno\n';

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `template-modelo-banco-de-dados-equipe.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showNotice(`Planilha modelo baixada para criação de banco de dados no Google Sheets.`);
  };

  const lastLocalEditTime = useRef<number>(0);
  const lastSyncedTimestampMs = useRef<number>(0);

  const setOnlineSpreadsheetConfig = (config: OnlineSpreadsheetConfig | null) => {
    setState((prev) => ({ ...prev, onlineSpreadsheet: config }));
    if (config) {
      showNotice(`Planilha "${config.name}" conectada com sucesso! Sincronizando dados em tempo real...`);
      if (config.webhookUrl) {
        setTimeout(() => {
          fetchFromOnlineSpreadsheet(false);
        }, 300);
      }
    } else {
      showNotice('Planilha online desconectada.');
    }
  };

  const setSidebarCollapsed = (collapsed: boolean) => {
    setState((prev) => ({ ...prev, isSidebarCollapsed: collapsed }));
  };

  const toggleSidebarCollapsed = () => {
    setState((prev) => ({ ...prev, isSidebarCollapsed: !prev.isSidebarCollapsed }));
  };

  const fetchFromOnlineSpreadsheet = async (isSilent = false): Promise<boolean> => {
    const currentConfig = state.onlineSpreadsheet;
    if (!currentConfig || !currentConfig.webhookUrl) return false;

    const webhookUrl = currentConfig.webhookUrl.trim();
    if (webhookUrl.includes('docs.google.com/spreadsheets')) return false;

    try {
      const res = await fetch(webhookUrl, { method: 'GET' });
      if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
      const data = await res.json();

      if (!data || data.status === 'empty') {
        if (state.collaborators.length > 0 && !isSilent) {
          syncToOnlineSpreadsheet(true);
        }
        return false;
      }

      const remoteState = data.rawState || (data.collaborators ? data : null);
      if (!remoteState || !Array.isArray(remoteState.collaborators)) {
        return false;
      }

      const remoteUpdatedAtMs = remoteState.updatedAtMs || 0;
      if (remoteUpdatedAtMs && remoteUpdatedAtMs <= lastSyncedTimestampMs.current) {
        return false;
      }

      lastSyncedTimestampMs.current = remoteUpdatedAtMs || Date.now();
      const now = new Date();
      const timestampStr = `${now.toLocaleDateString('pt-BR')} ${now.toLocaleTimeString('pt-BR')}`;

      setState((prev) => ({
        ...prev,
        collaborators: remoteState.collaborators || prev.collaborators,
        tasks: remoteState.tasks || prev.tasks,
        breaks: remoteState.breaks || prev.breaks,
        attendance: remoteState.attendance || prev.attendance,
        intervals: remoteState.intervals || prev.intervals,
        roles: remoteState.roles || prev.roles,
        categories: remoteState.categories || prev.categories,
        scales: remoteState.scales || prev.scales,
        teamLeaders: remoteState.teamLeaders || prev.teamLeaders,
        reasons: remoteState.reasons || prev.reasons,
        dailyReports: remoteState.dailyReports || prev.dailyReports,
        teamName: remoteState.teamName || prev.teamName,
        sector: remoteState.sector || prev.sector,
        manager: remoteState.manager || prev.manager,
        teamShift: remoteState.teamShift || prev.teamShift,
        defaultTeamLeader: remoteState.defaultTeamLeader || prev.defaultTeamLeader,
        onlineSpreadsheet: prev.onlineSpreadsheet
          ? {
              ...prev.onlineSpreadsheet,
              lastSyncedAt: timestampStr,
              syncStatus: 'success',
              lastError: undefined,
            }
          : null,
      }));

      if (!isSilent) {
        showNotice('Dados sincronizados em tempo real com a planilha online!');
      }
      return true;
    } catch (err) {
      if (!isSilent) {
        console.warn('Erro ao buscar dados da planilha compartilhada:', err);
      }
      return false;
    }
  };

  const syncToOnlineSpreadsheet = async (isAutoSync = false): Promise<boolean> => {
    const currentConfig = state.onlineSpreadsheet;
    if (!currentConfig) {
      if (!isAutoSync) showNotice('Nenhuma planilha online conectada.');
      return false;
    }

    const webhookUrl = currentConfig.webhookUrl?.trim();
    if (!webhookUrl) {
      if (!isAutoSync) {
        showNotice('URL de Webhook (Google Apps Script) não informada. Configure nas opções para sincronizar na nuvem.');
      }
      return false;
    }

    // Check if user pasted standard Google Sheets URL into Webhook URL field
    if (webhookUrl.includes('docs.google.com/spreadsheets')) {
      const errMsg = 'A URL do Webhook deve ser o link do Web App do Google Apps Script (https://script.google.com/macros/s/.../exec), e não o link direto da planilha.';
      setState((prev) => ({
        ...prev,
        onlineSpreadsheet: prev.onlineSpreadsheet
          ? { ...prev.onlineSpreadsheet, syncStatus: 'error', lastError: errMsg, lastSyncedAt: undefined }
          : null,
      }));
      if (!isAutoSync) showNotice(`Erro de Configuração: ${errMsg}`);
      return false;
    }

    const now = new Date();
    const timestampMs = Date.now();
    lastSyncedTimestampMs.current = timestampMs;
    const timestampStr = `${now.toLocaleDateString('pt-BR')} ${now.toLocaleTimeString('pt-BR')}`;

    try {
      // Validate URL syntax
      new URL(webhookUrl);

      const dayReport = state.dailyReports[state.selectedDate] || {};

      // Calculate absenteeism & report metrics
      const totalCols = state.collaborators.length;
      let presentCount = 0;
      let absentCount = 0;
      let vacationCount = 0;
      let leaveTrainingCount = 0;
      let offCount = 0;

      const absenceDetailsList: any[] = [];

      state.collaborators.forEach((c) => {
        const statusInfo = getCollaboratorStatus(c, state.selectedDate, state);
        const taskName = state.tasks.find((t) => t.members.includes(c.id))?.name || 'Não Dimensionado';
        const reason = dayReport.absenceReasons?.[c.id] || '';
        const occurrence = dayReport.occurrences?.[c.id] || '';

        if (statusInfo.status === 'presente') {
          presentCount++;
        } else if (statusInfo.status === 'ausente') {
          absentCount++;
        } else if (statusInfo.status === 'ferias') {
          vacationCount++;
        } else if (statusInfo.status === 'licenca' || statusInfo.status === 'treinamento') {
          leaveTrainingCount++;
        } else if (statusInfo.status === 'folga') {
          offCount++;
        }

        if (statusInfo.status !== 'presente' || reason || occurrence) {
          absenceDetailsList.push({
            date: formatDateBR(state.selectedDate),
            registration: c.registration,
            name: c.name,
            login: c.login,
            role: c.role,
            category: c.category,
            teamLeader: c.teamLeader || state.defaultTeamLeader || 'Sem Líder',
            status: statusInfo.status,
            task: taskName,
            absenceReason: reason || (statusInfo.absenceDetail ? `${statusInfo.absenceDetail.type.toUpperCase()}: ${statusInfo.absenceDetail.notes || ''}` : 'Não informada'),
            occurrence: occurrence || 'Nenhuma',
          });
        }
      });

      const absenteeismRate = totalCols > 0 ? ((absentCount / totalCols) * 100).toFixed(1) + '%' : '0%';

      const payload = {
        rawState: {
          updatedAtMs: timestampMs,
          updatedAt: timestampStr,
          collaborators: state.collaborators,
          tasks: state.tasks,
          breaks: state.breaks,
          attendance: state.attendance,
          intervals: state.intervals,
          roles: state.roles,
          categories: state.categories,
          scales: state.scales,
          teamLeaders: state.teamLeaders,
          reasons: state.reasons,
          dailyReports: state.dailyReports,
          teamName: state.teamName,
          sector: state.sector,
          manager: state.manager,
          teamShift: state.teamShift,
          defaultTeamLeader: state.defaultTeamLeader,
          brandId: state.brandId,
        },
        date: formatDateBR(state.selectedDate),
        teamName: state.teamName,
        sector: state.sector,
        manager: state.manager,
        shift: state.teamShift,
        collaboratorsCount: state.collaborators.length,
        // Master CRUD Collaborators List
        collaboratorsMaster: state.collaborators.map((c) => ({
          id: c.id,
          registration: c.registration || '',
          name: c.name || '',
          login: c.login || '',
          sector: state.sector || '',
          manager: state.manager || '',
          shift: c.shift || state.teamShift || '',
          teamLeader: c.teamLeader || state.defaultTeamLeader || 'Sem Time',
          scale: c.scale || '',
          role: c.role || '',
          category: c.category || '',
          skills: (c.skills || []).map((s) => `${s.skillName} (${s.level})`).join(', ') || 'Nenhuma',
          status: c.status || 'Ativo',
        })),
        data: state.collaborators.map((c) => {
          const st = getCollaboratorStatus(c, state.selectedDate, state);
          const taskName = state.tasks.find((t) => t.members.includes(c.id))?.name || 'Não Dimensionado';
          const dayInt = state.intervals[state.selectedDate] || {};
          const breakSlot = state.breaks.find((b) => (dayInt[b.id] || []).includes(c.id))?.time || 'Sem Intervalo';
          return {
            date: formatDateBR(state.selectedDate),
            registration: c.registration,
            name: c.name,
            login: c.login,
            sector: state.sector,
            manager: state.manager,
            shift: c.shift || state.teamShift,
            teamLeader: c.teamLeader || state.defaultTeamLeader || 'Sem Time',
            scale: c.scale,
            role: c.role,
            category: c.category,
            status: st.status,
            task: taskName,
            interval: breakSlot,
          };
        }),
        reports: {
          date: formatDateBR(state.selectedDate),
          teamName: state.teamName,
          sector: state.sector,
          manager: state.manager,
          totalCollaborators: totalCols,
          presentCount,
          absentCount,
          vacationCount,
          leaveTrainingCount,
          offCount,
          absenteeismRate,
          generalNotes: dayReport.generalNotes || 'Nenhuma observação',
          generatedAt: dayReport.generatedAt || timestampStr,
          absencesAndOccurrences: absenceDetailsList,
        },
        settings: {
          teamName: state.teamName,
          sector: state.sector,
          manager: state.manager,
          teamShift: state.teamShift,
          defaultTeamLeader: state.defaultTeamLeader || 'Sem Líder Padrão',
          onlineSpreadsheetName: currentConfig.name,
          onlineSpreadsheetUrl: currentConfig.url,
          onlineWebhookUrl: currentConfig.webhookUrl || 'Não configurado',
          autoSyncEnabled: currentConfig.autoSyncEnabled !== false ? 'Sim' : 'Não',
          roles: state.roles,
          categories: state.categories,
          scales: state.scales,
          teamLeaders: state.teamLeaders,
          reasons: state.reasons,
          tasks: state.tasks.map((t) => ({
            id: t.id,
            name: t.name,
            membersCount: t.members.length,
            allowedRoles: t.allowedRoles || [],
            allowedCategories: t.allowedCategories || [],
          })),
          breaks: state.breaks.map((b) => ({
            id: b.id,
            time: b.time,
            shift: b.shift || 'Geral',
          })),
          totalCollaborators: state.collaborators.length,
          updatedAt: timestampStr,
        },
      };

      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload),
        mode: 'no-cors',
      });

      // Update state to reflection success
      setState((prev) => ({
        ...prev,
        onlineSpreadsheet: prev.onlineSpreadsheet
          ? {
              ...prev.onlineSpreadsheet,
              lastSyncedAt: timestampStr,
              syncCount: (prev.onlineSpreadsheet.syncCount || 0) + 1,
              syncStatus: 'success',
              lastError: undefined,
            }
          : null,
      }));

      if (!isAutoSync) {
        showNotice(`Sincronização realizada com sucesso! Planilha "${currentConfig.name}" atualizada.`);
      }
      return true;
    } catch (err) {
      console.warn('Sincronização com Google Sheets não pôde ser concluída:', err);
      
      const detailedError = 'Falha ao conectar com o Google Apps Script. Verifique se no Apps Script a opção "Quem tem acesso" foi configurada como "Qualquer pessoa" e se o link termina em "/exec".';

      setState((prev) => ({
        ...prev,
        onlineSpreadsheet: prev.onlineSpreadsheet
          ? {
              ...prev.onlineSpreadsheet,
              syncStatus: 'error',
              lastSyncedAt: undefined, // Clear synced status so system reverts to local storage display
              lastError: detailedError,
            }
          : null,
      }));

      if (!isAutoSync) {
        showNotice(detailedError);
      }
      return false;
    }
  };

  // Real-time Auto-Sync Effect when Collaborator, Task, Break or Settings change
  const isFirstRenderForAutoSync = useRef(true);
  useEffect(() => {
    if (isFirstRenderForAutoSync.current) {
      isFirstRenderForAutoSync.current = false;
      return;
    }

    lastLocalEditTime.current = Date.now();

    if (
      state.onlineSpreadsheet &&
      state.onlineSpreadsheet.webhookUrl &&
      state.onlineSpreadsheet.autoSyncEnabled !== false
    ) {
      const timer = setTimeout(() => {
        syncToOnlineSpreadsheet(true);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [
    state.collaborators,
    state.tasks,
    state.breaks,
    state.attendance,
    state.intervals,
    state.teamName,
    state.sector,
    state.manager,
    state.teamShift,
    state.roles,
    state.categories,
    state.teamLeaders,
    state.selectedDate,
    state.dailyReports,
  ]);

  // Background polling effect to receive changes from other team members using the same spreadsheet
  useEffect(() => {
    const currentConfig = state.onlineSpreadsheet;
    if (!currentConfig || !currentConfig.webhookUrl || currentConfig.autoSyncEnabled === false) {
      return;
    }

    const interval = setInterval(() => {
      // Only pull if user hasn't edited locally in the last 3.5 seconds
      if (Date.now() - lastLocalEditTime.current > 3500) {
        fetchFromOnlineSpreadsheet(true);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [state.onlineSpreadsheet?.webhookUrl, state.onlineSpreadsheet?.autoSyncEnabled]);

  return (
    <AppContext.Provider
      value={{
        state,
        setDate,
        setYear,
        setTeamInfo,
        setTheme,
        setBrandId,
        addCollaborator,
        updateCollaborator,
        deleteCollaborator,
        restoreCollaborator,
        permanentlyDeleteCollaborator,
        clearTrashBin,
        addScheduledAbsence,
        removeScheduledAbsence,
        addTask,
        updateTask,
        deleteTask,
        addBreakSlot,
        updateBreakSlot,
        deleteBreakSlot,
        markDayScale,
        generate6x2Scale,
        toggleAttendance,
        resetAttendance,
        assignTask,
        unassignTask,
        clearAssignments,
        clearTaskAssignments,
        autoAssign,
        undo,
        canUndo,
        moveBreakInterval,
        generateBreaks,
        addCatalogItem,
        removeCatalogItem,
        editCatalogItem,
        editTeamLeader,
        setSelectedGlobalFilters,
        setModuleVisibility,
        setSkillLevel,
        setAbsenceReason,
        setOccurrence,
        setGeneralNotes,
        saveDailyReport,
        saveHistory,
        importFullState,
        importRosterRows,
        resetAllData,
        clearSampleData,
        lastAutoBackupInfo,
        createAutoBackup,
        restoreFromAutoBackup,
        disconnectOnlineSpreadsheet,
        noticeMessage: noticeState.message,
        noticeActionLabel: noticeState.actionLabel,
        onNoticeAction: noticeState.onAction,
        showNotice,
        addTeamLeader,
        removeTeamLeader,
        setOnlineSpreadsheetConfig,
        syncToOnlineSpreadsheet,
        fetchFromOnlineSpreadsheet,
        exportLocalSpreadsheet,
        exportTeamRosterSpreadsheet,
        generateTemplateSpreadsheet,
        addProcessKnowledge,
        updateProcessKnowledge,
        deleteProcessKnowledge,
        toggleSidebarCollapsed,
        setSidebarCollapsed,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
