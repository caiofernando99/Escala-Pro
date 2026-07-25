import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { SearchInput } from '../components/SearchInput';
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
  Copy,
  Check,
  Palmtree,
  Stethoscope,
  Sun,
  UserX,
  X,
  ExternalLink,
  ChevronDown,
  Layers,
  Sparkles,
  Info,
} from 'lucide-react';
import { matchesSearch, isScaleOff, formatDateBR, formatDateLongBR } from '../utils/helpers';

interface InteractiveEmployeePortalProps {
  onClose?: () => void;
}

export const InteractiveEmployeePortal: React.FC<InteractiveEmployeePortalProps> = ({ onClose }) => {
  const { state, showNotice } = useApp();
  const [searchName, setSearchName] = useState('');
  const [selectedRole, setSelectedRole] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedTL, setSelectedTL] = useState('ALL');
  const [selectedCollabId, setSelectedCollabId] = useState<string | null>(null);
  const [portalViewMode, setPortalViewMode] = useState<'tasks' | 'collaborators'>('tasks');
  const [copiedLink, setCopiedLink] = useState(false);

  const activeDate = state.selectedDate;
  const dayIntervals = state.intervals[activeDate] || {};

  // All unique roles and categories
  const allRoles = Array.from(new Set(state.collaborators.map((c) => c.role).filter(Boolean)));
  const allCategories = Array.from(new Set(state.collaborators.map((c) => c.category).filter(Boolean)));

  // Find break slot
  const getBreakSlot = (collabId: string) => {
    const slot = state.breaks.find((b) => (dayIntervals[b.id] || []).includes(collabId));
    return slot ? slot.time : 'Não definido';
  };

  // Find task assigned
  const getTaskAssigned = (collabId: string) => {
    const task = state.tasks.find((t) => t.members.includes(collabId));
    return task ? task.name : 'Apoio Geral / Não Alocado';
  };

  // Status helper for person on active date
  const getPersonStatus = (collabId: string) => {
    const col = state.collaborators.find((c) => c.id === collabId);
    if (!col) return { status: 'desconhecido', label: 'Indefinido', color: 'bg-slate-100 text-slate-800' };

    const activeAbsence = (col.absences || []).find((a) => activeDate >= a.startDate && activeDate <= a.endDate);
    if (activeAbsence) {
      if (activeAbsence.type === 'ferias') return { status: 'ferias', label: 'Em Férias', color: 'bg-purple-100 text-purple-900 border-purple-300' };
      if (activeAbsence.type === 'licenca') return { status: 'licenca', label: 'Em Licença', color: 'bg-amber-100 text-amber-900 border-amber-300' };
      if (activeAbsence.type === 'treinamento') return { status: 'treinamento', label: 'Em Treinamento', color: 'bg-blue-100 text-blue-900 border-blue-300' };
    }

    const offScale = isScaleOff(state.calendar, activeDate, col.scale);
    if (offScale) {
      return { status: 'folga', label: 'Folga 6x2', color: 'bg-slate-200 text-slate-900 border-slate-400' };
    }

    const manual = state.attendance[activeDate]?.[collabId];
    if (manual === false) {
      return { status: 'ausente', label: 'Ausente (Falta)', color: 'bg-red-100 text-red-900 border-red-300' };
    }

    return { status: 'presente', label: 'Escalado Hoje', color: 'bg-emerald-100 text-emerald-950 border-emerald-400 font-extrabold' };
  };

  // Filtered collaborators list
  const isSearching = searchName.trim().length > 0;

  const filteredCollaborators = state.collaborators.filter((col) => {
    const colTL = col.teamLeader || state.defaultTeamLeader || 'Sem Time';
    const matchesQuery = matchesSearch(col.name, searchName) || matchesSearch(col.role, searchName) || matchesSearch(colTL, searchName);
    const matchesRole = selectedRole === 'ALL' || col.role === selectedRole;
    const matchesCategory = selectedCategory === 'ALL' || col.category === selectedCategory;
    const matchesTL = selectedTL === 'ALL' || colTL === selectedTL;

    if (!matchesQuery || !matchesRole || !matchesCategory || !matchesTL) return false;

    // Check if collaborator is off (folga, férias, licença, ausente) on active date
    const st = getPersonStatus(col.id);
    const isOffToday = st.status === 'folga' || st.status === 'ferias' || st.status === 'licenca' || st.status === 'ausente';

    // Hide off-duty collaborators by default unless user is searching by name
    if (!isSearching && isOffToday) {
      return false;
    }

    return true;
  });

  // Selected collaborator details
  const activeCollab = state.collaborators.find((c) => c.id === selectedCollabId) || null;

  const handleCopyPublicLink = () => {
    const publicUrl = `${window.location.origin}${window.location.pathname}?view=employee_portal&date=${activeDate}`;
    navigator.clipboard.writeText(publicUrl);
    setCopiedLink(true);
    showNotice('Link público interativo copiado com sucesso!');
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="bg-[var(--bg)] text-[var(--ink)] min-h-screen p-3 md:p-6 space-y-5">
      {/* Top Banner */}
      <div className="bg-[var(--paper)] border-2 border-[var(--primary-border)] p-4 md:p-5 rounded-2xl shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <EscalaProLogo size="lg" variant="light" />
          <div className="hidden sm:block border-l border-[var(--line)] pl-4">
            <span className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider block">
              Portal do Colaborador
            </span>
            <span className="text-sm font-extrabold text-[var(--ink)]">
              {state.teamName} • {state.sector}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleCopyPublicLink}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-xs transition-colors"
          >
            {copiedLink ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
            <span>{copiedLink ? 'Link Copiado!' : 'Copiar Link do Portal'}</span>
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="px-4 py-2.5 border border-[var(--line)] bg-[var(--paper)] hover:bg-[var(--bg)] text-[var(--ink)] text-xs font-bold rounded-xl flex items-center gap-1.5"
            >
              <X className="w-4 h-4" />
              <span>Sair do Portal</span>
            </button>
          )}
        </div>
      </div>

      {/* PROMINENT ACTIVE DATE HIGHLIGHT BAR BELOW HEADER */}
      <div className="bg-[var(--primary-soft)] border-2 border-[var(--primary-border)] p-3 px-4 rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs font-black text-[var(--primary)] shadow-2xs">
        <div className="flex items-center gap-2">
          <Calendar className="w-4.5 h-4.5 shrink-0" />
          <span>DATA ATIVA:</span>
          <span className="text-sm px-3 py-0.5 bg-[var(--paper)] border border-[var(--primary-border)] rounded-lg shadow-2xs tracking-wide">
            {formatDateBR(activeDate)}
          </span>
          <span className="text-[11px] font-bold opacity-80 capitalize hidden sm:inline">
            ({formatDateLongBR(activeDate)})
          </span>
        </div>
      </div>

      {/* Search & Filter Bar for Employees */}
      <div className="bg-[var(--paper)] border border-[var(--line)] p-4 md:p-5 rounded-2xl shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-extrabold text-[var(--primary)]">
            <Search className="w-4 h-4" />
            <h3>Consulte seu Horário e Tarefa na Escala</h3>
          </div>
          <span className="text-[11px] text-[var(--muted)] font-semibold hidden md:inline">
            Data atual: <strong className="text-[var(--ink)]">{formatDateBR(activeDate)}</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Employee Name Autocomplete */}
          <div>
            <label className="block text-xs font-bold text-[var(--muted)] mb-1">
              Digite seu Nome ou Matrícula:
            </label>
            <input
              type="text"
              value={searchName}
              onChange={(e) => {
                setSearchName(e.target.value);
                if (selectedCollabId) setSelectedCollabId(null);
              }}
              placeholder="Ex: Ana Beatris Santos..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--line)] bg-[var(--bg)] text-sm font-bold text-[var(--ink)] focus:ring-2 focus:ring-[var(--primary)]"
            />
          </div>

          {/* Role Filter */}
          <div>
            <label className="block text-xs font-bold text-[var(--muted)] mb-1">
              Filtrar por Time / TL:
            </label>
            <select
              value={selectedTL}
              onChange={(e) => setSelectedTL(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--line)] bg-[var(--bg)] text-sm font-bold text-[var(--ink)] focus:ring-2 focus:ring-[var(--primary)]"
            >
              <option value="ALL">Todos os Times ({(state.teamLeaders || []).length})</option>
              {(state.teamLeaders || []).map((tl) => (
                <option key={tl} value={tl}>
                  {tl}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-[var(--muted)] mb-1">
              Filtrar por Cargo / Função:
            </label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--line)] bg-[var(--bg)] text-sm font-bold text-[var(--ink)] focus:ring-2 focus:ring-[var(--primary)]"
            >
              <option value="ALL">Todos os Cargos ({allRoles.length})</option>
              {allRoles.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-xs font-bold text-[var(--muted)] mb-1">
              Filtrar por Categoria / Nível:
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--line)] bg-[var(--bg)] text-sm font-bold text-[var(--ink)] focus:ring-2 focus:ring-[var(--primary)]"
            >
              <option value="ALL">Todas as Categorias ({allCategories.length})</option>
              {allCategories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Informative note about off-duty filter */}
        <div className="flex items-center gap-2 text-xs text-[var(--muted)] bg-[var(--bg)] p-2.5 rounded-xl border border-[var(--line)]">
          <Info className="w-4 h-4 text-[var(--primary)] shrink-0" />
          <span>
            {isSearching ? (
              <strong className="text-[var(--primary)]">Pesquisa ativa: exibindo todos os resultados encontrados (incluindo folgas/férias).</strong>
            ) : (
              <span>Os colaboradores de folga no dia <strong>{formatDateBR(activeDate)}</strong> não são listados por padrão. Digite seu nome acima para pesquisar.</span>
            )}
          </span>
        </div>
      </div>

      {/* ACTIVE SELECTED EMPLOYEE CARD HIGHLIGHT */}
      {activeCollab && (
        <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white p-5 md:p-6 rounded-2xl shadow-xl space-y-4 border-2 border-blue-400 relative overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/20 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/10 text-white font-black flex items-center justify-center text-xl border border-white/20 shrink-0">
                {activeCollab.name.charAt(0)}
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-blue-200">
                  Sua Informação na Escala • {formatDateBR(activeDate)}
                </span>
                <h2 className="text-2xl font-black">{activeCollab.name}</h2>
                <p className="text-xs text-white/80 font-medium">
                  {activeCollab.role} • Categoria: {activeCollab.category} • Turno: {activeCollab.shift}
                </p>
              </div>
            </div>

            <div className="shrink-0">
              {(() => {
                const st = getPersonStatus(activeCollab.id);
                return (
                  <span className={`px-4 py-1.5 rounded-full text-xs font-black border shadow-xs ${st.color}`}>
                    {st.label}
                  </span>
                );
              })()}
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
            {/* Task */}
            <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-xl border border-white/15">
              <div className="text-xs font-bold text-blue-200 flex items-center gap-1.5 mb-1">
                <Briefcase className="w-4 h-4 text-blue-300" />
                <span>Sua Tarefa Hoje</span>
              </div>
              <div className="text-lg font-black text-white">{getTaskAssigned(activeCollab.id)}</div>
            </div>

            {/* Break Time */}
            <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-xl border border-white/15">
              <div className="text-xs font-bold text-blue-200 flex items-center gap-1.5 mb-1">
                <Clock className="w-4 h-4 text-amber-300" />
                <span>Horário de Refeição</span>
              </div>
              <div className="text-lg font-black text-amber-200">{getBreakSlot(activeCollab.id)}</div>
            </div>

            {/* Scale */}
            <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-xl border border-white/15">
              <div className="text-xs font-bold text-blue-200 flex items-center gap-1.5 mb-1">
                <Calendar className="w-4 h-4 text-emerald-300" />
                <span>Escala Operacional</span>
              </div>
              <div className="text-lg font-black text-emerald-200">Escala 6x2 ({activeCollab.scale})</div>
            </div>
          </div>

          {/* Active Skills List (NO LEVELS) */}
          {activeCollab.skills && Object.entries(activeCollab.skills).filter(([_, lvl]) => Number(lvl) > 0).length > 0 && (
            <div className="pt-2 border-t border-white/15 flex flex-wrap items-center gap-2">
              <span className="text-xs font-extrabold text-blue-200 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-purple-300" />
                <span>Skills / Habilidades:</span>
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

          <button
            onClick={() => setSelectedCollabId(null)}
            className="text-xs text-blue-200 hover:text-white underline font-bold mt-2 block"
          >
            Limpar Seleção Individual
          </button>
        </div>
      )}

      {/* VIEW SWITCHER TABS: VISÃO POR TAREFAS VS VISÃO POR COLABORADORES */}
      <div className="flex items-center justify-between border-b border-[var(--line)] pb-3 pt-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPortalViewMode('tasks')}
            className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
              portalViewMode === 'tasks'
                ? 'bg-[var(--primary)] text-white shadow-xs'
                : 'bg-[var(--paper)] border border-[var(--line)] text-[var(--ink)] hover:bg-[var(--bg)]'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Escala por Tarefas & Horários</span>
          </button>

          <button
            onClick={() => setPortalViewMode('collaborators')}
            className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
              portalViewMode === 'collaborators'
                ? 'bg-[var(--primary)] text-white shadow-xs'
                : 'bg-[var(--paper)] border border-[var(--line)] text-[var(--ink)] hover:bg-[var(--bg)]'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Lista de Colaboradores ({filteredCollaborators.length})</span>
          </button>
        </div>

        <span className="text-xs text-[var(--muted)] font-bold hidden sm:inline">
          Formatado para dispositivos móveis
        </span>
      </div>

      {/* TAB CONTENT 1: VISÃO POR TAREFAS E HORÁRIOS DE INTERVALO DENTRO DAS TAREFAS */}
      {portalViewMode === 'tasks' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {state.tasks.map((task) => {
              // Get members assigned to this task that are in filtered list
              const taskMembers = task.members
                .map((id) => state.collaborators.find((c) => c.id === id))
                .filter((c): c is NonNullable<typeof c> => {
                  if (!c) return false;
                  return filteredCollaborators.some((fc) => fc.id === c.id);
                });

              // Group members by break slot
              const timeSlotGroups: Array<{
                slot: typeof state.breaks[number] | null;
                members: typeof taskMembers;
              }> = [];

              state.breaks.forEach((b) => {
                const inThisSlot = taskMembers.filter((m) => (dayIntervals[b.id] || []).includes(m.id));
                if (inThisSlot.length > 0 || isSearching) {
                  timeSlotGroups.push({
                    slot: b,
                    members: inThisSlot,
                  });
                }
              });

              const noSlotMembers = taskMembers.filter((m) => !state.breaks.some((b) => (dayIntervals[b.id] || []).includes(m.id)));
              if (noSlotMembers.length > 0) {
                timeSlotGroups.push({
                  slot: null,
                  members: noSlotMembers,
                });
              }

              return (
                <div
                  key={task.id}
                  className="bg-[var(--paper)] border-2 border-[var(--line)] rounded-2xl p-4 shadow-xs space-y-3 flex flex-col justify-between"
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
                                    <div
                                      key={m.id}
                                      onClick={() => setSelectedCollabId(m.id)}
                                      className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                                        isSelected
                                          ? 'border-[var(--primary)] bg-[var(--primary-soft)] ring-2 ring-[var(--primary-border)]'
                                          : 'border-[var(--line)] bg-[var(--paper)] hover:border-blue-400'
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

                                      {/* Skills (NO LEVEL) */}
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
                                    </div>
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
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB CONTENT 2: VISÃO POR LISTA DE COLABORADORES */}
      {portalViewMode === 'collaborators' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-extrabold text-[var(--ink)] uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-[var(--primary)]" />
              <span>Resultados ({filteredCollaborators.length} Colaboradores)</span>
            </h4>
            <span className="text-xs text-[var(--muted)] font-semibold">
              Clique para expandir o resumo
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredCollaborators.map((col) => {
              const st = getPersonStatus(col.id);
              const taskName = getTaskAssigned(col.id);
              const breakTime = getBreakSlot(col.id);
              const isSelected = selectedCollabId === col.id;

              return (
                <div
                  key={col.id}
                  onClick={() => setSelectedCollabId(col.id)}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    isSelected
                      ? 'border-[var(--primary)] bg-[var(--paper)] ring-2 ring-[var(--primary-border)] shadow-md'
                      : 'border-[var(--line)] bg-[var(--paper)] hover:border-blue-400 hover:shadow-xs'
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
                      <span className="text-[var(--muted)] font-bold">Tarefa:</span>
                      <span className="font-extrabold text-[var(--primary)]">{taskName}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[var(--muted)] font-bold">Refeição:</span>
                      <span className="font-bold text-amber-700 dark:text-amber-300">{breakTime}</span>
                    </div>

                    {/* Skills (NO LEVEL NUMBER) */}
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
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

