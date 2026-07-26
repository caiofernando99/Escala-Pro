import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { SearchInput } from '../components/SearchInput';
import { Clock, RefreshCw, Users, CheckCircle2, ChevronRight, Filter, SlidersHorizontal, Sparkles, GripVertical } from 'lucide-react';
import { matchesSearch, isScaleOff } from '../utils/helpers';

export const BreaksView: React.FC = () => {
  const { state, moveBreakInterval, generateBreaks, showNotice } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('ALL');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('ALL');
  const [draggingCollaboratorId, setDraggingCollaboratorId] = useState<string | null>(null);
  const [dragOverTargetKey, setDragOverTargetKey] = useState<string | null>(null);
  const [dragOverTopSlotId, setDragOverTopSlotId] = useState<string | null>(null);

  const activeDate = state.selectedDate;
  const dayIntervals = state.intervals[activeDate] || {};

  // Unique roles and categories for quick filtering
  const allRoles = Array.from(new Set(state.collaborators.map((c) => c.role).filter(Boolean)));
  const allCategories = Array.from(new Set(state.collaborators.map((c) => c.category).filter(Boolean)));

  // Active present people
  const presentPeople = state.collaborators.filter((c) => {
    const hasAbsence = (c.absences || []).some((a) => activeDate >= a.startDate && activeDate <= a.endDate);
    if (hasAbsence) return false;
    const off = isScaleOff(state.calendar, activeDate, c.scale);
    if (off) return false;
    const manual = state.attendance[activeDate]?.[c.id];
    if (manual === false) return false;
    return true;
  });

  // Filter present people by search term, role and category
  const filteredPeopleIds = new Set(
    presentPeople
      .filter((p) => {
        const matchesQuery = matchesSearch(p.name, searchTerm) || matchesSearch(p.role, searchTerm);
        const matchesRole = selectedRoleFilter === 'ALL' || p.role === selectedRoleFilter;
        const matchesCategory = selectedCategoryFilter === 'ALL' || p.category === selectedCategoryFilter;
        return matchesQuery && matchesRole && matchesCategory;
      })
      .map((p) => p.id)
  );

  // Helper to find break slot for a person
  const getPersonBreakSlot = (personId: string) => {
    return state.breaks.find((b) => (dayIntervals[b.id] || []).includes(personId)) || null;
  };

  return (
    <div className="space-y-3 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-[var(--paper)] p-3 rounded-xl border border-[var(--line)] shadow-2xs">
        <div>
          <div className="flex items-center gap-1.5 text-[11px] font-black text-[var(--primary)] uppercase tracking-wider">
            <Clock className="w-3.5 h-3.5" />
            <span>Refeições da Equipe</span>
          </div>
          <h3 className="text-base font-black text-[var(--ink)] leading-tight">Gestão de Intervalos de Refeição</h3>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => {
              generateBreaks();
              showNotice('Intervalos gerados e rebalanceados com sucesso!');
            }}
            className="px-3 py-1.5 bg-[var(--primary)] text-white text-xs font-black rounded-lg hover:bg-[var(--primary-hover)] flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Gerar / Rebalancear Todos</span>
          </button>
        </div>
      </div>

      {/* TOP CONFIGURATION: HORÁRIOS DE INTERVALO DISPONÍVEIS & FILTROS DA EQUIPE */}
      <div className="bg-[var(--paper)] border border-[var(--primary-border)] p-2.5 rounded-xl space-y-2 shadow-2xs">
        <div className="flex items-center justify-between border-b border-[var(--line)] pb-1.5">
          <div className="flex items-center gap-1.5">
            <SlidersHorizontal className="w-3.5 h-3.5 text-[var(--primary)]" />
            <h4 className="text-xs font-black text-[var(--ink)]">Horários de Intervalo no Turno</h4>
          </div>
          <span className="text-[11px] font-bold text-[var(--muted)]">
            Equipe Ativa: <strong className="text-[var(--ink)]">{presentPeople.length} pessoas</strong>
          </span>
        </div>

        {/* Break Slot Cards Grid (also acts as drag drop targets!) */}
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
                className={`p-2 rounded-lg border text-xs flex flex-col justify-between transition-all duration-150 ${
                  isHoveredSlot
                    ? 'border-2 border-dashed border-[var(--primary)] bg-[var(--primary-soft)] scale-102 shadow-md'
                    : 'border-[var(--line)] bg-[var(--bg)] text-[var(--ink)] hover:border-[var(--primary-border)]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between font-black mb-0.5">
                    <span className="text-xs font-black text-[var(--ink)]">{b.time}</span>
                    <span className="px-1 py-0.2 rounded text-[9px] bg-[var(--paper)] text-[var(--primary)] border border-[var(--line)] font-bold">
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

        {/* QUICK FILTERS FOR LARGE TEAMS */}
        <div className="pt-2 border-t border-[var(--line)] flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center gap-1 text-[var(--muted)] font-bold shrink-0">
            <Filter className="w-3.5 h-3.5 text-[var(--primary)]" />
            <span className="text-[11px]">Filtrar:</span>
          </div>

          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Buscar nome..."
            className="w-36 sm:w-48"
          />

          {/* Role Filter */}
          <select
            value={selectedRoleFilter}
            onChange={(e) => setSelectedRoleFilter(e.target.value)}
            className="px-2 py-0.5 rounded-lg border border-[var(--line)] bg-[var(--bg)] text-[var(--ink)] font-semibold text-xs focus:ring-1 focus:ring-[var(--primary)] cursor-pointer"
          >
            <option value="ALL">Cargos ({allRoles.length})</option>
            {allRoles.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>

          {/* Category Filter */}
          <select
            value={selectedCategoryFilter}
            onChange={(e) => setSelectedCategoryFilter(e.target.value)}
            className="px-2 py-0.5 rounded-lg border border-[var(--line)] bg-[var(--bg)] text-[var(--ink)] font-semibold text-xs focus:ring-1 focus:ring-[var(--primary)] cursor-pointer"
          >
            <option value="ALL">Categorias ({allCategories.length})</option>
            {allCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {(searchTerm || selectedRoleFilter !== 'ALL' || selectedCategoryFilter !== 'ALL') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedRoleFilter('ALL');
                setSelectedCategoryFilter('ALL');
              }}
              className="text-xs font-bold text-red-600 dark:text-red-400 hover:underline ml-auto"
            >
              Limpar
            </button>
          )}
        </div>
      </div>

      {/* Grid of Tasks with HORIZONTAL LINES SEPARATING TIME SLOTS */}
      <div className="columns-1 sm:columns-2 md:columns-3 xl:columns-4 gap-2.5 space-y-2.5 [&>div]:break-inside-avoid">
        {state.tasks.map((task) => {
          const taskMembers = task.members
            .map((id) => state.collaborators.find((c) => c.id === id))
            .filter((c): c is NonNullable<typeof c> => Boolean(c) && filteredPeopleIds.has(c.id));

          // Group members by break slot
          const timeSlotGroups: Array<{
            slot: typeof state.breaks[number] | null;
            members: typeof taskMembers;
          }> = [];

          // First, add all defined break slots in chronological order
          state.breaks.forEach((b) => {
            const inThisSlot = taskMembers.filter((m) => (dayIntervals[b.id] || []).includes(m.id));
            if (inThisSlot.length > 0 || !searchTerm) {
              timeSlotGroups.push({
                slot: b,
                members: inThisSlot,
              });
            }
          });

          // Members with no break slot assigned
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
              className="bg-[var(--paper)] border border-[var(--line)] rounded-xl p-2.5 shadow-2xs space-y-2 inline-block w-full"
            >
              <div>
                {/* Task Header */}
                <div className="flex items-center justify-between border-b border-[var(--line)] pb-1.5 mb-1.5">
                  <h4 className="font-extrabold text-xs text-[var(--ink)] flex items-center gap-1 truncate">
                    <span className="truncate">{task.name}</span>
                  </h4>
                  <span className="text-[10px] font-black bg-[var(--primary-soft)] text-[var(--primary)] px-2 py-0.2 rounded-full shrink-0">
                    {taskMembers.length} pessoas
                  </span>
                </div>

                {/* Time Slots Divider & Member Groups */}
                <div className="space-y-2 max-h-[380px] overflow-y-auto pr-0.5">
                  {timeSlotGroups.map(({ slot, members }) => {
                    const slotLabel = slot ? slot.time : 'Sem Intervalo';
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
                        className={`space-y-1 p-1 rounded-lg transition-all duration-150 ${
                          isTargetHovered
                            ? 'bg-[var(--primary-soft)] border-2 border-dashed border-[var(--primary)] shadow-sm'
                            : ''
                        }`}
                      >
                        {/* HORIZONTAL DIVIDER LINE WITH TIME SLOT HEADER */}
                        <div className="relative flex items-center my-1">
                          <div className="flex-grow border-t border-[var(--line)]"></div>
                          <span
                            className={`shrink-0 px-2 py-0.2 text-[10px] font-extrabold uppercase border rounded-full shadow-2xs flex items-center gap-1 transition-all ${
                              isTargetHovered
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
                            {members.map((person) => {
                              const currentSlot = getPersonBreakSlot(person.id);
                              const isBeingDragged = draggingCollaboratorId === person.id;

                              return (
                                <div
                                  key={person.id}
                                  draggable={true}
                                  onDragStart={(e) => {
                                    e.dataTransfer.setData(
                                      'text/plain',
                                      JSON.stringify({
                                        collaboratorId: person.id,
                                        fromSlotId: currentSlot?.id || null,
                                      })
                                    );
                                    e.dataTransfer.effectAllowed = 'move';
                                    setDraggingCollaboratorId(person.id);
                                  }}
                                  onDragEnd={() => {
                                    setDraggingCollaboratorId(null);
                                    setDragOverTargetKey(null);
                                  }}
                                  className={`p-1 bg-[var(--bg)] border rounded-lg flex items-center justify-between text-[10px] transition-all ${
                                    isBeingDragged
                                      ? 'opacity-40 border-dashed border-[var(--primary)] scale-98'
                                      : 'border-[var(--line)] hover:border-[var(--primary-border)] shadow-2xs'
                                  }`}
                                >
                                  <div className="flex items-center gap-1 min-w-0 pr-1">
                                    <div
                                      className="p-0.5 text-[var(--muted)] hover:text-[var(--primary)] cursor-grab active:cursor-grabbing shrink-0"
                                      title="Arraste para alterar o intervalo"
                                    >
                                      <GripVertical className="w-3 h-3" />
                                    </div>
                                    <div className="min-w-0">
                                      <span className="font-extrabold text-[var(--ink)] truncate block text-[10px]">
                                        {person.name}
                                      </span>
                                      <div className="text-[8.5px] text-[var(--muted)] truncate">
                                        {person.role || 'Geral'} • {person.category || 'Geral'}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Select Break Slot (Alternative Selector) */}
                                  <select
                                    value={currentSlot?.id || ''}
                                    onChange={(e) => {
                                      const newSlotId = e.target.value;
                                      moveBreakInterval(
                                        person.id,
                                        currentSlot?.id || null,
                                        newSlotId || null
                                      );
                                    }}
                                    className="bg-[var(--paper)] border border-[var(--line)] rounded px-1 py-0.2 text-[9.5px] font-extrabold text-[var(--ink)] focus:ring-1 focus:ring-[var(--primary)] shrink-0 cursor-pointer"
                                  >
                                    <option value="">Sem Intervalo</option>
                                    {state.breaks.map((b) => (
                                      <option key={b.id} value={b.id}>
                                        {b.time}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-[9px] text-[var(--muted)] italic text-center py-0.5">
                            {isTargetHovered ? 'Solte aqui!' : 'Nenhum neste horário.'}
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
  );
};
