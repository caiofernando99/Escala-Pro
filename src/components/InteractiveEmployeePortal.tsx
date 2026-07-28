import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../context/AppContext';
import { EscalaProLogo } from './EscalaProLogo';
import {
  Search,
  Filter,
  User,
  Users,
  Briefcase,
  Clock,
  CheckCircle2,
  Calendar,
  Share2,
  Check,
  Palmtree,
  Stethoscope,
  Sun,
  UserX,
  X,
  ChevronDown,
  Layers,
  Sparkles,
  Info,
  RefreshCw,
  Award,
  ShieldCheck,
} from 'lucide-react';
import { matchesSearch, isScaleOff, formatDateBR, formatDateLongBR, encodeSharedState, decodeSharedState } from '../utils/helpers';

interface InteractiveEmployeePortalProps {
  onClose?: () => void;
  isStandalonePortal?: boolean;
}

const STORAGE_KEY = 'people-scheduler-v3';

export const InteractiveEmployeePortal: React.FC<InteractiveEmployeePortalProps> = ({ onClose, isStandalonePortal = false }) => {
  const { state: defaultState, showNotice } = useApp();

  // Parse URL parameter snapshot if present
  const [urlState] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const dataParam = params.get('data');
      if (dataParam) {
        const decoded = decodeSharedState(dataParam);
        if (decoded) return decoded;
      }
    } catch {
      // Fallback
    }
    return null;
  });

  // Live state that updates dynamically in real-time
  const [liveState, setLiveState] = useState(() => {
    return urlState ? { ...defaultState, ...urlState } : defaultState;
  });

  const [lastSyncTime, setLastSyncTime] = useState<string>(() =>
    new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  );

  // Listen to BroadcastChannel and storage events for real-time updates across windows/tabs
  useEffect(() => {
    let bc: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== 'undefined') {
      bc = new BroadcastChannel('escalapro_live_channel');
      bc.onmessage = (event) => {
        if (event.data && event.data.type === 'STATE_UPDATED' && event.data.state) {
          setLiveState(event.data.state);
          setLastSyncTime(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        }
      };
    }

    const handleStorageEvent = (e: StorageEvent) => {
      if ((e.key === STORAGE_KEY || e.key === 'escalapro_state_v1') && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (parsed) {
            setLiveState((prev) => ({ ...prev, ...parsed }));
            setLastSyncTime(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
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

  // Update liveState when defaultState in App Context changes (if not running solely on immutable URL state)
  useEffect(() => {
    if (!urlState) {
      setLiveState(defaultState);
      setLastSyncTime(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }
  }, [defaultState, urlState]);

  const state = liveState;

  const [searchName, setSearchName] = useState('');
  const [selectedRole, setSelectedRole] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedTL, setSelectedTL] = useState('ALL');
  const [selectedCollabId, setSelectedCollabId] = useState<string | null>(null);
  const [portalViewMode, setPortalViewMode] = useState<'tasks' | 'collaborators'>('tasks');
  const [copiedLink, setCopiedLink] = useState(false);

  const activeDate = state.selectedDate || defaultState.selectedDate || new Date().toISOString().split('T')[0];

  // Handle intervals whether snapshot or full state
  const dayIntervals = (state.intervals && state.intervals[activeDate])
    ? state.intervals[activeDate]
    : (state.intervals || {});

  // All unique roles and categories
  const allRoles = Array.from(new Set((state.collaborators || []).map((c: any) => c.role).filter(Boolean)));
  const allCategories = Array.from(new Set((state.collaborators || []).map((c: any) => c.category).filter(Boolean)));

  // Find break slot
  const getBreakSlot = (collabId: string) => {
    const slot = (state.breaks || []).find((b: any) => (dayIntervals[b.id] || []).includes(collabId));
    return slot ? slot.time : 'Intervalo pendente';
  };

  // Find task assigned
  const getTaskAssigned = (collabId: string) => {
    const task = (state.tasks || []).find((t: any) => (t.members || []).includes(collabId));
    return task ? task.name : 'Apoio Geral / Não Dimensionado';
  };

  // Status helper for person on active date
  const getPersonStatus = (collabId: string) => {
    const col = (state.collaborators || []).find((c: any) => c.id === collabId);
    if (!col) return { status: 'desconhecido', label: 'Indefinido', color: 'bg-slate-100 text-slate-800 border-slate-300' };

    const activeAbsence = (col.absences || []).find((a: any) => activeDate >= a.startDate && activeDate <= a.endDate);
    if (activeAbsence) {
      if (activeAbsence.type === 'ferias') return { status: 'ferias', label: 'Em Férias', color: 'bg-purple-100 text-purple-900 border-purple-300 dark:bg-purple-950 dark:text-purple-200' };
      if (activeAbsence.type === 'licenca') return { status: 'licenca', label: 'Em Licença', color: 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950 dark:text-amber-200' };
      if (activeAbsence.type === 'treinamento') return { status: 'treinamento', label: 'Em Treinamento', color: 'bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-950 dark:text-blue-200' };
    }

    const offScale = isScaleOff(state.calendar || {}, activeDate, col.scale);
    if (offScale) {
      return { status: 'folga', label: 'Folga 6x2', color: 'bg-slate-200 text-slate-900 border-slate-400 dark:bg-slate-800 dark:text-slate-200' };
    }

    const manual = state.attendance?.[activeDate]?.[collabId];
    if (manual === false) {
      return { status: 'ausente', label: 'Ausente (Falta)', color: 'bg-red-100 text-red-900 border-red-300 dark:bg-red-950 dark:text-red-200' };
    }

    return { status: 'presente', label: 'Escalado Hoje', color: 'bg-emerald-100 text-emerald-950 border-emerald-400 font-black dark:bg-emerald-950 dark:text-emerald-200' };
  };

  // Filtered collaborators list
  const isSearching = searchName.trim().length > 0 || selectedCollabId !== null;

  const filteredCollaborators = (state.collaborators || []).filter((col: any) => {
    const colTL = col.teamLeader || state.defaultTeamLeader || 'Sem Time';
    const matchesQuery = matchesSearch(col.name, searchName) || matchesSearch(col.role, searchName) || matchesSearch(colTL, searchName);
    const matchesRole = selectedRole === 'ALL' || col.role === selectedRole;
    const matchesCategory = selectedCategory === 'ALL' || col.category === selectedCategory;
    const matchesTL = selectedTL === 'ALL' || colTL === selectedTL;

    if (!matchesQuery || !matchesRole || !matchesCategory || !matchesTL) return false;

    // Check if collaborator is off on active date
    const st = getPersonStatus(col.id);
    const isOffToday = st.status === 'folga' || st.status === 'ferias' || st.status === 'licenca' || st.status === 'ausente';

    // Hide off-duty collaborators by default unless user is searching
    if (!isSearching && isOffToday) {
      return false;
    }

    return true;
  });

  // Selected collaborator details
  const activeCollab = (state.collaborators || []).find((c: any) => c.id === selectedCollabId) || null;

  const handleCopyPublicLink = () => {
    const dataHash = encodeSharedState(state as any);
    const publicUrl = `${window.location.origin}${window.location.pathname}?view=employee_portal&date=${activeDate}&data=${dataHash}`;
    navigator.clipboard.writeText(publicUrl);
    setCopiedLink(true);
    if (showNotice) showNotice('Link público do Portal do Colaborador copiado!');
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-[var(--bg)] text-[var(--ink)] min-h-screen p-3 md:p-6 space-y-5"
    >
      {/* Top Banner */}
      <div className="bg-[var(--paper)] border-2 border-[var(--primary-border)] p-4 md:p-5 rounded-2xl shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <EscalaProLogo size="lg" variant="light" />
          <div className="border-l border-[var(--line)] pl-4">
            <span className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider block">
              Portal do Colaborador • Consulta Online
            </span>
            <span className="text-sm font-extrabold text-[var(--ink)]">
              {state.teamName || 'Equipe Operacional'} • {state.sector || 'Operação'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleCopyPublicLink}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
            title="Copiar link contendo as tarefas e horários de hoje"
          >
            {copiedLink ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
            <span>{copiedLink ? 'Link Copiado!' : 'Compartilhar Link do Portal'}</span>
          </motion.button>

          {!isStandalonePortal && onClose && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onClose}
              className="px-4 py-2.5 border border-[var(--line)] bg-[var(--paper)] hover:bg-[var(--bg)] text-[var(--ink)] text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
            >
              <X className="w-4 h-4" />
              <span>Voltar ao Painel</span>
            </motion.button>
          )}
        </div>
      </div>

      {/* PROMINENT ACTIVE DATE HIGHLIGHT BAR & LIVE STATUS BELOW HEADER */}
      <div className="bg-[var(--primary-soft)] border-2 border-[var(--primary-border)] p-3 px-4 rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs font-black text-[var(--primary)] shadow-2xs">
        <div className="flex items-center gap-2">
          <Calendar className="w-4.5 h-4.5 shrink-0" />
          <span>ESCALA E INTERVALOS DO DIA:</span>
          <span className="text-sm px-3 py-0.5 bg-[var(--paper)] border border-[var(--primary-border)] rounded-lg shadow-2xs tracking-wide">
            {formatDateBR(activeDate)}
          </span>
          <span className="text-[11px] font-bold opacity-80 capitalize hidden sm:inline">
            ({formatDateLongBR(activeDate)})
          </span>
        </div>

        <div className="flex items-center gap-2 bg-emerald-100 text-emerald-950 dark:bg-emerald-950 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800 px-3 py-1 rounded-lg text-[10.5px] font-bold">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>SINCRONIZADO EM TEMPO REAL</span>
          <span className="opacity-70 font-mono">({lastSyncTime})</span>
        </div>
      </div>

      {/* Search & Quick Selector Box for Employees */}
      <div className="bg-[var(--paper)] border border-[var(--line)] p-4 md:p-5 rounded-2xl shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-extrabold text-[var(--primary)]">
            <Search className="w-4 h-4" />
            <h3>Consulte Sua Tarefa e Seu Horário de Intervalo</h3>
          </div>
          <span className="text-[11px] text-[var(--muted)] font-semibold hidden md:inline">
            Clique no seu nome para ver detalhes individuais
          </span>
        </div>

        {/* SEARCH AND DIRECT SELECTOR */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Quick Dropdown Picker */}
          <div className="md:col-span-5">
            <label className="block text-xs font-bold text-[var(--muted)] mb-1 flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-purple-600" />
              <span>Selecione seu Nome na Lista:</span>
            </label>
            <select
              value={selectedCollabId || ''}
              onChange={(e) => {
                setSelectedCollabId(e.target.value || null);
                if (e.target.value) setSearchName('');
              }}
              className="w-full px-3.5 py-2.5 rounded-xl border-2 border-[var(--primary-border)] bg-[var(--bg)] text-sm font-black text-[var(--ink)] focus:ring-2 focus:ring-[var(--primary)] cursor-pointer"
            >
              <option value="">-- Escolha seu nome para rápida consulta --</option>
              {(state.collaborators || [])
                .slice()
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((col: any) => (
                  <option key={col.id} value={col.id}>
                    {col.name} ({col.role || 'Operação'})
                  </option>
                ))}
            </select>
          </div>

          {/* Name/Text Search Box */}
          <div className="md:col-span-7">
            <label className="block text-xs font-bold text-[var(--muted)] mb-1 flex items-center gap-1">
              <Search className="w-3.5 h-3.5 text-[var(--primary)]" />
              <span>Ou digite seu nome / matrícula para pesquisar:</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchName}
                onChange={(e) => {
                  setSearchName(e.target.value);
                  if (selectedCollabId) setSelectedCollabId(null);
                }}
                placeholder="Ex: Carlos Silva, Maria Santos..."
                className="w-full pl-3.5 pr-8 py-2.5 rounded-xl border border-[var(--line)] bg-[var(--bg)] text-sm font-bold text-[var(--ink)] focus:ring-2 focus:ring-[var(--primary)]"
              />
              {searchName && (
                <button
                  onClick={() => setSearchName('')}
                  className="absolute right-2.5 top-3 text-[var(--muted)] hover:text-[var(--ink)] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Advanced Filters Toggle */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-[var(--line)]">
          {/* TL Filter */}
          <div>
            <label className="block text-[11px] font-bold text-[var(--muted)] mb-1">
              Time / Liderança (TL):
            </label>
            <select
              value={selectedTL}
              onChange={(e) => setSelectedTL(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl border border-[var(--line)] bg-[var(--bg)] text-xs font-bold text-[var(--ink)] cursor-pointer"
            >
              <option value="ALL">Todos os Times ({(state.teamLeaders || []).length})</option>
              {(state.teamLeaders || []).map((tl: string) => (
                <option key={tl} value={tl}>
                  {tl}
                </option>
              ))}
            </select>
          </div>

          {/* Role Filter */}
          <div>
            <label className="block text-[11px] font-bold text-[var(--muted)] mb-1">
              Cargo / Função:
            </label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl border border-[var(--line)] bg-[var(--bg)] text-xs font-bold text-[var(--ink)] cursor-pointer"
            >
              <option value="ALL">Todos os Cargos ({allRoles.length})</option>
              {allRoles.map((r: any) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-[11px] font-bold text-[var(--muted)] mb-1">
              Categoria / Nível:
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl border border-[var(--line)] bg-[var(--bg)] text-xs font-bold text-[var(--ink)] cursor-pointer"
            >
              <option value="ALL">Todas as Categorias ({allCategories.length})</option>
              {allCategories.map((c: any) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ACTIVE SELECTED EMPLOYEE CARD HIGHLIGHT WITH MOTION */}
      <AnimatePresence mode="wait">
        {activeCollab && (
          <motion.div
            key={activeCollab.id}
            initial={{ opacity: 0, scale: 0.96, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -8 }}
            transition={{ duration: 0.25 }}
            className="bg-gradient-to-r from-purple-900 via-indigo-900 to-blue-900 text-white p-5 md:p-6 rounded-2xl shadow-xl space-y-4 border-2 border-purple-400 relative overflow-hidden"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/20 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/15 text-white font-black flex items-center justify-center text-xl border border-white/25 shrink-0 shadow-xs">
                  {activeCollab.name.charAt(0)}
                </div>
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-purple-200 block">
                    SEU RESUMO OPERACIONAL • {formatDateBR(activeDate)}
                  </span>
                  <h2 className="text-2xl font-black text-white">{activeCollab.name}</h2>
                  <p className="text-xs text-white/80 font-medium">
                    {activeCollab.role || 'Operador'} • Categoria: {activeCollab.category || 'Geral'} • Liderança: {activeCollab.teamLeader || state.defaultTeamLeader || 'Sem Time'}
                  </p>
                </div>
              </div>

              <div className="shrink-0 flex items-center gap-2">
                {(() => {
                  const st = getPersonStatus(activeCollab.id);
                  return (
                    <span className={`px-4 py-1.5 rounded-full text-xs font-black border shadow-xs ${st.color}`}>
                      {st.label}
                    </span>
                  );
                })()}

                <button
                  onClick={() => setSelectedCollabId(null)}
                  className="p-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl cursor-pointer transition-colors"
                  title="Fechar resumo"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
              {/* Task Assigned */}
              <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/20 space-y-1">
                <div className="text-xs font-bold text-purple-200 flex items-center gap-1.5">
                  <Briefcase className="w-4 h-4 text-purple-300" />
                  <span>Sua Tarefa Escalada Hoje</span>
                </div>
                <div className="text-xl font-black text-white">{getTaskAssigned(activeCollab.id)}</div>
              </div>

              {/* Break / Meal Time */}
              <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/20 space-y-1">
                <div className="text-xs font-bold text-amber-200 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-300 animate-pulse" />
                  <span>Seu Horário de Refeição</span>
                </div>
                <div className="text-xl font-black text-amber-200">{getBreakSlot(activeCollab.id)}</div>
              </div>

              {/* Shift Scale Status */}
              <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/20 space-y-1">
                <div className="text-xs font-bold text-emerald-200 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-emerald-300" />
                  <span>Escala Operacional</span>
                </div>
                <div className="text-xl font-black text-emerald-200">Turno 6x2 ({activeCollab.scale})</div>
              </div>
            </div>

            {/* Active Skills */}
            {activeCollab.skills && Object.entries(activeCollab.skills).filter(([_, lvl]) => Number(lvl) > 0).length > 0 && (
              <div className="pt-2 border-t border-white/15 flex flex-wrap items-center gap-2">
                <span className="text-xs font-extrabold text-purple-200 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-purple-300" />
                  <span>Habilidades Cadastradas:</span>
                </span>
                {Object.entries(activeCollab.skills)
                  .filter(([_, lvl]) => Number(lvl) > 0)
                  .map(([sName]) => (
                    <span
                      key={sName}
                      className="px-2.5 py-1 rounded-lg bg-white/15 text-white border border-white/20 text-xs font-extrabold shadow-2xs"
                    >
                      {sName}
                    </span>
                  ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* VIEW SWITCHER TABS: VISÃO POR TAREFAS VS VISÃO POR COLABORADORES */}
      <div className="flex items-center justify-between border-b border-[var(--line)] pb-3 pt-2">
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setPortalViewMode('tasks')}
            className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
              portalViewMode === 'tasks'
                ? 'bg-[var(--primary)] text-white shadow-xs'
                : 'bg-[var(--paper)] border border-[var(--line)] text-[var(--ink)] hover:bg-[var(--bg)]'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Escala por Tarefas & Horários</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setPortalViewMode('collaborators')}
            className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
              portalViewMode === 'collaborators'
                ? 'bg-[var(--primary)] text-white shadow-xs'
                : 'bg-[var(--paper)] border border-[var(--line)] text-[var(--ink)] hover:bg-[var(--bg)]'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Lista de Colaboradores ({filteredCollaborators.length})</span>
          </motion.button>
        </div>

        <span className="text-xs text-[var(--muted)] font-bold hidden sm:inline">
          Interface otimizada para celulares e computadores
        </span>
      </div>

      {/* TAB CONTENT 1: VISÃO POR TAREFAS E HORÁRIOS DE INTERVALO DENTRO DAS TAREFAS */}
      {portalViewMode === 'tasks' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="space-y-4"
        >
          <div className="columns-1 sm:columns-2 xl:columns-3 gap-3 space-y-3 [&>div]:break-inside-avoid">
            {state.tasks.map((task) => {
              // Get members assigned to this task that are in filtered list
              const taskMembers = task.members
                .map((id) => (state.collaborators || []).find((c) => c.id === id))
                .filter((c): c is NonNullable<typeof c> => {
                  if (!c) return false;
                  return filteredCollaborators.some((fc) => fc.id === c.id);
                });

              // Group members by break slot
              const timeSlotGroups: Array<{
                slot: typeof state.breaks[number] | null;
                members: typeof taskMembers;
              }> = [];

              (state.breaks || []).forEach((b) => {
                const inThisSlot = taskMembers.filter((m) => (dayIntervals[b.id] || []).includes(m.id));
                if (inThisSlot.length > 0 || isSearching) {
                  timeSlotGroups.push({
                    slot: b,
                    members: inThisSlot,
                  });
                }
              });

              const noSlotMembers = taskMembers.filter((m) => !(state.breaks || []).some((b) => (dayIntervals[b.id] || []).includes(m.id)));
              if (noSlotMembers.length > 0) {
                timeSlotGroups.push({
                  slot: null,
                  members: noSlotMembers,
                });
              }

              return (
                <motion.div
                  key={task.id}
                  whileHover={{ y: -2 }}
                  transition={{ duration: 0.2 }}
                  className="bg-[var(--paper)] border-2 border-[var(--line)] rounded-2xl p-4 shadow-xs space-y-3 break-inside-avoid"
                >
                  <div>
                    {/* Task Header */}
                    <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-[var(--primary-soft)] text-[var(--primary)] rounded-xl shrink-0">
                          <Briefcase className="w-4 h-4" />
                        </div>
                        <h4 className="font-extrabold text-base text-[var(--ink)] leading-snug">
                          {task.name}
                        </h4>
                      </div>
                      <span className="text-xs font-black bg-[var(--primary-soft)] text-[var(--primary)] px-2.5 py-1 rounded-full border border-[var(--primary-border)] shrink-0">
                        {taskMembers.length} {taskMembers.length === 1 ? 'pessoa' : 'pessoas'}
                      </span>
                    </div>

                    {/* Time Slots & Members */}
                    <div className="space-y-3 mt-3">
                      {timeSlotGroups.map(({ slot, members }) => {
                        const slotLabel = slot ? slot.time : 'Intervalo não definido';

                        return (
                          <div key={slot ? slot.id : 'no-slot'} className="space-y-2">
                            {/* Time Slot Divider Bar */}
                            <div className="bg-[var(--bg)] border border-[var(--line)] px-3 py-1.5 rounded-xl flex items-center justify-between">
                              <span className="text-xs font-black text-[var(--ink)] flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                                <span>Refeição: <strong className="text-amber-700 dark:text-amber-300 font-extrabold">{slotLabel}</strong></span>
                              </span>
                              <span className="text-[10px] font-bold text-[var(--muted)]">
                                {members.length} {members.length === 1 ? 'membro' : 'membros'}
                              </span>
                            </div>

                            {/* Members in slot */}
                            {members.length > 0 ? (
                              <div className="space-y-1.5 pl-1">
                                {members.map((m) => {
                                  const st = getPersonStatus(m.id);
                                  const isSelected = selectedCollabId === m.id;

                                  return (
                                    <motion.div
                                      key={m.id}
                                      whileHover={{ scale: 1.01 }}
                                      whileTap={{ scale: 0.99 }}
                                      onClick={() => setSelectedCollabId(m.id)}
                                      className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                                        isSelected
                                          ? 'border-[var(--primary)] bg-[var(--primary-soft)] ring-2 ring-[var(--primary-border)] shadow-xs'
                                          : 'border-[var(--line)] bg-[var(--paper)] hover:border-purple-400'
                                      }`}
                                    >
                                      <div className="flex items-start justify-between gap-2">
                                        <div>
                                          <span className="font-extrabold text-xs text-[var(--ink)] block">
                                            {m.name}
                                          </span>
                                          <span className="text-[10px] text-[var(--muted)] font-semibold">
                                            {m.role || 'Sem cargo'} • {m.category || 'Sem cat'}
                                          </span>
                                        </div>
                                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black border shrink-0 ${st.color}`}>
                                          {st.label}
                                        </span>
                                      </div>

                                      {/* Skills */}
                                      {m.skills && Object.entries(m.skills).filter(([_, lvl]) => Number(lvl) > 0).length > 0 && (
                                        <div className="pt-1.5 flex flex-wrap gap-1">
                                          {Object.entries(m.skills)
                                            .filter(([_, lvl]) => Number(lvl) > 0)
                                            .map(([sName]) => (
                                              <span
                                                key={sName}
                                                className="px-1.5 py-0.5 rounded-md bg-purple-50 text-purple-900 dark:bg-purple-950/60 dark:text-purple-200 border border-purple-200 dark:border-purple-800 text-[9px] font-bold"
                                              >
                                                {sName}
                                              </span>
                                            ))}
                                        </div>
                                      )}
                                    </motion.div>
                                  );
                                })}
                              </div>
                            ) : (
                              <p className="text-[10px] text-[var(--muted)] italic text-center py-0.5">
                                Nenhum colaborador neste horário.
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* TAB CONTENT 2: VISÃO POR LISTA DE COLABORADORES */}
      {portalViewMode === 'collaborators' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="space-y-3"
        >
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-extrabold text-[var(--ink)] uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-[var(--primary)]" />
              <span>Resultados ({filteredCollaborators.length} Colaboradores)</span>
            </h4>
            <span className="text-xs text-[var(--muted)] font-semibold">
              Clique para selecionar seu perfil
            </span>
          </div>

          <div className="columns-1 sm:columns-2 xl:columns-3 gap-3 space-y-3 [&>div]:break-inside-avoid">
            {filteredCollaborators.map((col) => {
              const st = getPersonStatus(col.id);
              const taskName = getTaskAssigned(col.id);
              const breakTime = getBreakSlot(col.id);
              const isSelected = selectedCollabId === col.id;

              return (
                <motion.div
                  key={col.id}
                  whileHover={{ scale: 1.01, y: -2 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => setSelectedCollabId(col.id)}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all break-inside-avoid ${
                    isSelected
                      ? 'border-[var(--primary)] bg-[var(--paper)] ring-2 ring-[var(--primary-border)] shadow-md'
                      : 'border-[var(--line)] bg-[var(--paper)] hover:border-purple-400 hover:shadow-xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h5 className="font-extrabold text-base text-[var(--ink)] leading-snug">{col.name}</h5>
                      <p className="text-xs text-[var(--muted)] font-bold">
                        {col.role || 'Sem Cargo'} • {col.category || 'Sem Cat.'}
                      </p>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border shrink-0 ${st.color}`}>
                      {st.label}
                    </span>
                  </div>

                  <div className="pt-3 border-t border-[var(--line)] space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[var(--muted)] font-bold">Tarefa Escalada:</span>
                      <span className="font-extrabold text-[var(--primary)]">{taskName}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[var(--muted)] font-bold">Refeição / Pausa:</span>
                      <span className="font-bold text-amber-700 dark:text-amber-300">{breakTime}</span>
                    </div>

                    {/* Skills */}
                    {col.skills && Object.entries(col.skills).filter(([_, lvl]) => Number(lvl) > 0).length > 0 && (
                      <div className="pt-1 flex flex-wrap gap-1">
                        {Object.entries(col.skills)
                          .filter(([_, lvl]) => Number(lvl) > 0)
                          .map(([sName]) => (
                            <span
                              key={sName}
                              className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-900 dark:bg-purple-950/60 dark:text-purple-200 border border-purple-200 dark:border-purple-800 text-[10px] font-bold"
                            >
                              {sName}
                            </span>
                          ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};


