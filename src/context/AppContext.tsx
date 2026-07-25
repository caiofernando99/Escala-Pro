import React, { createContext, useContext, useEffect, useState } from 'react';
import { AppState, BreakSlot, Collaborator, ScheduledAbsence, ShiftGroup, Task, ThemeOption } from '../types';
import { generateId, isScaleOff, getTodayISO } from '../utils/helpers';
import { initialAppState } from '../utils/initialData';

const STORAGE_KEY = 'people-scheduler-v3';

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
  addScheduledAbsence: (collaboratorId: string, absence: Omit<ScheduledAbsence, 'id'>) => void;
  removeScheduledAbsence: (collaboratorId: string, absenceId: string) => void;
  addTask: (name: string, allowedRoles?: string[], allowedCategories?: string[]) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  addBreakSlot: (time: string, capacity: number, shift?: string) => void;
  updateBreakSlot: (id: string, updates: Partial<BreakSlot>) => void;
  deleteBreakSlot: (id: string) => void;
  markDayScale: (dateStr: string, scale: ShiftGroup | '') => void;
  generate6x2Scale: (startDate: string, firstGroup: ShiftGroup) => void;
  toggleAttendance: (collaboratorId: string, present: boolean) => void;
  resetAttendance: () => void;
  assignTask: (collaboratorId: string, taskId: string) => void;
  unassignTask: (collaboratorId: string) => void;
  clearAssignments: () => void;
  autoAssign: () => void;
  moveBreakInterval: (collaboratorId: string, fromBreakId: string | null, toBreakId: string | null) => void;
  generateBreaks: () => void;
  addCatalogItem: (key: 'roles' | 'categories' | 'skills', item: string) => void;
  removeCatalogItem: (key: 'roles' | 'categories' | 'skills', item: string) => void;
  setSkillLevel: (collaboratorId: string, skill: string, level: number) => void;
  setAbsenceReason: (collaboratorId: string, reason: string) => void;
  setOccurrence: (collaboratorId: string, text: string) => void;
  setGeneralNotes: (notes: string) => void;
  saveDailyReport: () => void;
  saveHistory: () => void;
  importFullState: (newState: Partial<AppState>) => void;
  importRosterRows: (rows: any[]) => number;
  resetAllData: () => void;
  noticeMessage: string | null;
  showNotice: (msg: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...initialAppState,
          ...parsed,
          theme: parsed.theme || 'slate',
        };
      }
    } catch {
      // Fallback
    }
    return initialAppState;
  });

  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);

  const showNotice = (msg: string) => {
    setNoticeMessage(msg);
    setTimeout(() => {
      setNoticeMessage((prev) => (prev === msg ? null : prev));
    }, 3500);
  };

  // Save state to localStorage whenever state changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
      console.error('Failed to save state to localStorage', err);
    }
  }, [state]);

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
    const newCol: Collaborator = {
      id: generateId(),
      name: customProps?.name || 'Novo Colaborador',
      login: customProps?.login || '',
      registration: customProps?.registration || '',
      shift: customProps?.shift || state.teamShift || 'T2',
      scale: customProps?.scale || 'A',
      role: customProps?.role || (state.roles[0] || 'Operador de Processo'),
      category: customProps?.category || (state.categories[0] || 'Inbound'),
      skills: customProps?.skills || {},
      notes: customProps?.notes || '',
      absences: customProps?.absences || [],
    };
    setState((prev) => ({
      ...prev,
      collaborators: [...prev.collaborators, newCol],
    }));
    showNotice('Novo colaborador cadastrado.');
  };

  const updateCollaborator = (id: string, updates: Partial<Collaborator>) => {
    setState((prev) => ({
      ...prev,
      collaborators: prev.collaborators.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    }));
  };

  const deleteCollaborator = (id: string) => {
    setState((prev) => ({
      ...prev,
      collaborators: prev.collaborators.filter((c) => c.id !== id),
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
    showNotice('Colaborador removido.');
  };

  const addScheduledAbsence = (collaboratorId: string, absence: Omit<ScheduledAbsence, 'id'>) => {
    const newAbsence: ScheduledAbsence = {
      ...absence,
      id: generateId(),
    };
    setState((prev) => ({
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
    }));
    showNotice('Afastamento (Férias/Licença/Treinamento) cadastrado.');
  };

  const removeScheduledAbsence = (collaboratorId: string, absenceId: string) => {
    setState((prev) => ({
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
    }));
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
    setState((prev) => ({
      ...prev,
      tasks: [...prev.tasks, newTask],
    }));
    showNotice(`Tarefa "${name}" adicionada.`);
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    }));
  };

  const deleteTask = (id: string) => {
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.filter((t) => t.id !== id),
    }));
    showNotice('Tarefa excluída.');
  };

  const addBreakSlot = (time: string, capacity: number, shift?: string) => {
    const newSlot: BreakSlot = {
      id: generateId(),
      time: time || '20:00',
      shift: shift || state.teamShift || 'T2',
      capacity: Math.max(1, capacity || 1),
    };
    setState((prev) => ({
      ...prev,
      breaks: [...prev.breaks, newSlot],
    }));
    showNotice('Horário de intervalo adicionado.');
  };

  const updateBreakSlot = (id: string, updates: Partial<BreakSlot>) => {
    setState((prev) => ({
      ...prev,
      breaks: prev.breaks.map((b) => (b.id === id ? { ...b, ...updates } : b)),
    }));
  };

  const deleteBreakSlot = (id: string) => {
    setState((prev) => ({
      ...prev,
      breaks: prev.breaks.filter((b) => b.id !== id),
    }));
    showNotice('Horário de intervalo removido.');
  };

  const markDayScale = (dateStr: string, scale: ShiftGroup | '') => {
    setState((prev) => {
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
      const dateKey = prev.selectedDate;
      const newAtt = { ...prev.attendance };
      delete newAtt[dateKey];
      return { ...prev, attendance: newAtt };
    });
    showNotice('Presença restaurada conforme o cálculo automático da escala.');
  };

  const assignTask = (collaboratorId: string, taskId: string) => {
    setState((prev) => {
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
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) => ({
        ...t,
        members: t.members.filter((m) => m !== collaboratorId),
      })),
    }));
  };

  const clearAssignments = () => {
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) => ({ ...t, members: [] })),
    }));
    showNotice('Dimensionamento de tarefas limpo.');
  };

  const autoAssign = () => {
    setState((prev) => {
      if (!prev.tasks.length) return prev;
      const activePeople = prev.collaborators.filter((c) => {
        // active if not on vacation/leave/training and not scale off
        const hasAbsence = (c.absences || []).some((a) => prev.selectedDate >= a.startDate && prev.selectedDate <= a.endDate);
        const off = isScaleOff(prev.calendar, prev.selectedDate, c.scale);
        const manual = prev.attendance[prev.selectedDate]?.[c.id];
        if (hasAbsence) return false;
        if (manual !== undefined) return manual;
        return !off;
      });

      const sorted = [...activePeople].sort((a, b) => a.name.localeCompare(b.name));
      const newTasks = prev.tasks.map((t) => ({ ...t, members: [] as string[] }));

      sorted.forEach((p, idx) => {
        // Try matching task by role/category if set
        let matchedTaskIndex = newTasks.findIndex(
          (t) =>
            (t.allowedRoles?.length ? t.allowedRoles.includes(p.role) : true) &&
            (t.allowedCategories?.length ? t.allowedCategories.includes(p.category) : true)
        );
        if (matchedTaskIndex === -1) {
          matchedTaskIndex = idx % newTasks.length;
        }
        newTasks[matchedTaskIndex].members.push(p.id);
      });

      return { ...prev, tasks: newTasks };
    });
    showNotice('Auto dimensionamento concluído.');
  };

  const moveBreakInterval = (collaboratorId: string, fromBreakId: string | null, toBreakId: string | null) => {
    setState((prev) => {
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
          (b) => (!b.shift || b.shift === 'Geral' || b.shift === person.shift) && result[b.id].length < b.capacity
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
      if (prev[key].includes(trimmed)) return prev;
      return { ...prev, [key]: [...prev[key], trimmed] };
    });
    showNotice(`Item "${trimmed}" adicionado a ${key}.`);
  };

  const removeCatalogItem = (key: 'roles' | 'categories' | 'skills', item: string) => {
    setState((prev) => ({
      ...prev,
      [key]: prev[key].filter((i) => i !== item),
    }));
    showNotice('Item removido.');
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
    setState((prev) => ({
      ...initialAppState,
      ...newState,
      theme: newState.theme || prev.theme || 'slate',
    }));
    showNotice('Configurações e dados importados com sucesso!');
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

        const name = getVal('nome', 'colaborador', 'name');
        if (!name) return;

        const role = getVal('cargo', 'função', 'funcao', 'role') || 'Operador de Processo';
        const category = getVal('categoria', 'category') || 'Inbound';

        if (role) newRoles.add(role);
        if (category) newCats.add(category);

        newCols.push({
          id: generateId(),
          name,
          login: getVal('login', 'login amazon', 'user'),
          registration: getVal('matrícula', 'matricula', 'id'),
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
    localStorage.removeItem(STORAGE_KEY);
    setState({
      ...initialAppState,
      selectedDate: getTodayISO(),
    });
    showNotice('Todos os dados foram completamente resetados.');
  };

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
        autoAssign,
        moveBreakInterval,
        generateBreaks,
        addCatalogItem,
        removeCatalogItem,
        setSkillLevel,
        setAbsenceReason,
        setOccurrence,
        setGeneralNotes,
        saveDailyReport,
        saveHistory,
        importFullState,
        importRosterRows,
        resetAllData,
        noticeMessage,
        showNotice,
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
