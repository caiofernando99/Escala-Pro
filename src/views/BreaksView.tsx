import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { SearchInput } from '../components/SearchInput';
import { MultiSelectFilter } from '../components/MultiSelectFilter';
import {
  Clock,
  RefreshCw,
  Users,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Filter,
  SlidersHorizontal,
  Sparkles,
  GripVertical,
  CheckSquare,
  Briefcase,
  Tag,
  ArrowRight,
  Zap,
} from 'lucide-react';
import { matchesSearch, isScaleOff, getCollaboratorStatus } from '../utils/helpers';

export const BreaksView: React.FC = () => {
  const { state, moveBreakInterval, generateBreaks, showNotice } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [allocationMode, setAllocationMode] = useState<'grid' | 'guided'>('grid');

  // Guided Mode State
  const [guidedTaskIndex, setGuidedTaskIndex] = useState(0);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);

  const [draggingCollaboratorId, setDraggingCollaboratorId] = useState<string | null>(null);
  const [dragOverTargetKey, setDragOverTargetKey] = useState<string | null>(null);
  const [dragOverTopSlotId, setDragOverTopSlotId] = useState<string | null>(null);

  const activeDate = state.selectedDate;
  const dayIntervals = state.intervals[activeDate] || {};

  // Unique roles and categories for multi-select filters
  const allRoles = Array.from(new Set(state.collaborators.map((c) => c.role).filter(Boolean)));
  const roleOptions = allRoles.map((r) => ({ label: r, value: r }));

  const allCategories = Array.from(new Set(state.collaborators.map((c) => c.category).filter(Boolean)));
  const categoryOptions = allCategories.map((cat) => ({ label: cat, value: cat }));

  // Active present people (includes manual presence overrides e.g. troca de folga)
  const presentPeople = state.collaborators.filter((c) => {
    const statusInfo = getCollaboratorStatus(c, activeDate, state);
    return statusInfo.status === 'presente';
  });

  // Filter present people
  const filteredPeopleIds = new Set(
    presentPeople
      .filter((p) => {
        const matchesQuery = matchesSearch(p.name, searchTerm) || matchesSearch(p.role, searchTerm);
        const matchesRole = selectedRoles.length === 0 || selectedRoles.includes(p.role);
        const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(p.category);
        return matchesQuery && matchesRole && matchesCategory;
      })
      .map((p) => p.id)
  );

  // Filter active tasks matching selected roles / categories
  const activeTasks = (state.tasks || [])
    .filter((t) => t.active !== false)
    .filter((t) => {
      if (selectedRoles.length === 0) return true;
      if (!t.allowedRoles || t.allowedRoles.length === 0) return true;
      return t.allowedRoles.some((r) => selectedRoles.includes(r));
    })
    .filter((t) => {
      if (selectedCategories.length === 0) return true;
      if (!t.allowedCategories || t.allowedCategories.length === 0) return true;
      return t.allowedCategories.some((cat) => selectedCategories.includes(cat));
    });

  // Helper to find break slot for a person
  const getPersonBreakSlot = (personId: string) => {
    return state.breaks.find((b) => (dayIntervals[b.id] || []).includes(personId)) || null;
  };

  // Guided Mode Task Navigation
  const tasksWithMembers = activeTasks.filter((t) =>
    t.members.some((mId) => filteredPeopleIds.has(mId))
  );

  const currentGuidedTask = tasksWithMembers[guidedTaskIndex] || tasksWithMembers[0];

  const handleBulkAssignBreak = (breakSlotId: string | null) => {
    if (selectedMemberIds.length === 0) return;
    selectedMemberIds.forEach((mId) => {
      const currentSlot = getPersonBreakSlot(mId);
      moveBreakInterval(mId, currentSlot ? currentSlot.id : null, breakSlotId);
    });
    const slotObj = state.breaks.find((b) => b.id === breakSlotId);
    showNotice(
      `${selectedMemberIds.length} colaborador(es) alocado(s) para ${slotObj ? slotObj.time : 'Intervalos pendentes'}!`
    );
    setSelectedMemberIds([]);
  };

  return (
    <div className="space-y-3 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-[var(--paper)] p-3 rounded-xl border border-[var(--line)] shadow-2xs">
        <div>
          <div className="flex items-center gap-1.5 text-[11px] font-black text-[var(--primary)] uppercase tracking-wider">
            <Clock className="w-3.5 h-3.5" />
            <span>Escala de Intervalos</span>
          </div>
          <h3 className="text-base font-black text-[var(--ink)] leading-tight">Gestão de Horários de Intervalo</h3>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Mode Switcher */}
          <div className="flex items-center p-1 bg-[var(--bg)] border border-[var(--line)] rounded-xl text-xs font-extrabold">
            <button
              onClick={() => setAllocationMode('grid')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                allocationMode === 'grid'
                  ? 'bg-[var(--paper)] text-[var(--primary)] shadow-2xs'
                  : 'text-[var(--muted)] hover:text-[var(--ink)]'
              }`}
            >
              Visão Geral (Grid)
            </button>
            <button
              onClick={() => setAllocationMode('guided')}
              className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                allocationMode === 'guided'
                  ? 'bg-[var(--primary)] text-white shadow-2xs font-black'
                  : 'text-[var(--muted)] hover:text-[var(--ink)]'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Modo Guiado Passo a Passo</span>
            </button>
          </div>

          <button
            onClick={() => {
              generateBreaks();
              showNotice('Intervalos gerados e rebalanceados com sucesso!');
            }}
            className="px-3 py-1.5 bg-[var(--primary)] text-white text-xs font-black rounded-xl hover:bg-blue-700 flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Gerar / Rebalancear Todos</span>
          </button>
        </div>
      </div>

      {/* TOP CONFIGURATION: HORÁRIOS DE INTERVALO DISPONÍVEIS & FILTROS DA EQUIPE */}
      <div className="bg-[var(--paper)] border border-[var(--primary-border)] p-2.5 rounded-xl space-y-2.5 shadow-2xs">
        <div className="flex items-center justify-between border-b border-[var(--line)] pb-1.5">
          <div className="flex items-center gap-1.5">
            <SlidersHorizontal className="w-3.5 h-3.5 text-[var(--primary)]" />
            <h4 className="text-xs font-black text-[var(--ink)]">Horários de Intervalo no Turno</h4>
          </div>
          <span className="text-[11px] font-bold text-[var(--muted)]">
            Equipe Ativa: <strong className="text-[var(--ink)]">{presentPeople.length} pessoas</strong>
          </span>
        </div>

        {/* Break Slot Cards Grid (also acts as drag drop targets) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
          {state.breaks.map((b) => {
            const assignedList = dayIntervals[b.id] || [];
            const count = assignedList.length;
            const isHoveredSlot = dragOverTopSlotId === b.id;

            return (
              <div
                key={b.id}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                  if (dragOverTopSlotId !== b.id) setDragOverTopSlotId(b.id);
                }}
                onDragLeave={() => setDragOverTopSlotId(null)}
                onDrop={(e) => {
                  e.preventDefault();
                  try {
                    const raw = e.dataTransfer.getData('text/plain');
                    if (raw) {
                      const { collaboratorId, fromSlotId } = JSON.parse(raw);
                      if (collaboratorId) {
                        moveBreakInterval(collaboratorId, fromSlotId, b.id);
                        showNotice(`Colaborador movido para o intervalo das ${b.time}!`);
                      }
                    }
                  } catch (err) {
                    // fallback
                  }
                  setDragOverTopSlotId(null);
                  setDraggingCollaboratorId(null);
                }}
                className={`p-2 rounded-xl border text-xs flex flex-col justify-between transition-all duration-150 ${
                  isHoveredSlot
                    ? 'border-2 border-dashed border-[var(--primary)] bg-[var(--primary-soft)] scale-102 shadow-md'
                    : 'border-[var(--line)] bg-[var(--bg)] text-[var(--ink)] hover:border-[var(--primary-border)]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between font-black mb-0.5">
                    <span className="text-xs font-black text-[var(--ink)]">{b.time}</span>
                    <span className="px-1.5 py-0.2 rounded-md text-[9px] bg-[var(--paper)] text-[var(--primary)] border border-[var(--line)] font-bold">
                      {b.shift || 'Geral'}
                    </span>
                  </div>
                  <div className="text-base font-black my-0.5 text-[var(--primary)]">
                    {count} <span className="text-[10px] font-semibold opacity-75 text-[var(--muted)]">alocado{count !== 1 ? 's' : ''}</span>
                  </div>
                </div>

                {isHoveredSlot ? (
                  <div className="text-[9px] font-black text-[var(--primary)] animate-pulse text-center pt-0.5 border-t border-[var(--primary-border)]">
                    Solte em {b.time}
                  </div>
                ) : (
                  <div className="text-[9px] text-[var(--muted)] text-center pt-0.5 opacity-60">
                    Arraste até aqui
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* MULTI-SELECT FILTERS FOR TASK & BREAK ALLOCATION */}
        <div className="pt-2 border-t border-[var(--line)] grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Buscar nome do colaborador..."
            className="w-full"
          />

          <MultiSelectFilter
            label="Cargo"
            options={roleOptions}
            selectedValues={selectedRoles}
            onChange={setSelectedRoles}
            allLabel="Todos os Cargos"
            icon={<Briefcase className="w-3 h-3 text-[var(--primary)]" />}
          />

          <MultiSelectFilter
            label="Categoria"
            options={categoryOptions}
            selectedValues={selectedCategories}
            onChange={setSelectedCategories}
            allLabel="Todas as Categorias"
            icon={<Tag className="w-3 h-3 text-[var(--primary)]" />}
          />
        </div>
      </div>

      {/* MODE 1: GRID ALLOCATION VIEW */}
      {allocationMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2.5">
          {activeTasks.map((task) => {
            const taskMembers = task.members
              .map((id) => state.collaborators.find((c) => c.id === id))
              .filter((c): c is NonNullable<typeof c> => Boolean(c) && filteredPeopleIds.has(c.id));

            // Group members by break slot
            const timeSlotGroups: Array<{
              slot: typeof state.breaks[number] | null;
              members: typeof taskMembers;
            }> = [];

            state.breaks.forEach((b) => {
              const inThisSlot = taskMembers.filter((m) => (dayIntervals[b.id] || []).includes(m.id));
              if (inThisSlot.length > 0 || !searchTerm) {
                timeSlotGroups.push({
                  slot: b,
                  members: inThisSlot,
                });
              }
            });

            // Members with no break slot assigned (Intervalos pendentes)
            const noSlotMembers = taskMembers.filter((m) => !getPersonBreakSlot(m.id));
            if (noSlotMembers.length > 0) {
              timeSlotGroups.push({
                slot: null,
                members: noSlotMembers,
              });
            }

            return (
              <div
                key={task.id}
                className="bg-[var(--paper)] border border-[var(--line)] hover:border-[var(--primary-border)] rounded-2xl p-3 shadow-2xs space-y-2 flex flex-col justify-between"
              >
                <div>
                  {/* Task Header */}
                  <div className="flex items-center justify-between border-b border-[var(--line)] pb-1.5 mb-1.5">
                    <h4 className="font-extrabold text-xs text-[var(--ink)] flex items-center gap-1 truncate">
                      <span className="truncate">{task.name}</span>
                    </h4>
                    <span className="text-[10px] font-black bg-[var(--primary-soft)] text-[var(--primary)] px-2 py-0.2 rounded-full border border-[var(--primary-border)] shrink-0">
                      {taskMembers.length} pessoas
                    </span>
                  </div>

                  {/* Time Slots Divider & Member Groups */}
                  <div className="space-y-2 max-h-[380px] overflow-y-auto pr-0.5">
                    {timeSlotGroups.map(({ slot, members }) => {
                      const slotLabel = slot ? slot.time : 'Intervalos pendentes';
                      const targetKey = `${task.id}-${slot ? slot.id : 'no-slot'}`;
                      const isTargetHovered = dragOverTargetKey === targetKey;

                      return (
                        <div
                          key={slot ? slot.id : 'no-slot'}
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.dataTransfer.dropEffect = 'move';
                            if (dragOverTargetKey !== targetKey) setDragOverTargetKey(targetKey);
                          }}
                          onDragLeave={() => setDragOverTargetKey(null)}
                          onDrop={(e) => {
                            e.preventDefault();
                            try {
                              const raw = e.dataTransfer.getData('text/plain');
                              if (raw) {
                                const { collaboratorId, fromSlotId } = JSON.parse(raw);
                                const toSlotId = slot ? slot.id : null;
                                if (collaboratorId) {
                                  moveBreakInterval(collaboratorId, fromSlotId, toSlotId);
                                  showNotice(`Intervalo atualizado com sucesso!`);
                                }
                              }
                            } catch (err) {
                              // fallback
                            }
                            setDragOverTargetKey(null);
                            setDraggingCollaboratorId(null);
                          }}
                          className={`space-y-1 p-1 rounded-xl transition-all duration-150 ${
                            isTargetHovered
                              ? 'bg-[var(--primary-soft)] border-2 border-dashed border-[var(--primary)] shadow-sm'
                              : ''
                          }`}
                        >
                          {/* HORIZONTAL DIVIDER LINE WITH TIME SLOT HEADER */}
                          <div className="relative flex items-center my-1">
                            <div className="flex-grow border-t border-[var(--line)]"></div>
                            <span
                              className={`shrink-0 px-2 py-0.2 text-[10px] font-extrabold border rounded-full shadow-2xs flex items-center gap-1 transition-all ${
                                !slot
                                  ? 'bg-amber-500/10 text-amber-900 dark:text-amber-200 border-amber-500/30'
                                  : isTargetHovered
                                  ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
                                  : 'bg-[var(--bg)] text-[var(--primary)] border-[var(--line)]'
                              }`}
                            >
                              <Clock className="w-2.5 h-2.5" />
                              <span>
                                {slotLabel} ({members.length})
                              </span>
                            </span>
                            <div className="flex-grow border-t border-[var(--line)]"></div>
                          </div>

                          {/* Members inside this time slot */}
                          {members.length > 0 ? (
                            <div className="space-y-1">
                              {members.map((col) => (
                                <div
                                  key={col.id}
                                  draggable
                                  onDragStart={(e) => {
                                    setDraggingCollaboratorId(col.id);
                                    e.dataTransfer.setData(
                                      'text/plain',
                                      JSON.stringify({
                                        collaboratorId: col.id,
                                        fromSlotId: slot ? slot.id : null,
                                      })
                                    );
                                  }}
                                  className="p-1.5 bg-[var(--bg)] border border-[var(--line)] hover:border-[var(--primary)] rounded-lg flex items-center justify-between text-[10px] cursor-grab active:cursor-grabbing transition-colors shadow-2xs"
                                >
                                  <div className="flex items-center gap-1.5 min-w-0 pr-1">
                                    <GripVertical className="w-3 h-3 text-[var(--muted)] shrink-0" />
                                    <div className="truncate">
                                      <span className="font-extrabold text-[var(--ink)] block truncate">
                                        {col.name} <span className="text-[var(--primary)] font-black">[{col.scale}]</span>
                                      </span>
                                      <span className="text-[8.5px] text-[var(--muted)] truncate block">
                                        {col.role || 'Geral'}
                                      </span>
                                    </div>
                                  </div>

                                  <span className="text-[8.5px] font-extrabold bg-[var(--paper)] text-[var(--muted)] border border-[var(--line)] px-1.5 py-0.2 rounded-md shrink-0">
                                    {slot ? slot.time : 'Pendente'}
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-[9.5px] text-center text-[var(--muted)] py-1 italic">
                              Arraste um colaborador até aqui
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
      )}

      {/* MODE 2: GUIDED STEP-BY-STEP ALLOCATION VIEW */}
      {allocationMode === 'guided' && currentGuidedTask && (
        <div className="bg-[var(--paper)] border-2 border-[var(--primary-border)] p-4 rounded-2xl shadow-xl space-y-4">
          {/* Guided Task Navigation Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] pb-3">
            <div>
              <span className="text-[10px] font-black text-[var(--primary)] uppercase tracking-wider block">
                MODO DE ALOCAÇÃO SEQUENCIAL GUIADA
              </span>
              <h3 className="text-lg font-black text-[var(--ink)] flex items-center gap-2">
                <span>{currentGuidedTask.name}</span>
                <span className="text-xs font-bold px-2.5 py-0.5 bg-[var(--primary-soft)] text-[var(--primary)] rounded-full border border-[var(--primary-border)]">
                  Tarefa {guidedTaskIndex + 1} de {tasksWithMembers.length}
                </span>
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <button
                disabled={guidedTaskIndex === 0}
                onClick={() => {
                  setGuidedTaskIndex((prev) => Math.max(0, prev - 1));
                  setSelectedMemberIds([]);
                }}
                className="px-3 py-1.5 bg-[var(--bg)] border border-[var(--line)] disabled:opacity-40 text-xs font-extrabold rounded-xl hover:bg-[var(--paper)] text-[var(--ink)] flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Anterior</span>
              </button>

              <button
                disabled={guidedTaskIndex >= tasksWithMembers.length - 1}
                onClick={() => {
                  setGuidedTaskIndex((prev) => Math.min(tasksWithMembers.length - 1, prev + 1));
                  setSelectedMemberIds([]);
                }}
                className="px-4 py-1.5 bg-[var(--primary)] text-white disabled:opacity-40 text-xs font-black rounded-xl hover:bg-blue-700 flex items-center gap-1 shadow-2xs cursor-pointer"
              >
                <span>Próxima Tarefa</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Guided Quick Assign Bar */}
          <div className="bg-[var(--bg)] border border-[var(--line)] p-3 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-[var(--ink)] flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span>Atribuição Rápida em Lote ({selectedMemberIds.length} selecionados)</span>
              </span>
              {selectedMemberIds.length > 0 && (
                <button
                  onClick={() => setSelectedMemberIds([])}
                  className="text-xs text-[var(--muted)] font-bold hover:underline cursor-pointer"
                >
                  Limpar Seleção
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {state.breaks.map((b) => (
                <button
                  key={b.id}
                  disabled={selectedMemberIds.length === 0}
                  onClick={() => handleBulkAssignBreak(b.id)}
                  className="px-3 py-1.5 bg-[var(--paper)] hover:bg-[var(--primary-soft)] border border-[var(--line)] hover:border-[var(--primary-border)] disabled:opacity-40 text-xs font-black text-[var(--primary)] rounded-xl flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Definir {b.time}</span>
                </button>
              ))}
              <button
                disabled={selectedMemberIds.length === 0}
                onClick={() => handleBulkAssignBreak(null)}
                className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-900 dark:text-amber-200 border border-amber-500/30 disabled:opacity-40 text-xs font-extrabold rounded-xl transition-all cursor-pointer"
              >
                Desvincular (Mover p/ Pendentes)
              </button>
            </div>
          </div>

          {/* Members list inside current guided task */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {currentGuidedTask.members
              .map((mId) => state.collaborators.find((c) => c.id === mId))
              .filter((c): c is NonNullable<typeof c> => Boolean(c) && filteredPeopleIds.has(c.id))
              .map((col) => {
                const slot = getPersonBreakSlot(col.id);
                const isSelected = selectedMemberIds.includes(col.id);

                return (
                  <div
                    key={col.id}
                    onClick={() => {
                      if (isSelected) {
                        setSelectedMemberIds(selectedMemberIds.filter((id) => id !== col.id));
                      } else {
                        setSelectedMemberIds([...selectedMemberIds, col.id]);
                      }
                    }}
                    className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-[var(--primary-soft)] border-[var(--primary)] ring-2 ring-[var(--primary-border)]'
                        : 'bg-[var(--bg)] border-[var(--line)] hover:border-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                          isSelected
                            ? 'bg-[var(--primary)] border-[var(--primary)] text-white'
                            : 'border-[var(--line)] bg-[var(--paper)]'
                        }`}
                      >
                        {isSelected && <CheckCircle2 className="w-4 h-4" />}
                      </div>
                      <div>
                        <h4 className="text-xs font-extrabold text-[var(--ink)]">
                          {col.name} <span className="text-[var(--primary)] font-black">[{col.scale}]</span>
                        </h4>
                        <span className="text-[10px] text-[var(--muted)] font-bold block">
                          {col.role || 'Geral'} • TL: {col.teamLeader || 'Geral'}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span
                        className={`text-xs font-black px-2.5 py-1 rounded-lg border block ${
                          slot
                            ? 'bg-[var(--paper)] text-[var(--primary)] border-[var(--primary-border)]'
                            : 'bg-amber-500/15 text-amber-900 dark:text-amber-200 border-amber-500/30'
                        }`}
                      >
                        {slot ? slot.time : 'Intervalos pendentes'}
                      </span>
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
