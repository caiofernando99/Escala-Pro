import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { SearchInput } from '../components/SearchInput';
import { Clock, RefreshCw, Users, CheckCircle2, ChevronRight, Filter, SlidersHorizontal, Sparkles } from 'lucide-react';
import { matchesSearch, isScaleOff } from '../utils/helpers';

export const BreaksView: React.FC = () => {
  const { state, moveBreakInterval, generateBreaks, showNotice } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('ALL');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('ALL');

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
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[var(--paper)] p-5 rounded-2xl border border-[var(--line)] shadow-2xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[var(--primary)] uppercase tracking-wider mb-1">
            <Clock className="w-4 h-4" />
            <span>Configuração Prioritária de Refeições</span>
          </div>
          <h3 className="text-xl font-extrabold text-[var(--ink)]">Gestão de Intervalos de Refeição</h3>
          <p className="text-xs text-[var(--muted)] font-medium">
            Configure os horários de saída para refeição antes de listar a equipe. Os horários são exibidos em linhas ordenadas.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => {
              generateBreaks();
              showNotice('Intervalos gerados e rebalanceados com sucesso!');
            }}
            className="px-5 py-2.5 bg-[var(--primary)] text-white text-xs font-extrabold rounded-xl hover:bg-[var(--primary-hover)] flex items-center gap-2 shadow-sm transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Gerar / Rebalancear Todos</span>
          </button>
        </div>
      </div>

      {/* TOP CONFIGURATION: HORÁRIOS DE INTERVALO DISPONÍVEIS & FILTROS DA EQUIPE */}
      <div className="bg-[var(--paper)] border-2 border-[var(--primary-border)] p-5 rounded-2xl space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--line)] pb-3">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-[var(--primary)]" />
            <h4 className="text-sm font-extrabold text-[var(--ink)]">Horários de Intervalo Cadastrados no Turno</h4>
          </div>
          <span className="text-xs font-bold text-[var(--muted)]">
            Total de colaboradores ativos hoje: <strong className="text-[var(--ink)]">{presentPeople.length} pessoas</strong>
          </span>
        </div>

        {/* Break Slot Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {state.breaks.map((b) => {
            const assignedList = dayIntervals[b.id] || [];
            const count = assignedList.length;
            const isOverCap = count > b.capacity;
            const percentage = Math.min(Math.round((count / (b.capacity || 1)) * 100), 100);

            return (
              <div
                key={b.id}
                className={`p-3.5 rounded-xl border-2 text-xs flex flex-col justify-between transition-all ${
                  isOverCap
                    ? 'bg-red-50 text-red-950 border-red-400 dark:bg-red-950 dark:text-red-100'
                    : 'bg-[var(--bg)] text-[var(--ink)] border-[var(--line)] hover:border-[var(--primary-border)]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between font-extrabold mb-1">
                    <span className="text-sm">{b.time}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] ${
                        isOverCap
                          ? 'bg-red-200 text-red-900 font-black'
                          : 'bg-[var(--paper)] text-[var(--primary)] border border-[var(--line)]'
                      }`}
                    >
                      Cap. {b.capacity}
                    </span>
                  </div>
                  <div className="text-xl font-black my-1">
                    {count} <span className="text-xs font-semibold opacity-75">alocados</span>
                  </div>
                </div>

                {/* Mini progress bar */}
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden mt-2">
                  <div
                    className={`h-full ${isOverCap ? 'bg-red-600' : 'bg-[var(--primary)]'}`}
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>

        {/* QUICK FILTERS FOR LARGE TEAMS */}
        <div className="pt-3 border-t border-[var(--line)] flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 text-[var(--muted)] font-bold shrink-0">
            <Filter className="w-3.5 h-3.5 text-[var(--primary)]" />
            <span>Filtrar Equipe Grande:</span>
          </div>

          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Buscar por nome..."
            className="w-48 sm:w-64"
          />

          {/* Role Filter */}
          <select
            value={selectedRoleFilter}
            onChange={(e) => setSelectedRoleFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-[var(--line)] bg-[var(--bg)] text-[var(--ink)] font-semibold text-xs focus:ring-1 focus:ring-[var(--primary)]"
          >
            <option value="ALL">Todos os Cargos ({allRoles.length})</option>
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
            className="px-3 py-1.5 rounded-lg border border-[var(--line)] bg-[var(--bg)] text-[var(--ink)] font-semibold text-xs focus:ring-1 focus:ring-[var(--primary)]"
          >
            <option value="ALL">Todas as Categorias ({allCategories.length})</option>
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
              Limpar Filtros
            </button>
          )}
        </div>
      </div>

      {/* Grid of Tasks with HORIZONTAL LINES SEPARATING TIME SLOTS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
              className="bg-[var(--paper)] border border-[var(--line)] rounded-xl p-5 shadow-xs space-y-4 flex flex-col justify-between"
            >
              <div>
                {/* Task Header */}
                <div className="flex items-center justify-between border-b border-[var(--line)] pb-3 mb-4">
                  <h4 className="font-extrabold text-base text-[var(--ink)] flex items-center gap-2">
                    <span>{task.name}</span>
                  </h4>
                  <span className="text-xs font-bold bg-[var(--primary-soft)] text-[var(--primary)] px-2.5 py-0.5 rounded-full">
                    {taskMembers.length} pessoas
                  </span>
                </div>

                {/* Time Slots Divider & Member Groups */}
                <div className="space-y-4">
                  {timeSlotGroups.map(({ slot, members }, idx) => {
                    const slotLabel = slot ? slot.time : 'Sem Intervalo Definido';

                    return (
                      <div key={slot ? slot.id : 'no-slot'} className="space-y-2">
                        {/* HORIZONTAL DIVIDER LINE WITH TIME SLOT HEADER */}
                        <div className="relative flex items-center my-3">
                          <div className="flex-grow border-t border-[var(--line)]"></div>
                          <span className="shrink-0 px-3 py-0.5 text-[11px] font-extrabold tracking-wider uppercase bg-[var(--bg)] text-[var(--primary)] border border-[var(--line)] rounded-full shadow-2xs flex items-center gap-1.5">
                            <Clock className="w-3 h-3 text-[var(--primary)]" />
                            <span>
                              {slotLabel} ({members.length})
                            </span>
                          </span>
                          <div className="flex-grow border-t border-[var(--line)]"></div>
                        </div>

                        {/* Members inside this time slot */}
                        {members.length > 0 ? (
                          <div className="space-y-1.5 pl-1">
                            {members.map((person) => {
                              const currentSlot = getPersonBreakSlot(person.id);
                              return (
                                <div
                                  key={person.id}
                                  className="p-2 bg-[var(--bg)] border border-[var(--line)] rounded-lg flex items-center justify-between text-xs hover:border-[var(--primary-border)] transition-all"
                                >
                                  <div>
                                    <span className="font-bold text-[var(--ink)]">{person.name}</span>
                                    <div className="text-[10px] text-[var(--muted)]">
                                      {person.role || 'Sem cargo'} • {person.category || 'Sem cat'}
                                    </div>
                                  </div>

                                  {/* Select Break Slot */}
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
                                    className="bg-[var(--paper)] border border-[var(--line)] rounded px-2 py-1 text-xs font-semibold text-[var(--ink)] focus:ring-1 focus:ring-[var(--primary)]"
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
                          <p className="text-[10px] text-[var(--muted)] italic text-center py-1">
                            Nenhuma pessoa neste horário.
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
