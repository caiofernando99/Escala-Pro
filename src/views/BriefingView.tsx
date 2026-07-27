import React, { useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
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
  Tag,
  Briefcase,
  Building2,
  BookOpen,
  ShieldCheck,
  Lightbulb,
  AlertTriangle,
  FileText,
  ChevronLeft,
  ChevronRight,
  Shuffle,
  Plus,
  Trash2,
  Edit3,
  X,
  LayoutGrid,
  GraduationCap,
  Info,
} from 'lucide-react';
import { formatDateBR, formatDateLongBR, getCollaboratorStatus } from '../utils/helpers';
import { ProcessKnowledge, ProcessType } from '../types';

export const BriefingView: React.FC = () => {
  const { state, addProcessKnowledge, updateProcessKnowledge, deleteProcessKnowledge } = useApp();
  const [activeTab, setActiveTab] = useState<'scale' | 'process'>('scale');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showIntervals, setShowIntervals] = useState(true);
  const slideRef = useRef<HTMLDivElement>(null);

  // Custom Branding options
  const [customBranding, setCustomBranding] = useState(state.teamName || 'OPERAÇÃO LOGÍSTICA');
  const [customSubBranding, setCustomSubBranding] = useState(`SETOR ${state.sector || 'OPERACIONAL'} • ${state.teamShift || 'T2'}`);

  // Filtering options for Scale Slide
  const [roleFilter, setRoleFilter] = useState('todos');
  const [categoryFilter, setCategoryFilter] = useState('todos');
  const [tlFilter, setTlFilter] = useState('todos');

  // Font size mode for Scale Slide: auto, compact, normal, large
  const [fontSizeMode, setFontSizeMode] = useState<'auto' | 'compact' | 'normal' | 'large'>('auto');

  // Process Knowledge state
  const processList = state.processKnowledgeList || [];
  const [selectedProcessId, setSelectedProcessId] = useState<string>(processList[0]?.id || '');
  const [processCategoryFilter, setProcessCategoryFilter] = useState('todos');
  const [processTypeFilter, setProcessTypeFilter] = useState('todos');

  // Modal State for Process Knowledge CRUD
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [editingProcessId, setEditingProcessId] = useState<string | null>(null);
  const [titleInput, setTitleInput] = useState('');
  const [typeInput, setTypeInput] = useState<ProcessType>('explicacao');
  const [categoryInput, setCategoryInput] = useState('');
  const [descriptionInput, setDescriptionInput] = useState('');
  const [keyTakeawaysInput, setKeyTakeawaysInput] = useState('');

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
  const processedTasks = (state.tasks || [])
    .filter((t) => t.active !== false)
    .map((task) => {
      const taskMembers = (task.members || [])
        .map((mId) => state.collaborators.find((c) => c.id === mId))
        .filter((c): c is NonNullable<typeof c> => {
          if (!c) return false;
          const statusInfo = getCollaboratorStatus(c, activeDate, state);
          if (statusInfo.status !== 'presente') return false;

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

  // Process Knowledge Filtering
  const processCategories = Array.from(new Set(processList.map((p) => p.category).filter(Boolean)));
  const filteredProcessList = processList.filter((p) => {
    const matchesCat = processCategoryFilter === 'todos' || p.category === processCategoryFilter;
    const matchesType = processTypeFilter === 'todos' || p.type === processTypeFilter;
    return matchesCat && matchesType;
  });

  const activeProcessIndex = filteredProcessList.findIndex((p) => p.id === selectedProcessId);
  const currentProcess: ProcessKnowledge | undefined =
    filteredProcessList[activeProcessIndex] || filteredProcessList[0] || processList[0];

  const handleNextProcess = () => {
    if (filteredProcessList.length === 0) return;
    const nextIdx = (activeProcessIndex + 1) % filteredProcessList.length;
    setSelectedProcessId(filteredProcessList[nextIdx].id);
  };

  const handlePrevProcess = () => {
    if (filteredProcessList.length === 0) return;
    const prevIdx = (activeProcessIndex - 1 + filteredProcessList.length) % filteredProcessList.length;
    setSelectedProcessId(filteredProcessList[prevIdx].id);
  };

  const handleRandomProcess = () => {
    if (filteredProcessList.length === 0) return;
    const randomIdx = Math.floor(Math.random() * filteredProcessList.length);
    setSelectedProcessId(filteredProcessList[randomIdx].id);
  };

  // Manage Process Modal Handlers
  const handleOpenAddProcessModal = () => {
    setEditingProcessId(null);
    setTitleInput('');
    setTypeInput('explicacao');
    setCategoryInput(state.sector || 'Operação');
    setDescriptionInput('');
    setKeyTakeawaysInput('');
    setIsManageModalOpen(true);
  };

  const handleOpenEditProcessModal = (item: ProcessKnowledge) => {
    setEditingProcessId(item.id);
    setTitleInput(item.title);
    setTypeInput(item.type);
    setCategoryInput(item.category);
    setDescriptionInput(item.description);
    setKeyTakeawaysInput((item.keyTakeaways || []).join('\n'));
    setIsManageModalOpen(true);
  };

  const handleSaveProcess = () => {
    if (!titleInput.trim()) return;
    const takeaways = keyTakeawaysInput
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    if (editingProcessId) {
      updateProcessKnowledge(editingProcessId, {
        title: titleInput.trim(),
        type: typeInput,
        category: categoryInput.trim() || 'Geral',
        description: descriptionInput.trim(),
        keyTakeaways: takeaways,
      });
    } else {
      addProcessKnowledge({
        title: titleInput.trim(),
        type: typeInput,
        category: categoryInput.trim() || 'Geral',
        description: descriptionInput.trim(),
        keyTakeaways: takeaways,
        active: true,
      });
    }
    setIsManageModalOpen(false);
  };

  // Helper type badge details
  const getTypeBadgeDetails = (type: ProcessType) => {
    switch (type) {
      case 'caracteristica':
        return {
          label: 'Característica do Processo',
          bg: 'bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-950 dark:text-blue-100 dark:border-blue-800',
          icon: <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />,
        };
      case 'curiosidade':
        return {
          label: 'Curiosidade Operacional',
          bg: 'bg-amber-100 text-amber-950 border-amber-300 dark:bg-amber-950 dark:text-amber-100 dark:border-amber-800',
          icon: <Lightbulb className="w-4 h-4 text-amber-600 dark:text-amber-400" />,
        };
      case 'explicacao':
        return {
          label: 'Explicação do Processo',
          bg: 'bg-indigo-100 text-indigo-950 border-indigo-300 dark:bg-indigo-950 dark:text-indigo-100 dark:border-indigo-800',
          icon: <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />,
        };
      case 'procedimento':
        return {
          label: 'Procedimento Padrão (SOP)',
          bg: 'bg-purple-100 text-purple-950 border-purple-300 dark:bg-purple-950 dark:text-purple-100 dark:border-purple-800',
          icon: <FileText className="w-4 h-4 text-purple-600 dark:text-purple-400" />,
        };
      case 'seguranca':
        return {
          label: 'Segurança do Trabalho',
          bg: 'bg-emerald-100 text-emerald-950 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-100 dark:border-emerald-800',
          icon: <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />,
        };
      case 'qualidade':
        return {
          label: 'Conformidade & Qualidade',
          bg: 'bg-teal-100 text-teal-950 border-teal-300 dark:bg-teal-950 dark:text-teal-100 dark:border-teal-800',
          icon: <CheckCircle2 className="w-4 h-4 text-teal-600 dark:text-teal-400" />,
        };
      default:
        return {
          label: 'Informação de Processo',
          bg: 'bg-gray-100 text-gray-900 border-gray-300 dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700',
          icon: <Info className="w-4 h-4 text-gray-600" />,
        };
    }
  };

  // Determine grid layout dynamically based on active tasks count for Scale Tab
  const taskCount = processedTasks.length;
  let gridColsClass = 'grid-cols-4';
  if (taskCount <= 2) gridColsClass = 'grid-cols-2';
  else if (taskCount <= 3) gridColsClass = 'grid-cols-3';
  else if (taskCount <= 4) gridColsClass = 'grid-cols-4';
  else if (taskCount <= 6) gridColsClass = 'grid-cols-3 sm:grid-cols-6';
  else if (taskCount <= 8) gridColsClass = 'grid-cols-4 sm:grid-cols-4 lg:grid-cols-4';
  else gridColsClass = 'grid-cols-4 sm:grid-cols-5';

  const totalDimensioned = processedTasks.reduce((acc, t) => acc + t.taskMembers.length, 0);

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
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* NAVIGATION TABS FOR BRIEFING MODE */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[var(--paper)] border border-[var(--line)] p-2 rounded-2xl shadow-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('scale')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer border ${
              activeTab === 'scale'
                ? 'bg-[var(--primary)] text-white border-[var(--primary)] shadow-2xs'
                : 'bg-[var(--bg)] text-[var(--muted)] border-[var(--line)] hover:text-[var(--ink)]'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            <span>Slide 1: Escala & Dimensionamento</span>
          </button>

          <button
            onClick={() => setActiveTab('process')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer border ${
              activeTab === 'process'
                ? 'bg-purple-600 text-white border-purple-600 shadow-2xs'
                : 'bg-[var(--bg)] text-[var(--muted)] border-[var(--line)] hover:text-purple-600'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Slide 2: Reforço de Conhecimento do Processo</span>
            {processList.length > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                activeTab === 'process' ? 'bg-white text-purple-900' : 'bg-purple-100 text-purple-900 dark:bg-purple-950 dark:text-purple-200'
              }`}>
                {processList.length} cards
              </span>
            )}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleFullscreen}
            className="px-3.5 py-1.5 bg-[var(--primary-soft)] hover:bg-[var(--line)] text-[var(--primary)] text-xs font-black rounded-xl border border-[var(--primary-border)] flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            <span>{isFullscreen ? 'Sair do Modo TV' : 'Modo TV (Tela Cheia)'}</span>
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

      {/* TAB 1: SCALE & TASK DIMENSIONING SLIDE */}
      {activeTab === 'scale' && (
        <div className="space-y-3">
          {/* Controls Panel */}
          <div className="bg-[var(--paper)] border border-[var(--line)] p-3.5 rounded-2xl shadow-xs space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-[var(--muted)] uppercase tracking-wider flex items-center gap-1">
                  <Building2 className="w-3 h-3 text-[var(--primary)]" />
                  <span>Marca / Operação</span>
                </label>
                <input
                  type="text"
                  value={customBranding}
                  onChange={(e) => setCustomBranding(e.target.value)}
                  placeholder="Ex: EscalaPro - Inbound"
                  className="w-full p-1.5 bg-[var(--bg)] border border-[var(--line)] rounded-xl font-bold text-[var(--ink)] text-xs focus:border-[var(--primary)]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-[var(--muted)] uppercase tracking-wider flex items-center gap-1">
                  <Building2 className="w-3 h-3 text-[var(--primary)]" />
                  <span>Subtítulo / Turno</span>
                </label>
                <input
                  type="text"
                  value={customSubBranding}
                  onChange={(e) => setCustomSubBranding(e.target.value)}
                  placeholder="Ex: ICQA T2 • Segunda"
                  className="w-full p-1.5 bg-[var(--bg)] border border-[var(--line)] rounded-xl font-bold text-[var(--ink)] text-xs focus:border-[var(--primary)]"
                />
              </div>

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

              <div className="space-y-1 flex flex-col justify-end">
                <label className="flex items-center gap-2 p-1.5 bg-[var(--bg)] border border-[var(--line)] hover:border-[var(--primary-border)] rounded-xl cursor-pointer font-extrabold text-[var(--ink)] transition-colors">
                  <input
                    type="checkbox"
                    checked={showIntervals}
                    onChange={(e) => setShowIntervals(e.target.checked)}
                    className="w-4 h-4 rounded text-[var(--primary)] focus:ring-0 accent-[var(--primary)] cursor-pointer shrink-0"
                  />
                  <Clock className="w-3.5 h-3.5 text-[var(--primary)] shrink-0" />
                  <span className="truncate">Horários de Intervalo</span>
                </label>
              </div>
            </div>
          </div>

          {/* 16:9 Slide Canvas for Scale */}
          <div className="flex justify-center items-center overflow-x-auto py-1">
            <div
              ref={slideRef}
              className="w-full max-w-[1360px] aspect-[16/9] bg-[var(--paper)] border-4 border-[var(--primary-border)] rounded-2xl p-4 sm:p-5 shadow-2xl flex flex-col justify-between overflow-hidden relative select-none"
            >
              {/* SLIDE HEADER */}
              <div className="flex items-center justify-between border-b-2 border-[var(--line)] pb-3 z-10 shrink-0">
                <div className="flex items-center gap-3">
                  <div>
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

              {/* SLIDE BODY */}
              {processedTasks.length > 0 ? (
                <div className={`grid ${gridColsClass} gap-2.5 my-auto z-10 flex-grow py-3 overflow-hidden`}>
                  {processedTasks.map((task) => (
                    <div
                      key={task.id}
                      className="bg-[var(--bg)] border-2 border-[var(--line)] hover:border-[var(--primary-border)] rounded-xl p-2.5 flex flex-col justify-between overflow-hidden shadow-2xs transition-all"
                    >
                      <div className="flex items-center justify-between border-b-2 border-[var(--line)] pb-1.5 mb-1.5 shrink-0">
                        <h3 className="font-black text-xs sm:text-sm text-[var(--ink)] uppercase truncate pr-1">
                          {task.name}
                        </h3>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-[var(--primary)] text-white shrink-0 shadow-2xs">
                          {task.taskMembers.length}
                        </span>
                      </div>

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
                  ))}
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

              {/* SLIDE FOOTER */}
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
      )}

      {/* TAB 2: PROCESS KNOWLEDGE REINFORCEMENT SLIDE */}
      {activeTab === 'process' && (
        <div className="space-y-3">
          {/* Process Controls Toolbar */}
          <div className="bg-[var(--paper)] border border-[var(--line)] p-3.5 rounded-2xl shadow-xs space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] pb-3">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <div>
                  <h3 className="text-sm font-black text-[var(--ink)]">Aprendizado & Alinhamento de Processos no Briefing</h3>
                  <p className="text-xs text-[var(--muted)]">
                    Apresente orientações, procedimentos, regras de segurança e dicas aos colaboradores antes do início do turno.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleRandomProcess}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-black rounded-xl flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                  title="Sortear uma dica ou processo aleatório para o briefing"
                >
                  <Shuffle className="w-3.5 h-3.5" />
                  <span>Dica do Dia (Sortear)</span>
                </button>

                <button
                  onClick={handleOpenAddProcessModal}
                  className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-black rounded-xl flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Cadastrar / Gerenciar Processos</span>
                </button>
              </div>
            </div>

            {/* Selector and Filter Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 text-xs">
              {/* Select Process Item */}
              <div className="lg:col-span-6 space-y-1">
                <label className="text-[10px] font-black text-[var(--muted)] uppercase tracking-wider flex items-center gap-1">
                  <BookOpen className="w-3 h-3 text-purple-600" />
                  <span>Selecione o Cartão do Processo ({filteredProcessList.length} disponíveis)</span>
                </label>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handlePrevProcess}
                    className="p-2 bg-[var(--bg)] border border-[var(--line)] rounded-xl hover:bg-[var(--paper)] text-[var(--ink)] cursor-pointer"
                    title="Anterior"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <select
                    value={currentProcess?.id || ''}
                    onChange={(e) => setSelectedProcessId(e.target.value)}
                    className="flex-1 p-2 bg-[var(--bg)] border border-[var(--line)] rounded-xl font-bold text-[var(--ink)] text-xs focus:border-purple-600 cursor-pointer truncate"
                  >
                    {filteredProcessList.map((p) => (
                      <option key={p.id} value={p.id}>
                        [{p.category}] {p.title}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={handleNextProcess}
                    className="p-2 bg-[var(--bg)] border border-[var(--line)] rounded-xl hover:bg-[var(--paper)] text-[var(--ink)] cursor-pointer"
                    title="Próximo"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Filter by Category */}
              <div className="lg:col-span-3 space-y-1">
                <label className="text-[10px] font-black text-[var(--muted)] uppercase tracking-wider flex items-center gap-1">
                  <Tag className="w-3 h-3 text-purple-600" />
                  <span>Filtrar Categoria / Setor</span>
                </label>
                <select
                  value={processCategoryFilter}
                  onChange={(e) => setProcessCategoryFilter(e.target.value)}
                  className="w-full p-2 bg-[var(--bg)] border border-[var(--line)] rounded-xl font-bold text-[var(--ink)] text-xs focus:border-purple-600 cursor-pointer"
                >
                  <option value="todos">Todas as Categorias</option>
                  {processCategories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filter by Type */}
              <div className="lg:col-span-3 space-y-1">
                <label className="text-[10px] font-black text-[var(--muted)] uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-purple-600" />
                  <span>Tipo de Cartão</span>
                </label>
                <select
                  value={processTypeFilter}
                  onChange={(e) => setProcessTypeFilter(e.target.value)}
                  className="w-full p-2 bg-[var(--bg)] border border-[var(--line)] rounded-xl font-bold text-[var(--ink)] text-xs focus:border-purple-600 cursor-pointer"
                >
                  <option value="todos">Todos os Tipos</option>
                  <option value="caracteristica">Característica</option>
                  <option value="curiosidade">Curiosidade</option>
                  <option value="explicacao">Explicação</option>
                  <option value="procedimento">Procedimento (SOP)</option>
                  <option value="seguranca">Segurança</option>
                  <option value="qualidade">Qualidade</option>
                </select>
              </div>
            </div>
          </div>

          {/* 16:9 SLIDE CANVAS FOR PROCESS KNOWLEDGE */}
          <div className="flex justify-center items-center overflow-x-auto py-1">
            <div
              ref={slideRef}
              className="w-full max-w-[1360px] aspect-[16/9] bg-[var(--paper)] border-4 border-purple-600 dark:border-purple-500 rounded-2xl p-5 sm:p-6 shadow-2xl flex flex-col justify-between overflow-hidden relative select-none"
            >
              {/* SLIDE HEADER */}
              <div className="flex items-center justify-between border-b-2 border-[var(--line)] pb-3 z-10 shrink-0">
                <div>
                  <h1 className="text-xl sm:text-2xl font-black text-[var(--ink)] tracking-tight leading-none uppercase">
                    {customBranding || state.teamName || 'OPERAÇÃO LOGÍSTICA'}
                  </h1>
                  <span className="text-xs font-extrabold text-purple-600 dark:text-purple-400 uppercase tracking-wider block mt-0.5">
                    REFORÇO DE CONHECIMENTO & PROCESSOS • {state.teamShift || 'T2'}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="bg-[var(--bg)] border border-[var(--line)] px-3 py-1.5 rounded-xl flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-purple-600" />
                    <span className="text-xs font-black text-[var(--ink)]">
                      {formatDateBR(activeDate)} <span className="text-[10px] text-[var(--muted)] font-bold">({formatDateLongBR(activeDate)})</span>
                    </span>
                  </div>

                  <div className="bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 px-3 py-1.5 rounded-xl">
                    <span className="text-[10px] font-black uppercase text-purple-700 dark:text-purple-300 block leading-none">BRIEFING OPERACIONAL</span>
                    <span className="text-xs font-black text-[var(--ink)]">
                      {state.defaultTeamLeader || state.manager || 'Liderança de Turno'}
                    </span>
                  </div>
                </div>
              </div>

              {/* SLIDE CONTENT CARD */}
              {currentProcess ? (
                <div className="my-auto z-10 flex-grow py-4 flex flex-col justify-between overflow-hidden space-y-4">
                  {/* Top Type & Category Badges */}
                  <div className="flex flex-wrap items-center justify-between gap-3 shrink-0">
                    <div className="flex items-center gap-2">
                      {(() => {
                        const badge = getTypeBadgeDetails(currentProcess.type);
                        return (
                          <span
                            className={`inline-flex items-center gap-2 px-3 py-1 rounded-xl text-xs font-black border shadow-2xs ${badge.bg}`}
                          >
                            {badge.icon}
                            <span>{badge.label.toUpperCase()}</span>
                          </span>
                        );
                      })()}

                      <span className="px-3 py-1 bg-[var(--bg)] border border-[var(--line)] text-[var(--ink)] text-xs font-black rounded-xl">
                        SETOR: {currentProcess.category.toUpperCase()}
                      </span>
                    </div>

                    <span className="text-xs font-bold text-[var(--muted)]">
                      Cartão {activeProcessIndex + 1} de {filteredProcessList.length}
                    </span>
                  </div>

                  {/* Main Title & Explanation Display */}
                  <div className="bg-[var(--bg)] border-2 border-[var(--line)] p-5 sm:p-6 rounded-2xl shadow-xs space-y-3 flex-grow flex flex-col justify-center">
                    <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-[var(--ink)] leading-snug tracking-tight">
                      {currentProcess.title}
                    </h2>

                    <p className="text-sm sm:text-base lg:text-lg font-medium text-[var(--ink)] leading-relaxed">
                      {currentProcess.description}
                    </p>
                  </div>

                  {/* Key Takeaways / Points for Team Attention */}
                  {currentProcess.keyTakeaways && currentProcess.keyTakeaways.length > 0 && (
                    <div className="shrink-0 space-y-2">
                      <h4 className="text-xs font-black text-[var(--muted)] uppercase tracking-wider flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>PONTOS DE ATENÇÃO & DIRETRIZES PARA A EQUIPE NO TURNO:</span>
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        {currentProcess.keyTakeaways.map((point, idx) => (
                          <div
                            key={idx}
                            className="bg-[var(--paper)] border-2 border-purple-200 dark:border-purple-900/60 p-3 rounded-xl flex items-start gap-2 shadow-2xs"
                          >
                            <span className="w-5 h-5 rounded-full bg-purple-600 text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                              {idx + 1}
                            </span>
                            <span className="text-xs sm:text-sm font-bold text-[var(--ink)] leading-snug">
                              {point}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="my-auto text-center p-12 bg-[var(--bg)] border-2 border-dashed border-[var(--line)] rounded-2xl">
                  <BookOpen className="w-12 h-12 text-[var(--muted)] mx-auto mb-2 opacity-50" />
                  <h4 className="text-base font-black text-[var(--ink)]">Nenhum cartão de processo cadastrado</h4>
                  <p className="text-xs text-[var(--muted)] mt-1">
                    Clique em "+ Cadastrar / Gerenciar Processos" para adicionar características, orientações e curiosidades para os briefings.
                  </p>
                </div>
              )}

              {/* SLIDE FOOTER */}
              <div className="flex items-center justify-between border-t-2 border-[var(--line)] pt-3 text-[11px] font-extrabold text-[var(--muted)] z-10 shrink-0">
                <div className="flex items-center gap-2 text-[var(--ink)]">
                  <GraduationCap className="w-4 h-4 text-purple-600" />
                  <span>REFORÇO DIÁRIO DE CONHECIMENTO OPERACIONAL • EXCELÊNCIA & SEGURANÇA</span>
                </div>

                <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-black text-xs">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>EscalaPro • Slide de Briefing</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MANAGE PROCESS KNOWLEDGE MODAL */}
      {isManageModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-[var(--paper)] border border-[var(--line)] rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 border-b border-[var(--line)] flex items-center justify-between bg-[var(--bg)]">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-purple-600" />
                <h3 className="text-base font-black text-[var(--ink)]">
                  {editingProcessId ? 'Editar Cartão de Processo' : 'Cadastrar Novo Processo para Briefings'}
                </h3>
              </div>
              <button
                onClick={() => setIsManageModalOpen(false)}
                className="p-1 rounded-lg text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--paper)] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              {/* Form Row 1 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[var(--ink)] mb-1">
                    Título do Processo / Assunto *
                  </label>
                  <input
                    type="text"
                    value={titleInput}
                    onChange={(e) => setTitleInput(e.target.value)}
                    placeholder="Ex: Acurácia no Inventário e Bipagem Cega"
                    className="w-full p-2 bg-[var(--bg)] border border-[var(--line)] rounded-xl font-bold text-[var(--ink)]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-[var(--ink)] mb-1">
                      Tipo de Cartão *
                    </label>
                    <select
                      value={typeInput}
                      onChange={(e) => setTypeInput(e.target.value as ProcessType)}
                      className="w-full p-2 bg-[var(--bg)] border border-[var(--line)] rounded-xl font-bold text-[var(--ink)] cursor-pointer"
                    >
                      <option value="caracteristica">Característica</option>
                      <option value="curiosidade">Curiosidade</option>
                      <option value="explicacao">Explicação</option>
                      <option value="procedimento">Procedimento (SOP)</option>
                      <option value="seguranca">Segurança</option>
                      <option value="qualidade">Qualidade</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[var(--ink)] mb-1">
                      Categoria / Setor
                    </label>
                    <input
                      type="text"
                      value={categoryInput}
                      onChange={(e) => setCategoryInput(e.target.value)}
                      placeholder="Ex: Inbound, Qualidade, Geral"
                      className="w-full p-2 bg-[var(--bg)] border border-[var(--line)] rounded-xl font-bold text-[var(--ink)]"
                    />
                  </div>
                </div>
              </div>

              {/* Form Row 2 */}
              <div>
                <label className="block text-xs font-bold text-[var(--ink)] mb-1">
                  Explicação ou Descrição Detalhada para a Equipe *
                </label>
                <textarea
                  rows={3}
                  value={descriptionInput}
                  onChange={(e) => setDescriptionInput(e.target.value)}
                  placeholder="Escreva a instrução ou explicação completa que será lida no briefing..."
                  className="w-full p-2 bg-[var(--bg)] border border-[var(--line)] rounded-xl font-medium text-[var(--ink)]"
                />
              </div>

              {/* Form Row 3 */}
              <div>
                <label className="block text-xs font-bold text-[var(--ink)] mb-1">
                  Pontos-Chave & Diretrizes da Equipe (1 por linha)
                </label>
                <textarea
                  rows={3}
                  value={keyTakeawaysInput}
                  onChange={(e) => setKeyTakeawaysInput(e.target.value)}
                  placeholder="Digite os tópicos que os colaboradores devem lembrar (um por linha)..."
                  className="w-full p-2 bg-[var(--bg)] border border-[var(--line)] rounded-xl font-medium text-[var(--ink)]"
                />
              </div>

              {/* Action Button */}
              <div className="flex justify-end gap-2 pt-2 border-t border-[var(--line)]">
                <button
                  onClick={() => {
                    setTitleInput('');
                    setDescriptionInput('');
                    setKeyTakeawaysInput('');
                    setEditingProcessId(null);
                  }}
                  className="px-3 py-1.5 bg-[var(--bg)] text-[var(--muted)] font-bold rounded-xl hover:text-[var(--ink)] cursor-pointer"
                >
                  Limpar Formulário
                </button>

                <button
                  onClick={handleSaveProcess}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>{editingProcessId ? 'Salvar Alterações' : 'Adicionar à Lista de Briefing'}</span>
                </button>
              </div>

              {/* Table of Registered Processes */}
              <div className="pt-4 border-t border-[var(--line)] space-y-2">
                <h4 className="font-extrabold text-[var(--ink)] uppercase tracking-wider text-[11px]">
                  Cartões de Processo Cadastrados ({processList.length})
                </h4>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {processList.map((p) => {
                    const badge = getTypeBadgeDetails(p.type);
                    return (
                      <div
                        key={p.id}
                        className="bg-[var(--bg)] border border-[var(--line)] p-3 rounded-xl flex items-center justify-between gap-3"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black border ${badge.bg}`}>
                              {badge.label}
                            </span>
                            <span className="text-[10px] font-bold text-[var(--muted)]">
                              [{p.category}]
                            </span>
                          </div>
                          <h5 className="font-bold text-[var(--ink)] truncate">{p.title}</h5>
                          <p className="text-[11px] text-[var(--muted)] truncate">{p.description}</p>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => handleOpenEditProcessModal(p)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 rounded-lg cursor-pointer transition-colors"
                            title="Editar"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => deleteProcessKnowledge(p.id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg cursor-pointer transition-colors"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
