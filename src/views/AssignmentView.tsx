import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../context/AppContext';
import { SearchInput } from '../components/SearchInput';
import {
  Shuffle,
  Briefcase,
  Tag,
  X,
  Plus,
  CheckCircle2,
  Users,
  ChevronDown,
  Sparkles,
  Undo2,
  Compass,
  Eye,
  EyeOff,
  Trash2,
  ArrowLeft,
  ArrowRight,
  Check,
  Layers,
} from 'lucide-react';
import { matchesSearch, isScaleOff, getCollaboratorStatus } from '../utils/helpers';
import { Task, Collaborator } from '../types';

export const AssignmentView: React.FC = () => {
  const {
    state,
    assignTask,
    unassignTask,
    clearAssignments,
    clearTaskAssignments,
    autoAssign,
    updateTask,
    undo,
    canUndo,
    showNotice,
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [showInactiveTasks, setShowInactiveTasks] = useState(false);
  const [isAutoAssigning, setIsAutoAssigning] = useState(false);

  // Guided Wizard Modal State
  const [showGuidedWizard, setShowGuidedWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(0);

  const [draggedColId, setDraggedColId] = useState<string | null>(null);
  const [popoverState, setPopoverState] = useState<{
    colId: string;
    top: number;
    left: number;
  } | null>(null);
  const [showOtherTasks, setShowOtherTasks] = useState(false);

  const activeDate = state.selectedDate;
  const activeShift = state.selectedShiftFilter || 'ALL';
  const activeTL = state.selectedTLFilter || 'ALL';

  // Active present people today
  const presentPeople = state.collaborators.filter((c) => {
    const colShift = c.shift || 'Geral';
    const matchesShift = activeShift === 'ALL' || activeShift === 'todos' || colShift === activeShift;
    const colTL = c.teamLeader || state.defaultTeamLeader || 'Sem Time';
    const matchesTL = activeTL === 'ALL' || activeTL === 'todos' || colTL === activeTL;
    if (!matchesShift || !matchesTL) return false;

    const statusInfo = getCollaboratorStatus(c, activeDate, state);
    return statusInfo.status === 'presente';
  });

  // Filter present people by search term, role, category
  const filteredPeople = presentPeople.filter(
    (c) =>
      matchesSearch(c.name, searchTerm) &&
      (filterRole ? c.role === filterRole : true) &&
      (filterCategory ? c.category === filterCategory : true)
  );

  const assignedSet = new Set(state.tasks.flatMap((t) => t.members));
  const unassignedPeople = filteredPeople.filter((p) => !assignedSet.has(p.id));

  // Active tasks vs all tasks
  const activeTasksList = state.tasks.filter((t) => t.active !== false);
  const displayTasks = showInactiveTasks ? state.tasks : activeTasksList;

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
    setDraggedColId(id);
  };

  const handleDrop = (e: React.DragEvent, taskId: string) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain') || draggedColId;
    if (id) {
      assignTask(id, taskId);
      showNotice('Colaborador alocado para a tarefa!');
    }
    setDraggedColId(null);
  };

  const handleCollaboratorClick = (e: React.MouseEvent<HTMLDivElement>, colId: string) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const isMobile = window.innerWidth < 640;

    let left = rect.right + 6;
    let top = rect.top;

    if (isMobile) {
      left = Math.max(10, (window.innerWidth - 300) / 2);
      top = Math.max(10, rect.bottom + 6);
      if (top + 380 > window.innerHeight) {
        top = Math.max(10, window.innerHeight - 390);
      }
    } else {
      if (left + 300 > window.innerWidth) {
        left = Math.max(10, rect.left - 306);
      }
      if (top + 400 > window.innerHeight) {
        top = Math.max(10, window.innerHeight - 410);
      }
    }

    setPopoverState({ colId, top, left });
    setShowOtherTasks(false);
  };

  // Close popover on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setPopoverState(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const selectedCol = popoverState
    ? state.collaborators.find((c) => c.id === popoverState.colId)
    : null;

  // Filter tasks for contextual popover
  const getCategorizedTasks = (col: Collaborator) => {
    const recommended: Task[] = [];
    const others: Task[] = [];

    activeTasksList.forEach((task) => {
      const hasRoleRestriction = (task.allowedRoles || []).length > 0;
      const hasCatRestriction = (task.allowedCategories || []).length > 0;

      const roleMatch = !hasRoleRestriction || (task.allowedRoles || []).includes(col.role);
      const catMatch = !hasCatRestriction || (task.allowedCategories || []).includes(col.category);

      if (roleMatch && catMatch) {
        recommended.push(task);
      } else {
        others.push(task);
      }
    });

    return { recommended, others };
  };

  const popoverTasks = selectedCol ? getCategorizedTasks(selectedCol) : { recommended: [], others: [] };

  // Current wizard task
  const currentWizardTask = activeTasksList[wizardStep] || activeTasksList[0];

  return (
    <div className="space-y-2.5 animate-in fade-in duration-200">
      {/* Top Header & Filter Bar */}
      <div className="bg-[var(--paper)] p-3 rounded-xl border border-[var(--line)] space-y-2.5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--line)] pb-2">
          <div>
            <h3 className="text-sm font-black text-[var(--ink)] leading-tight flex items-center gap-2">
              <span>Dimensionamento de Tarefas</span>
              <span className="text-[10px] font-bold bg-[var(--primary-soft)] text-[var(--primary)] px-2 py-0.5 rounded-full border border-[var(--primary-border)]">
                {activeTasksList.length} ativas
              </span>
            </h3>
            <p className="text-[11px] text-[var(--muted)]">
              Atribua colaboradores às tarefas operacionais. Desative tarefas que não serão executadas hoje.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => undo()}
              disabled={!canUndo}
              className={`px-2.5 py-1 border text-xs font-bold rounded-lg flex items-center gap-1 cursor-pointer transition-colors ${
                canUndo
                  ? 'bg-[var(--paper)] hover:bg-[var(--bg)] border-[var(--line)] text-[var(--ink)]'
                  : 'opacity-40 cursor-not-allowed border-[var(--line)] text-[var(--muted)]'
              }`}
              title="Desfazer última alteração (Ctrl+Z)"
            >
              <Undo2 className="w-3.5 h-3.5" />
              <span>Desfazer (Ctrl+Z)</span>
            </button>

            <button
              onClick={() => {
                setWizardStep(0);
                setShowGuidedWizard(true);
              }}
              className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-lg flex items-center gap-1 shadow-2xs cursor-pointer transition-colors border border-amber-400"
              title="Abrir assistente passo a passo por tarefa"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Modo Guiado</span>
            </button>

            <button
              onClick={() => {
                clearAssignments();
                showNotice('Escala restaurada / alocações limpas.');
              }}
              className="px-2.5 py-1 border border-[var(--line)] text-xs font-bold rounded-lg hover:bg-[var(--bg)] text-[var(--ink)] cursor-pointer transition-transform active:scale-95"
            >
              Restaurar / Limpar Tudo
            </button>

            <motion.button
              whileTap={{ scale: 0.92 }}
              whileHover={{ scale: 1.03 }}
              onClick={() => {
                setIsAutoAssigning(true);
                autoAssign();
                showNotice('Tarefas auto-dimensionadas com sucesso!');
                setTimeout(() => setIsAutoAssigning(false), 700);
              }}
              className="px-3 py-1 bg-[var(--primary)] text-white text-xs font-black rounded-lg hover:bg-[var(--primary-hover)] flex items-center gap-1 shadow-2xs cursor-pointer"
            >
              <Shuffle className={`w-3.5 h-3.5 ${isAutoAssigning ? 'animate-spin' : ''}`} />
              <span>Auto Dimensionar</span>
            </motion.button>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Pesquisar colaborador..."
            className="w-full sm:w-48"
          />

          <div className="flex items-center gap-1">
            <Briefcase className="w-3.5 h-3.5 text-[var(--muted)]" />
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="bg-[var(--bg)] border border-[var(--line)] rounded-lg px-2 py-0.5 text-xs font-bold text-[var(--ink)] cursor-pointer"
            >
              <option value="">Todos os Cargos</option>
              {state.roles.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1">
            <Tag className="w-3.5 h-3.5 text-[var(--muted)]" />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="bg-[var(--bg)] border border-[var(--line)] rounded-lg px-2 py-0.5 text-xs font-bold text-[var(--ink)] cursor-pointer"
            >
              <option value="">Todas as Categorias</option>
              {state.categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <label className="flex items-center gap-1.5 px-2 py-0.5 bg-[var(--bg)] border border-[var(--line)] rounded-lg font-bold text-[11px] text-[var(--ink)] cursor-pointer hover:border-[var(--primary-border)] ml-auto">
            <input
              type="checkbox"
              checked={showInactiveTasks}
              onChange={(e) => setShowInactiveTasks(e.target.checked)}
              className="w-3.5 h-3.5 rounded accent-[var(--primary)] cursor-pointer"
            />
            <span>Exibir Inativas ({state.tasks.length - activeTasksList.length})</span>
          </label>

          {(searchTerm || filterRole || filterCategory) && (
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterRole('');
                setFilterCategory('');
              }}
              className="text-xs font-black text-red-600 hover:underline flex items-center gap-0.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Limpar Filtros</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Dimensioning Area: Adaptive Unassigned Pool + Dense High-Efficiency Task Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-start">
        {/* Available Unassigned People Pool */}
        <div className="lg:col-span-3 bg-[var(--paper)] border border-[var(--line)] p-3 rounded-xl space-y-2 sticky top-3 shadow-2xs">
          <div className="flex items-center justify-between border-b border-[var(--line)] pb-1.5">
            <h4 className="text-xs font-black text-[var(--ink)] flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-[var(--primary)]" />
              <span>Sem Tarefa ({unassignedPeople.length})</span>
            </h4>
            <span className="text-[10px] bg-[var(--bg)] px-1.5 py-0.2 rounded font-mono font-bold text-[var(--muted)]">
              {presentPeople.length} Presentes
            </span>
          </div>

          <div className="space-y-1.5 max-h-[calc(100vh-210px)] overflow-y-auto pr-0.5">
            {unassignedPeople.length > 0 ? (
              unassignedPeople.map((col) => (
                <div
                  key={col.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, col.id)}
                  onClick={(e) => handleCollaboratorClick(e, col.id)}
                  className={`p-2 bg-[var(--bg)] hover:bg-[var(--primary-soft)] border rounded-lg cursor-pointer transition-all space-y-1 shadow-2xs ${
                    popoverState?.colId === col.id
                      ? 'border-[var(--primary)] ring-2 ring-[var(--primary-border)]'
                      : 'border-[var(--line)] hover:border-[var(--primary-border)]'
                  }`}
                  title="Clique para atribuir tarefa rápido"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-[var(--ink)] truncate pr-1">{col.name}</span>
                    <span className="text-[9px] font-bold bg-[var(--paper)] px-1 py-0.2 rounded border border-[var(--line)] text-[var(--muted)] shrink-0">
                      {col.shift}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1 text-[9.5px]">
                    <span className="px-1 py-0.2 bg-[var(--paper)] border border-[var(--line)] rounded font-extrabold text-[var(--ink)] truncate">
                      {col.role || 'Geral'}
                    </span>
                    <span className="px-1 py-0.2 bg-amber-50 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200 border border-amber-200 dark:border-amber-800/50 rounded font-extrabold truncate">
                      {col.category || 'Operacional'}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="p-6 text-center text-xs text-[var(--muted)] italic">
                Todos os colaboradores já foram dimensionados!
              </p>
            )}
          </div>
        </div>

        {/* Tasks Grid */}
        <div className="lg:col-span-9 space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2.5">
            {displayTasks.map((task) => {
              const isInactive = task.active === false;
              const members = task.members
                .map((mId) => state.collaborators.find((c) => c.id === mId))
                .filter(Boolean);

              const roleMatches = (task.allowedRoles || []).length > 0;
              const catMatches = (task.allowedCategories || []).length > 0;

              return (
                <div
                  key={task.id}
                  onDragOver={(e) => !isInactive && e.preventDefault()}
                  onDrop={(e) => !isInactive && handleDrop(e, task.id)}
                  className={`border p-2.5 rounded-xl space-y-2 transition-all min-h-[140px] flex flex-col justify-between shadow-2xs ${
                    isInactive
                      ? 'bg-slate-100 dark:bg-slate-900/50 border-dashed border-slate-300 dark:border-slate-800 opacity-60'
                      : 'bg-[var(--paper)] border-[var(--line)] hover:border-[var(--primary-border)]'
                  }`}
                >
                  <div>
                    {/* Task Header */}
                    <div className="border-b border-[var(--line)] pb-1.5 mb-1.5 space-y-1">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="text-xs font-black text-[var(--ink)] truncate flex items-center gap-1" title={task.name}>
                          {isInactive && <EyeOff className="w-3 h-3 text-amber-600 shrink-0" />}
                          <span className={isInactive ? 'line-through text-[var(--muted)]' : ''}>{task.name}</span>
                        </h4>

                        <div className="flex items-center gap-1 shrink-0">
                          <span className="text-[10px] font-black bg-[var(--primary-soft)] text-[var(--primary)] border border-[var(--primary-border)] px-1.5 py-0.2 rounded-full">
                            {members.length}
                          </span>

                          {/* Action: Clear single task */}
                          <button
                            onClick={() => clearTaskAssignments(task.id)}
                            disabled={members.length === 0}
                            className="p-1 hover:bg-red-100 dark:hover:bg-red-950 text-slate-400 hover:text-red-600 rounded cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Limpar dimensionamento desta tarefa"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>

                          {/* Action: Toggle Active/Inactive */}
                          <button
                            onClick={() => updateTask(task.id, { active: isInactive ? true : false })}
                            className="p-1 hover:bg-[var(--bg)] text-slate-400 hover:text-[var(--primary)] rounded cursor-pointer"
                            title={isInactive ? 'Ativar Tarefa' : 'Desativar / Ocultar Tarefa'}
                          >
                            {isInactive ? <EyeOff className="w-3 h-3 text-amber-600" /> : <Eye className="w-3 h-3" />}
                          </button>
                        </div>
                      </div>

                      {/* Linked roles / categories indicators */}
                      {(roleMatches || catMatches) && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {roleMatches && (
                            <span className="text-[8.5px] font-extrabold px-1 py-0.1 bg-[var(--bg)] text-[var(--primary)] border border-[var(--primary-border)] rounded truncate max-w-[130px]">
                              {task.allowedRoles?.join(', ')}
                            </span>
                          )}
                          {catMatches && (
                            <span className="text-[8.5px] font-extrabold px-1 py-0.1 bg-amber-50 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200 border border-amber-200 rounded truncate max-w-[130px]">
                              {task.allowedCategories?.join(', ')}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Assigned Members */}
                    <div className="space-y-1 max-h-56 overflow-y-auto pr-0.5">
                      {isInactive ? (
                        <div className="p-3 text-center text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-md">
                          Tarefa desativada (Não entra em intervalos)
                        </div>
                      ) : members.length > 0 ? (
                        members.map((col) => {
                          if (!col) return null;
                          return (
                            <div
                              key={col.id}
                              className="p-1 bg-[var(--bg)] border border-[var(--line)] rounded-md flex items-center justify-between text-[10px] hover:border-[var(--primary)] transition-colors shadow-2xs"
                            >
                              <div className="min-w-0 pr-1">
                                <span className="font-extrabold text-[var(--ink)] truncate block text-[10px]">
                                  {col.name} <span className="text-[var(--primary)] font-black">[{col.scale}]</span>
                                </span>
                                <span className="text-[8.5px] text-[var(--muted)] truncate block">
                                  {col.role || 'Geral'} • {col.category || 'Geral'}
                                </span>
                              </div>
                              <button
                                onClick={() => unassignTask(col.id)}
                                className="p-0.5 text-slate-400 hover:text-red-500 rounded shrink-0 cursor-pointer"
                                title="Remover da tarefa"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          );
                        })
                      ) : (
                        <div className="p-4 text-center text-[10px] font-bold text-[var(--muted)] border border-dashed border-[var(--line)] rounded-md bg-[var(--bg)]/50">
                          Solte pessoas aqui
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Near-Mouse Contextual Assignment Popover */}
      {popoverState && selectedCol && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/10 backdrop-blur-[1px]"
            onClick={() => setPopoverState(null)}
          />

          <div
            style={{
              position: 'fixed',
              top: `${popoverState.top}px`,
              left: `${popoverState.left}px`,
            }}
            className="z-50 w-72 bg-[var(--paper)] border-2 border-[var(--primary-border)] rounded-xl p-3 shadow-2xl space-y-2 animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-start justify-between border-b border-[var(--line)] pb-2">
              <div>
                <span className="text-[9.5px] font-black text-[var(--primary)] uppercase tracking-wider block">
                  Atribuir Tarefa
                </span>
                <h4 className="text-xs font-black text-[var(--ink)] leading-tight">{selectedCol.name}</h4>
                <div className="flex items-center gap-1 text-[9px] font-bold text-[var(--muted)] mt-0.5">
                  <span className="bg-[var(--bg)] border border-[var(--line)] px-1 rounded text-[var(--ink)]">
                    {selectedCol.role || 'Sem cargo'}
                  </span>
                  <span>•</span>
                  <span className="bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-200 px-1 rounded">
                    {selectedCol.category || 'Sem cat'}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setPopoverState(null)}
                className="p-1 text-[var(--muted)] hover:text-[var(--ink)] rounded-md hover:bg-[var(--bg)] cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-1 max-h-[320px] overflow-y-auto pr-0.5">
              {popoverTasks.recommended.length > 0 && (
                <div className="space-y-1">
                  <div className="text-[9px] font-extrabold text-[var(--primary)] uppercase tracking-wider flex items-center gap-1 pt-0.5">
                    <Sparkles className="w-3 h-3" />
                    <span>Recomendadas para {selectedCol.role || 'este perfil'}</span>
                  </div>
                  {popoverTasks.recommended.map((t) => {
                    const currentCount = t.members.length;
                    return (
                      <button
                        key={t.id}
                        onClick={() => {
                          assignTask(selectedCol.id, t.id);
                          showNotice(`Colaborador ${selectedCol.name} alocado para ${t.name}!`);
                          setPopoverState(null);
                        }}
                        className="w-full text-left p-1.5 rounded-lg text-xs font-bold bg-[var(--bg)] hover:bg-[var(--primary)] hover:text-white transition-colors flex items-center justify-between group cursor-pointer border border-[var(--line)] hover:border-[var(--primary-border)] shadow-2xs"
                      >
                        <span className="truncate pr-1">{t.name}</span>
                        <span className="text-[9px] font-black bg-[var(--paper)] text-[var(--ink)] group-hover:bg-white group-hover:text-[var(--primary)] px-1.5 py-0.2 rounded-full border border-[var(--line)] shrink-0">
                          {currentCount}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {popoverTasks.others.length > 0 && (
                <div className="pt-1.5 border-t border-[var(--line)]">
                  {!showOtherTasks ? (
                    <button
                      onClick={() => setShowOtherTasks(true)}
                      className="w-full py-1.5 px-2 bg-[var(--bg)] hover:bg-[var(--line)] text-[var(--ink)] rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer border border-[var(--line)]"
                    >
                      <Plus className="w-3.5 h-3.5 text-[var(--primary)]" />
                      <span>Outras tarefas ({popoverTasks.others.length})</span>
                    </button>
                  ) : (
                    <div className="space-y-1 pt-1">
                      <div className="text-[9px] font-bold text-[var(--muted)] uppercase tracking-wider">
                        Outras Tarefas (Outro Cargo/Categoria)
                      </div>
                      {popoverTasks.others.map((t) => {
                        const currentCount = t.members.length;
                        return (
                          <button
                            key={t.id}
                            onClick={() => {
                              assignTask(selectedCol.id, t.id);
                              setPopoverState(null);
                            }}
                            className="w-full text-left p-1.5 rounded-lg text-xs font-semibold bg-[var(--bg)]/70 hover:bg-[var(--primary)] hover:text-white transition-colors flex items-center justify-between group cursor-pointer border border-[var(--line)]"
                          >
                            <span className="truncate pr-1">{t.name}</span>
                            <span className="text-[9px] font-bold bg-[var(--paper)] text-[var(--muted)] group-hover:bg-white group-hover:text-[var(--primary)] px-1.5 py-0.2 rounded-full shrink-0">
                              {currentCount}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* GUIDED STEP-BY-STEP DIMENSIONING MODAL */}
      {showGuidedWizard && currentWizardTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/75 backdrop-blur-xs">
          <div className="bg-[var(--paper)] border-2 border-[var(--primary-border)] rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Wizard Header */}
            <div className="p-4 bg-[var(--bg)] border-b border-[var(--line)] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-500/20 text-amber-600 rounded-xl">
                  <Compass className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] font-black uppercase text-amber-600 tracking-wider">
                    Modo Guiado Passo a Passo (Tarefa {wizardStep + 1} de {activeTasksList.length})
                  </div>
                  <h3 className="text-base font-black text-[var(--ink)]">{currentWizardTask.name}</h3>
                </div>
              </div>

              <button
                onClick={() => setShowGuidedWizard(false)}
                className="p-1.5 hover:bg-[var(--paper)] rounded-xl text-[var(--muted)] hover:text-[var(--ink)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Wizard Stepper Progress Bar */}
            <div className="w-full bg-[var(--line)] h-1.5">
              <div
                className="bg-[var(--primary)] h-1.5 transition-all duration-300"
                style={{ width: `${((wizardStep + 1) / activeTasksList.length) * 100}%` }}
              />
            </div>

            {/* Wizard Content */}
            <div className="p-4 overflow-y-auto space-y-4 flex-1">
              {/* Currently Assigned List */}
              <div className="bg-[var(--bg)] p-3 rounded-xl border border-[var(--line)] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-[var(--ink)]">
                    Colaboradores Alocados nesta Tarefa ({currentWizardTask.members.length})
                  </span>
                  {currentWizardTask.members.length > 0 && (
                    <button
                      onClick={() => clearTaskAssignments(currentWizardTask.id)}
                      className="text-[11px] text-red-600 font-bold hover:underline cursor-pointer"
                    >
                      Limpar esta tarefa
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {currentWizardTask.members.length > 0 ? (
                    currentWizardTask.members.map((mId) => {
                      const col = state.collaborators.find((c) => c.id === mId);
                      if (!col) return null;
                      return (
                        <div
                          key={col.id}
                          className="px-2 py-1 bg-[var(--paper)] border border-[var(--line)] rounded-lg text-xs font-bold text-[var(--ink)] flex items-center gap-1.5 shadow-2xs"
                        >
                          <span>{col.name}</span>
                          <button
                            onClick={() => unassignTask(col.id)}
                            className="p-0.5 hover:bg-red-100 dark:hover:bg-red-950 text-red-600 rounded"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-xs text-[var(--muted)] italic p-1">
                      Nenhum colaborador atribuído a esta tarefa ainda.
                    </p>
                  )}
                </div>
              </div>

              {/* Unassigned Candidates for this Task */}
              <div className="space-y-2">
                <h4 className="text-xs font-black text-[var(--ink)] flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-[var(--primary)]" />
                  <span>Escolha entre os disponíveis ({unassignedPeople.length} sem tarefa):</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
                  {unassignedPeople.map((col) => {
                    const hasRoleReq = (currentWizardTask.allowedRoles || []).length > 0;
                    const isMatched = !hasRoleReq || (currentWizardTask.allowedRoles || []).includes(col.role);

                    return (
                      <div
                        key={col.id}
                        className={`p-2 rounded-xl border flex items-center justify-between text-xs transition-all ${
                          isMatched
                            ? 'bg-[var(--paper)] border-[var(--primary-border)]'
                            : 'bg-[var(--bg)] border-[var(--line)] opacity-80'
                        }`}
                      >
                        <div className="min-w-0 pr-1">
                          <span className="font-extrabold text-[var(--ink)] truncate block">{col.name}</span>
                          <span className="text-[10px] text-[var(--muted)]">
                            {col.role || 'Geral'} • {col.category || 'Operacional'}
                          </span>
                        </div>

                        <button
                          onClick={() => assignTask(col.id, currentWizardTask.id)}
                          className="px-2 py-1 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-[11px] font-black rounded-lg cursor-pointer shrink-0"
                        >
                          Atribuir
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Wizard Footer Navigation */}
            <div className="p-3 bg-[var(--bg)] border-t border-[var(--line)] flex items-center justify-between">
              <button
                onClick={() => setWizardStep((prev) => Math.max(0, prev - 1))}
                disabled={wizardStep === 0}
                className="px-3 py-1.5 border border-[var(--line)] text-xs font-bold rounded-xl flex items-center gap-1 disabled:opacity-40 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Anterior</span>
              </button>

              <div className="text-xs font-bold text-[var(--muted)]">
                {wizardStep + 1} / {activeTasksList.length}
              </div>

              {wizardStep < activeTasksList.length - 1 ? (
                <button
                  onClick={() => setWizardStep((prev) => prev + 1)}
                  className="px-4 py-1.5 bg-[var(--primary)] text-white text-xs font-black rounded-xl flex items-center gap-1 shadow-2xs cursor-pointer"
                >
                  <span>Próxima Tarefa</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  onClick={() => setShowGuidedWizard(false)}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl flex items-center gap-1 shadow-2xs cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Concluir</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
