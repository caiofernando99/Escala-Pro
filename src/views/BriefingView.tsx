import React, { useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { EscalaProLogo } from '../components/EscalaProLogo';
import {
  Calendar,
  Clock,
  Maximize2,
  Minimize2,
  Printer,
  Sparkles,
  Users,
  CheckCircle2,
  SlidersHorizontal,
  Type,
  Filter,
  Tag,
  Briefcase,
  Building2,
} from 'lucide-react';
import { formatDateBR, formatDateLongBR, getCollaboratorStatus } from '../utils/helpers';

export const BriefingView: React.FC = () => {
  const { state } = useApp();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showIntervals, setShowIntervals] = useState(true);
  const slideRef = useRef<HTMLDivElement>(null);

  // Custom Branding options
  const [customBranding, setCustomBranding] = useState(state.teamName || 'OPERAÇÃO LOGÍSTICA');
  const [customSubBranding, setCustomSubBranding] = useState(`SETOR ${state.sector || 'OPERACIONAL'} • ${state.teamShift || 'T2'}`);

  // Filtering options
  const [roleFilter, setRoleFilter] = useState('todos');
  const [categoryFilter, setCategoryFilter] = useState('todos');
  const [tlFilter, setTlFilter] = useState('todos');

  // Font size mode: auto, compact, normal, large
  const [fontSizeMode, setFontSizeMode] = useState<'auto' | 'compact' | 'normal' | 'large'>('auto');

  const activeDate = state.selectedDate;

  // Metadata for filter options
  const allRoles = Array.from(new Set(state.collaborators.map((c) => c.role || 'Operador'))).filter(Boolean);
  const allCategories = Array.from(new Set(state.collaborators.map((c) => c.category || 'Geral'))).filter(Boolean);
  const allTLs = Array.from(new Set(state.collaborators.map((c) => c.teamLeader || state.defaultTeamLeader || 'Sem Time'))).filter(Boolean);

  // Active collaborators and presence
  const activeCollaborators = state.collaborators || [];
  const dayIntervals = state.intervals[activeDate] || {};

  // Count true present collaborators for today
  const presentCollaborators = activeCollaborators.filter((c) => {
    const statusInfo = getCollaboratorStatus(c, activeDate, state);
    return statusInfo.status === 'presente';
  });
  const presentCount = presentCollaborators.length;

  // Process tasks: filter members by selected Role, Category, TL
  // AND REMOVE TASKS WITHOUT DIMENSIONED COLLABORATORS!
  const processedTasks = (state.tasks || [])
    .filter((t) => t.active !== false)
    .map((task) => {
      const taskMembers = (task.members || [])
        .map((mId) => state.collaborators.find((c) => c.id === mId))
        .filter((c): c is NonNullable<typeof c> => {
          if (!c) return false;
          // Must be present today
          const statusInfo = getCollaboratorStatus(c, activeDate, state);
          if (statusInfo.status !== 'presente') return false;

          // Apply filters
          if (roleFilter !== 'todos' && c.role !== roleFilter) return false;
          if (categoryFilter !== 'todos' && c.category !== categoryFilter) return false;
          if (tlFilter !== 'todos' && (c.teamLeader || state.defaultTeamLeader || 'Sem Time') !== tlFilter) return false;

          return true;
        });

      return {
        ...task,
        taskMembers,
      };
    })
    // EXCLUDE TASKS WITHOUT DIMENSIONED COLLABORATORS
    .filter((task) => task.taskMembers.length > 0);

  // Helper to find break slot time for a person
  const getBreakTime = (personId: string) => {
    const slot = (state.breaks || []).find((b) => (dayIntervals[b.id] || []).includes(personId));
    return slot ? slot.time : null;
  };

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      slideRef.current?.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Determine grid layout dynamically based on active tasks count
  const taskCount = processedTasks.length;
  let gridColsClass = 'grid-cols-4';
  if (taskCount <= 2) gridColsClass = 'grid-cols-2';
  else if (taskCount <= 3) gridColsClass = 'grid-cols-3';
  else if (taskCount <= 4) gridColsClass = 'grid-cols-4';
  else if (taskCount <= 6) gridColsClass = 'grid-cols-3 sm:grid-cols-6';
  else if (taskCount <= 8) gridColsClass = 'grid-cols-4 sm:grid-cols-4 lg:grid-cols-4';
  else gridColsClass = 'grid-cols-4 sm:grid-cols-5';

  // Total dimensioned members
  const totalDimensioned = processedTasks.reduce((acc, t) => acc + t.taskMembers.length, 0);

  // Typography font size calculations
  let nameFontSize = 'text-xs';
  let dotPaddingClass = 'py-0.5';

  if (fontSizeMode === 'compact') {
    nameFontSize = 'text-[10px]';
    dotPaddingClass = 'py-0.2';
  } else if (fontSizeMode === 'normal') {
    nameFontSize = 'text-xs font-semibold';
    dotPaddingClass = 'py-0.5';
  } else if (fontSizeMode === 'large') {
    nameFontSize = 'text-sm font-bold';
    dotPaddingClass = 'py-1';
  } else {
    // Auto density
    if (totalDimensioned > 45) {
      nameFontSize = 'text-[10px]';
      dotPaddingClass = 'py-0.2';
    } else if (totalDimensioned > 25) {
      nameFontSize = 'text-[11px]';
      dotPaddingClass = 'py-0.5';
    } else {
      nameFontSize = 'text-xs font-bold';
      dotPaddingClass = 'py-1';
    }
  }

  return (
    <div className="space-y-3">
      {/* Top Controls & Customization Panel */}
      <div className="bg-[var(--paper)] border border-[var(--line)] p-3.5 rounded-2xl shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[var(--primary-soft)] text-[var(--primary)] rounded-xl">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-[var(--ink)] flex items-center gap-2">
                <span>Slide Operacional TV (16:9 Sem Rolagem)</span>
              </h2>
              <p className="text-xs text-[var(--muted)]">
                Exibição para telas e TVs na troca de turno. Apenas tarefas com colaboradores dimensionados são exibidas.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={toggleFullscreen}
              className="px-3.5 py-1.5 bg-[var(--primary-soft)] hover:bg-[var(--line)] text-[var(--primary)] text-xs font-black rounded-xl border border-[var(--primary-border)] flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              <span>{isFullscreen ? 'Sair do Tela Cheia' : 'Modo TV (Tela Cheia)'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-[var(--primary)] hover:bg-blue-700 text-white text-xs font-black rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / PDF</span>
            </button>
          </div>
        </div>

        {/* CONTROLS GRID: BRANDING, FILTERS, FONT SIZE, INTERVAL TOGGLE */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5 text-xs">
          {/* Custom Branding Input */}
          <div className="space-y-1">
            <label className="text-[10px] font-black text-[var(--muted)] uppercase tracking-wider flex items-center gap-1">
              <Building2 className="w-3 h-3 text-[var(--primary)]" />
              <span>Marca / Nome da Operação</span>
            </label>
            <input
              type="text"
              value={customBranding}
              onChange={(e) => setCustomBranding(e.target.value)}
              placeholder="Ex: EscalaPro - Inbound"
              className="w-full p-1.5 bg-[var(--bg)] border border-[var(--line)] rounded-xl font-bold text-[var(--ink)] text-xs focus:border-[var(--primary)]"
            />
          </div>

          {/* Custom Sub-Branding Input */}
          <div className="space-y-1">
            <label className="text-[10px] font-black text-[var(--muted)] uppercase tracking-wider flex items-center gap-1">
              <Building2 className="w-3 h-3 text-[var(--primary)]" />
              <span>Subtítulo / Setor / Turno</span>
            </label>
            <input
              type="text"
              value={customSubBranding}
              onChange={(e) => setCustomSubBranding(e.target.value)}
              placeholder="Ex: ICQA T2 • Segunda"
              className="w-full p-1.5 bg-[var(--bg)] border border-[var(--line)] rounded-xl font-bold text-[var(--ink)] text-xs focus:border-[var(--primary)]"
            />
          </div>

          {/* Role Filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-black text-[var(--muted)] uppercase tracking-wider flex items-center gap-1">
              <Briefcase className="w-3 h-3 text-[var(--primary)]" />
              <span>Filtrar Cargo</span>
            </label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full p-1.5 bg-[var(--bg)] border border-[var(--line)] rounded-xl font-bold text-[var(--ink)] text-xs focus:border-[var(--primary)] cursor-pointer"
            >
              <option value="todos">Todos os Cargos</option>
              {allRoles.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-black text-[var(--muted)] uppercase tracking-wider flex items-center gap-1">
              <Tag className="w-3 h-3 text-[var(--primary)]" />
              <span>Filtrar Categoria</span>
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full p-1.5 bg-[var(--bg)] border border-[var(--line)] rounded-xl font-bold text-[var(--ink)] text-xs focus:border-[var(--primary)] cursor-pointer"
            >
              <option value="todos">Todas as Categorias</option>
              {allCategories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Font Size Mode */}
          <div className="space-y-1">
            <label className="text-[10px] font-black text-[var(--muted)] uppercase tracking-wider flex items-center gap-1">
              <Type className="w-3 h-3 text-[var(--primary)]" />
              <span>Tamanho da Fonte</span>
            </label>
            <select
              value={fontSizeMode}
              onChange={(e) => setFontSizeMode(e.target.value as any)}
              className="w-full p-1.5 bg-[var(--bg)] border border-[var(--line)] rounded-xl font-bold text-[var(--ink)] text-xs focus:border-[var(--primary)] cursor-pointer"
            >
              <option value="auto">Automático (Densidade)</option>
              <option value="compact">Pequeno (Muitos nomes)</option>
              <option value="normal">Médio (Padrão)</option>
              <option value="large">Grande (Destacado)</option>
            </select>
          </div>

          {/* Intervals Checkbox */}
          <div className="space-y-1 flex flex-col justify-end">
            <label className="flex items-center gap-2 p-1.5 bg-[var(--bg)] border border-[var(--line)] hover:border-[var(--primary-border)] rounded-xl cursor-pointer font-extrabold text-[var(--ink)] transition-colors">
              <input
                type="checkbox"
                checked={showIntervals}
                onChange={(e) => setShowIntervals(e.target.checked)}
                className="w-4 h-4 rounded text-[var(--primary)] focus:ring-0 accent-[var(--primary)] cursor-pointer shrink-0"
              />
              <Clock className="w-3.5 h-3.5 text-[var(--primary)] shrink-0" />
              <span className="truncate">Exibir Horários de Intervalo</span>
            </label>
          </div>
        </div>
      </div>

      {/* 16:9 SLIDE CANVAS CONTAINER */}
      <div className="flex justify-center items-center overflow-x-auto py-1">
        <div
          ref={slideRef}
          className="w-full max-w-[1360px] aspect-[16/9] bg-[var(--paper)] border-4 border-[var(--primary-border)] rounded-2xl p-4 sm:p-5 shadow-2xl flex flex-col justify-between overflow-hidden relative select-none"
        >
          {/* SLIDE HEADER: Essential operational header with custom branding */}
          <div className="flex items-center justify-between border-b-2 border-[var(--line)] pb-3 z-10 shrink-0">
            <div className="flex items-center gap-3">
              <EscalaProLogo size="md" variant="light" />
              <div className="border-l-2 border-[var(--line)] pl-3">
                <h1 className="text-xl sm:text-2xl font-black text-[var(--ink)] tracking-tight leading-none uppercase">
                  {customBranding || state.teamName || 'OPERAÇÃO LOGÍSTICA'}
                </h1>
                <span className="text-xs font-extrabold text-[var(--primary)] uppercase tracking-wider block mt-0.5">
                  {customSubBranding || `SETOR ${state.sector || 'OPERACIONAL'} • ${state.teamShift || 'T2'}`}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4 text-right">
              <div className="bg-[var(--bg)] border border-[var(--line)] px-3 py-1.5 rounded-xl flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[var(--primary)]" />
                <span className="text-xs font-black text-[var(--ink)]">
                  {formatDateBR(activeDate)} <span className="text-[10px] text-[var(--muted)] font-bold">({formatDateLongBR(activeDate)})</span>
                </span>
              </div>

              <div className="bg-[var(--primary-soft)] border border-[var(--primary-border)] px-3 py-1.5 rounded-xl">
                <span className="text-[10px] font-black uppercase text-[var(--primary)] block leading-none">TURNO / LÍDER</span>
                <span className="text-xs font-black text-[var(--ink)]">
                  {state.teamShift || 'T2'} • {state.defaultTeamLeader || state.manager || 'Liderança'}
                </span>
              </div>
            </div>
          </div>

          {/* SLIDE BODY: MASONRY/GRID CARDS FOR TASKS WITH DIMENSIONED MEMBERS */}
          {processedTasks.length > 0 ? (
            <div className={`grid ${gridColsClass} gap-2.5 my-auto z-10 flex-grow py-3 overflow-hidden`}>
              {processedTasks.map((task) => {
                return (
                  <div
                    key={task.id}
                    className="bg-[var(--bg)] border-2 border-[var(--line)] hover:border-[var(--primary-border)] rounded-xl p-2.5 flex flex-col justify-between overflow-hidden shadow-2xs transition-all"
                  >
                    {/* Task Header */}
                    <div className="flex items-center justify-between border-b-2 border-[var(--line)] pb-1.5 mb-1.5 shrink-0">
                      <h3 className="font-black text-xs sm:text-sm text-[var(--ink)] uppercase truncate pr-1">
                        {task.name}
                      </h3>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-[var(--primary)] text-white shrink-0 shadow-2xs">
                        {task.taskMembers.length}
                      </span>
                    </div>

                    {/* Collaborator Names List */}
                    <div className="flex-grow overflow-hidden flex flex-col justify-start space-y-0.5">
                      {task.taskMembers.map((col) => {
                        const breakTime = getBreakTime(col.id);

                        return (
                          <div
                            key={col.id}
                            className={`flex items-center justify-between border-b border-dashed border-[var(--line)]/60 ${dotPaddingClass} ${nameFontSize}`}
                          >
                            <span className="font-extrabold text-[var(--ink)] truncate pr-1">
                              {col.name}
                            </span>

                            {showIntervals && (
                              <span
                                className={`text-[10px] font-black shrink-0 px-1.5 py-0.2 rounded ${
                                  breakTime
                                    ? 'bg-[var(--paper)] text-[var(--primary)] border border-[var(--line)]'
                                    : 'text-[var(--muted)] opacity-50'
                                }`}
                              >
                                {breakTime ? breakTime : '--:--'}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="my-auto text-center p-12 bg-[var(--bg)] border-2 border-dashed border-[var(--line)] rounded-2xl">
              <Users className="w-10 h-10 text-[var(--muted)] mx-auto mb-2 opacity-50" />
              <h4 className="text-base font-black text-[var(--ink)]">Nenhum colaborador dimensionado para o filtro selecionado</h4>
              <p className="text-xs text-[var(--muted)] mt-1">
                Realize o dimensionamento das tarefas na tela "Dimensionamento" para gerar os cartões do slide.
              </p>
            </div>
          )}

          {/* SLIDE FOOTER: Minimal Info Strip */}
          <div className="flex items-center justify-between border-t-2 border-[var(--line)] pt-2.5 text-[11px] font-extrabold text-[var(--muted)] z-10 shrink-0">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-[var(--ink)]">
                <Users className="w-3.5 h-3.5 text-[var(--primary)]" />
                <span>PRESENÇA TOTAL: <strong className="text-[var(--primary)]">{presentCount}</strong> / {activeCollaborators.length}</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5 text-[var(--ink)]">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>EQUIPE DIMENSIONADA: <strong className="text-emerald-600">{totalDimensioned}</strong></span>
              </span>
            </div>

            <div className="flex items-center gap-2 text-[var(--primary)] font-black text-xs">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>EscalaPro • Slide de Briefing Operacional</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
