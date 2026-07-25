import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { SearchInput } from '../components/SearchInput';
import {
  Shuffle,
  Trash2,
  Briefcase,
  Tag,
  CheckCircle2,
  X,
  Sparkles,
  Info,
} from 'lucide-react';
import { matchesSearch, isScaleOff } from '../utils/helpers';

export const AssignmentView: React.FC = () => {
  const { state, assignTask, unassignTask, clearAssignments, autoAssign } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  const [draggedColId, setDraggedColId] = useState<string | null>(null);
  const [contextMenuColId, setContextMenuColId] = useState<string | null>(null);

  const activeDate = state.selectedDate;

  // Active present people (not on vacation/leave/training and not scale off and attendance != false)
  const presentPeople = state.collaborators.filter((c) => {
    const hasAbsence = (c.absences || []).some((a) => activeDate >= a.startDate && activeDate <= a.endDate);
    if (hasAbsence) return false;
    const off = isScaleOff(state.calendar, activeDate, c.scale);
    if (off) return false;
    const manual = state.attendance[activeDate]?.[c.id];
    if (manual === false) return false;
    return true;
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

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
    setDraggedColId(id);
  };

  const handleDrop = (e: React.DragEvent, taskId: string) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain') || draggedColId;
    if (id) {
      assignTask(id, taskId);
    }
    setDraggedColId(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[var(--paper)] p-4 rounded-xl border border-[var(--line)]">
        <div>
          <h3 className="text-lg font-bold text-[var(--ink)]">Dimensionamento de Tarefas</h3>
          <p className="text-xs text-[var(--muted)]">
            Arraste os colaboradores para as tarefas ou clique no nome para selecionar. As tarefas podem ser filtradas por cargo e categoria.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={clearAssignments}
            className="px-3 py-1.5 border border-[var(--line)] text-xs font-semibold rounded-lg hover:bg-[var(--bg)] text-[var(--ink)]"
          >
            Limpar Dimensionamento
          </button>
          <button
            onClick={autoAssign}
            className="px-4 py-1.5 bg-[var(--primary)] text-white text-xs font-bold rounded-lg hover:bg-[var(--primary-hover)] flex items-center gap-1.5 shadow-xs"
          >
            <Shuffle className="w-3.5 h-3.5" />
            <span>Auto Dimensionar</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[var(--paper)] border border-[var(--line)] p-4 rounded-xl flex flex-wrap items-center gap-3">
        <SearchInput
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Pesquisar por nome..."
          className="w-full sm:w-64"
        />

        <div className="flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-[var(--muted)]" />
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="bg-[var(--bg)] border border-[var(--line)] rounded-lg px-2.5 py-2 text-xs font-semibold text-[var(--ink)]"
          >
            <option value="">Todos os Cargos</option>
            {state.roles.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <Tag className="w-4 h-4 text-[var(--muted)]" />
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-[var(--bg)] border border-[var(--line)] rounded-lg px-2.5 py-2 text-xs font-semibold text-[var(--ink)]"
          >
            <option value="">Todas as Categorias</option>
            {state.categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {(searchTerm || filterRole || filterCategory) && (
          <button
            onClick={() => {
              setSearchTerm('');
              setFilterRole('');
              setFilterCategory('');
            }}
            className="text-xs font-bold text-red-600 hover:underline flex items-center gap-1 ml-auto"
          >
            <X className="w-3.5 h-3.5" />
            <span>Limpar Filtros</span>
          </button>
        )}
      </div>

      {/* Main Dimensioning Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Available Unassigned People Pool (4 cols) */}
        <div className="lg:col-span-4 bg-[var(--paper)] border border-[var(--line)] p-4 rounded-xl space-y-3 sticky top-4">
          <div className="flex items-center justify-between border-b border-[var(--line)] pb-2">
            <h4 className="text-sm font-bold text-[var(--ink)]">
              Disponíveis Não Atribuídos ({unassignedPeople.length})
            </h4>
            <span className="text-[10px] bg-[var(--bg)] px-2 py-0.5 rounded font-mono font-bold text-[var(--muted)]">
              {presentPeople.length} Presentes
            </span>
          </div>

          <div className="space-y-2 max-h-[calc(100vh-250px)] overflow-y-auto pr-1">
            {unassignedPeople.length > 0 ? (
              unassignedPeople.map((col) => (
                <div
                  key={col.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, col.id)}
                  onClick={() => setContextMenuColId(col.id)}
                  className="p-3 bg-[var(--bg)] hover:bg-[var(--primary-soft)] border border-[var(--line)] hover:border-[var(--primary-border)] rounded-xl cursor-grab active:cursor-grabbing transition-all space-y-1.5 shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[var(--ink)]">{col.name}</span>
                    <span className="text-[10px] font-bold bg-[var(--paper)] px-2 py-0.5 rounded border border-[var(--line)] text-[var(--muted)]">
                      {col.shift}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                    <span className="px-1.5 py-0.5 bg-[var(--paper)] border border-[var(--line)] rounded font-semibold text-[var(--ink)]">
                      {col.role || 'Sem cargo'}
                    </span>
                    <span className="px-1.5 py-0.5 bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300 rounded font-semibold">
                      {col.category || 'Sem cat'}
                    </span>
                  </div>

                  {/* Skills badges if any */}
                  {col.skills && Object.keys(col.skills).some((s) => (col.skills?.[s] || 0) > 0) && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {Object.entries(col.skills).map(([s, lvl]) =>
                        Number(lvl) > 0 ? (
                          <span
                            key={s}
                            className="text-[9px] font-bold bg-purple-50 text-purple-800 dark:bg-purple-950 dark:text-purple-300 px-1.5 py-0.2 rounded"
                          >
                            {s} • N{lvl}
                          </span>
                        ) : null
                      )}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="p-8 text-center text-xs text-[var(--muted)] italic">
                Todos os colaboradores correspondentes aos filtros já estão dimensionados.
              </p>
            )}
          </div>
        </div>

        {/* Tasks List (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {state.tasks.map((task) => {
              const members = task.members
                .map((mId) => state.collaborators.find((c) => c.id === mId))
                .filter(Boolean);

              const roleMatches = (task.allowedRoles || []).length > 0;
              const catMatches = (task.allowedCategories || []).length > 0;

              return (
                <div
                  key={task.id}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleDrop(e, task.id)}
                  className="bg-[var(--paper)] border-2 border-[var(--line)] hover:border-[var(--primary-border)] p-4 rounded-xl space-y-3 transition-all min-h-[160px] flex flex-col justify-between"
                >
                  <div>
                    {/* Task Header */}
                    <div className="flex items-center justify-between border-b border-[var(--line)] pb-2 mb-2">
                      <div>
                        <h4 className="text-sm font-black text-[var(--ink)]">{task.name}</h4>
                        {/* Linked roles / categories indicators */}
                        <div className="flex flex-wrap gap-1 mt-1">
                          {roleMatches && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 bg-[var(--primary-soft)] text-[var(--primary)] rounded">
                              Cargos: {task.allowedRoles?.join(', ')}
                            </span>
                          )}
                          {catMatches && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 rounded">
                              Cats: {task.allowedCategories?.join(', ')}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="text-xs font-black bg-[var(--primary)] text-white px-2.5 py-1 rounded-full">
                        {members.length}
                      </span>
                    </div>

                    {/* Assigned Members */}
                    <div className="space-y-1.5">
                      {members.length > 0 ? (
                        members.map((col) => {
                          if (!col) return null;
                          return (
                            <div
                              key={col.id}
                              className="p-2 bg-[var(--bg)] border border-[var(--line)] rounded-lg flex items-center justify-between text-xs hover:border-[var(--primary)] transition-colors"
                            >
                              <div>
                                <span className="font-bold text-[var(--ink)]">{col.name}</span>
                                <div className="text-[10px] text-[var(--muted)]">
                                  {col.role} • {col.category}
                                </div>
                              </div>
                              <button
                                onClick={() => unassignTask(col.id)}
                                className="p-1 text-slate-400 hover:text-red-500 rounded"
                                title="Remover da tarefa"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          );
                        })
                      ) : (
                        <div className="p-6 text-center text-xs text-[var(--muted)] border border-dashed border-[var(--line)] rounded-lg">
                          Arraste pessoas até aqui
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

      {/* Quick Context Assign Modal */}
      {contextMenuColId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-[var(--paper)] border border-[var(--line)] rounded-xl p-5 max-w-xs w-full shadow-2xl space-y-3 relative">
            <button
              onClick={() => setContextMenuColId(null)}
              className="absolute top-3 right-3 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>

            <h4 className="text-sm font-bold text-[var(--ink)]">
              Atribuir {state.collaborators.find((c) => c.id === contextMenuColId)?.name}
            </h4>

            <p className="text-xs text-[var(--muted)]">Escolha a tarefa de destino:</p>

            <div className="space-y-1.5 max-h-60 overflow-y-auto">
              {state.tasks.map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    assignTask(contextMenuColId, t.id);
                    setContextMenuColId(null);
                  }}
                  className="w-full text-left p-2 rounded-lg text-xs font-semibold bg-[var(--bg)] hover:bg-[var(--primary)] hover:text-white transition-colors"
                >
                  {t.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
