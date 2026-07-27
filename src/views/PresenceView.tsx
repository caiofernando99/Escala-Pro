import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { SearchInput } from '../components/SearchInput';
import { MultiSelectFilter } from '../components/MultiSelectFilter';
import {
  CheckCircle2,
  XCircle,
  Palmtree,
  Stethoscope,
  BookOpen,
  Sun,
  RotateCcw,
  AlertCircle,
  Users,
  Tag,
  Briefcase,
} from 'lucide-react';
import { getCollaboratorStatus, matchesSearch, formatDateBR } from '../utils/helpers';

export const PresenceView: React.FC = () => {
  const { state, toggleAttendance, resetAttendance, setAbsenceReason } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTLs, setSelectedTLs] = useState<string[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [groupBy, setGroupBy] = useState<'cargo_categoria' | 'cargo' | 'categoria' | 'geral'>('cargo_categoria');

  const activeDate = state.selectedDate;

  // Options for multi-select filters
  const teamLeaders = state.teamLeaders || [];
  const tlOptions = teamLeaders.map((tl) => ({ label: tl, value: tl }));

  const allRoles = Array.from(new Set(state.collaborators.map((c) => c.role).filter(Boolean)));
  const roleOptions = allRoles.map((r) => ({ label: r, value: r }));

  const allCategories = Array.from(new Set(state.collaborators.map((c) => c.category).filter(Boolean)));
  const categoryOptions = allCategories.map((cat) => ({ label: cat, value: cat }));

  // Classify all collaborators for current date
  const classified = state.collaborators
    .filter((col) => {
      const colTL = col.teamLeader || state.defaultTeamLeader || 'Sem Time';
      const matchesTL = selectedTLs.length === 0 || selectedTLs.includes(colTL);
      const matchesRole = selectedRoles.length === 0 || selectedRoles.includes(col.role);
      const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(col.category);
      return matchesTL && matchesRole && matchesCategory;
    })
    .map((col) => {
      const statusInfo = getCollaboratorStatus(col, activeDate, state);
      return {
        collaborator: col,
        ...statusInfo,
      };
    });

  const presentList = classified.filter((c) => c.status === 'presente');
  const vacationList = classified.filter((c) => c.status === 'ferias');
  const leaveList = classified.filter((c) => c.status === 'licenca');
  const trainingList = classified.filter((c) => c.status === 'treinamento');
  const absentList = classified.filter((c) => c.status === 'ausente');
  const scaleOffList = classified.filter((c) => c.status === 'folga');

  // Filter present list by search term
  const filteredPresent = presentList.filter((c) => matchesSearch(c.collaborator.name, searchTerm));
  const filteredVacation = vacationList.filter((c) => matchesSearch(c.collaborator.name, searchTerm));
  const filteredLeaveTraining = [...leaveList, ...trainingList].filter((c) =>
    matchesSearch(c.collaborator.name, searchTerm)
  );
  const filteredAbsent = absentList.filter((c) => matchesSearch(c.collaborator.name, searchTerm));

  // Grouping helper for Por Cargo and Por Categoria
  const groupedByRoleCategory = useMemo(() => {
    const map: Record<string, typeof filteredPresent> = {};
    filteredPresent.forEach((item) => {
      const role = item.collaborator.role || 'Sem Cargo';
      const category = item.collaborator.category || 'Sem Categoria';
      const key = `${role} • ${category}`;
      if (!map[key]) map[key] = [];
      map[key].push(item);
    });
    return map;
  }, [filteredPresent]);

  const groupedByRole = useMemo(() => {
    const map: Record<string, typeof filteredPresent> = {};
    filteredPresent.forEach((item) => {
      const key = item.collaborator.role || 'Sem Cargo Definido';
      if (!map[key]) map[key] = [];
      map[key].push(item);
    });
    return map;
  }, [filteredPresent]);

  const groupedByCategory = useMemo(() => {
    const map: Record<string, typeof filteredPresent> = {};
    filteredPresent.forEach((item) => {
      const key = item.collaborator.category || 'Sem Categoria Definida';
      if (!map[key]) map[key] = [];
      map[key].push(item);
    });
    return map;
  }, [filteredPresent]);

  const dayReport = state.dailyReports[activeDate] || {};

  return (
    <div className="space-y-3 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="bg-[var(--paper)] p-3 rounded-xl border border-[var(--line)] shadow-2xs space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--line)] pb-2">
          <div>
            <h3 className="text-sm font-extrabold text-[var(--ink)] leading-tight">Presença de Hoje — {formatDateBR(activeDate)}</h3>
            <p className="text-[11px] text-[var(--muted)]">
              Gerencie a presença da equipe por Cargo, Categoria ou Time Leader em tempo real.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <SearchInput
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Pesquisar colaborador..."
              className="w-full sm:w-52"
            />
            <button
              onClick={resetAttendance}
              className="px-2.5 py-1 border border-[var(--line)] text-xs font-bold rounded-lg hover:bg-[var(--bg)] flex items-center gap-1 shrink-0 text-[var(--ink)] cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restaurar Escala</span>
            </button>
          </div>
        </div>

        {/* Multi-Select Filters Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <MultiSelectFilter
            label="Time / Líder (TL)"
            options={tlOptions}
            selectedValues={selectedTLs}
            onChange={setSelectedTLs}
            allLabel="Todos os Times"
            icon={<Users className="w-3 h-3 text-[var(--primary)]" />}
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

      {/* Overview Status Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-emerald-100 text-emerald-950 dark:bg-emerald-950 dark:text-emerald-100 p-3 rounded-xl border-2 border-emerald-400 dark:border-emerald-600 shadow-2xs">
          <div className="flex items-center justify-between font-extrabold text-xs">
            <span>Presentes</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-700 dark:text-emerald-300" />
          </div>
          <div className="text-2xl font-black mt-1 text-emerald-950 dark:text-emerald-100">{presentList.length}</div>
        </div>

        <div className="bg-purple-100 text-purple-950 dark:bg-purple-950 dark:text-purple-100 p-3 rounded-xl border-2 border-purple-400 dark:border-purple-600 shadow-2xs">
          <div className="flex items-center justify-between font-extrabold text-xs">
            <span>Férias</span>
            <Palmtree className="w-4 h-4 text-purple-700 dark:text-purple-300" />
          </div>
          <div className="text-2xl font-black mt-1 text-purple-950 dark:text-purple-100">{vacationList.length}</div>
        </div>

        <div className="bg-amber-100 text-amber-950 dark:bg-amber-950 dark:text-amber-100 p-3 rounded-xl border-2 border-amber-400 dark:border-amber-600 shadow-2xs">
          <div className="flex items-center justify-between font-extrabold text-xs">
            <span>Licenças Médicas</span>
            <Stethoscope className="w-4 h-4 text-amber-700 dark:text-amber-300" />
          </div>
          <div className="text-2xl font-black mt-1 text-amber-950 dark:text-amber-100">{leaveList.length}</div>
        </div>

        <div className="bg-blue-100 text-blue-950 dark:bg-blue-950 dark:text-blue-100 p-3 rounded-xl border-2 border-blue-400 dark:border-blue-600 shadow-2xs">
          <div className="flex items-center justify-between font-extrabold text-xs">
            <span>Treinamentos</span>
            <BookOpen className="w-4 h-4 text-blue-700 dark:text-blue-300" />
          </div>
          <div className="text-2xl font-black mt-1 text-blue-950 dark:text-blue-100">{trainingList.length}</div>
        </div>

        <div className="bg-red-100 text-red-950 dark:bg-red-950 dark:text-red-100 p-3 rounded-xl border-2 border-red-400 dark:border-red-600 shadow-2xs">
          <div className="flex items-center justify-between font-extrabold text-xs">
            <span>Ausentes (Faltas)</span>
            <XCircle className="w-4 h-4 text-red-700 dark:text-red-300" />
          </div>
          <div className="text-2xl font-black mt-1 text-red-950 dark:text-red-100">{absentList.length}</div>
        </div>

        <div className="bg-slate-200 text-slate-950 dark:bg-slate-800 dark:text-slate-100 p-3 rounded-xl border-2 border-slate-400 dark:border-slate-600 shadow-2xs">
          <div className="flex items-center justify-between font-extrabold text-xs">
            <span>Folga Escala</span>
            <Sun className="w-4 h-4 text-slate-700 dark:text-slate-300" />
          </div>
          <div className="text-2xl font-black mt-1 text-slate-950 dark:text-slate-100">{scaleOffList.length}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Presentes List (2 cols) */}
        <div className="lg:col-span-2 bg-[var(--paper)] border border-[var(--line)] p-5 rounded-2xl space-y-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[var(--line)] pb-3 gap-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <h4 className="text-sm font-extrabold text-[var(--ink)]">
                Colaboradores Presentes ({filteredPresent.length})
              </h4>
            </div>

            {/* Grouping Mode Tabs */}
            <div className="flex items-center bg-[var(--bg)] border border-[var(--line)] p-1 rounded-xl text-xs font-bold gap-1 self-start sm:self-auto overflow-x-auto max-w-full">
              <button
                onClick={() => setGroupBy('cargo_categoria')}
                className={`px-2.5 py-1 rounded-lg transition-colors shrink-0 cursor-pointer ${
                  groupBy === 'cargo_categoria'
                    ? 'bg-[var(--paper)] text-[var(--primary)] shadow-2xs font-extrabold'
                    : 'text-[var(--muted)] hover:text-[var(--ink)]'
                }`}
              >
                Cargo + Categoria
              </button>
              <button
                onClick={() => setGroupBy('cargo')}
                className={`px-2.5 py-1 rounded-lg transition-colors shrink-0 cursor-pointer ${
                  groupBy === 'cargo'
                    ? 'bg-[var(--paper)] text-[var(--primary)] shadow-2xs font-extrabold'
                    : 'text-[var(--muted)] hover:text-[var(--ink)]'
                }`}
              >
                Por Cargo
              </button>
              <button
                onClick={() => setGroupBy('categoria')}
                className={`px-2.5 py-1 rounded-lg transition-colors shrink-0 cursor-pointer ${
                  groupBy === 'categoria'
                    ? 'bg-[var(--paper)] text-[var(--primary)] shadow-2xs font-extrabold'
                    : 'text-[var(--muted)] hover:text-[var(--ink)]'
                }`}
              >
                Por Categoria
              </button>
              <button
                onClick={() => setGroupBy('geral')}
                className={`px-2.5 py-1 rounded-lg transition-colors shrink-0 cursor-pointer ${
                  groupBy === 'geral'
                    ? 'bg-[var(--paper)] text-[var(--primary)] shadow-2xs font-extrabold'
                    : 'text-[var(--muted)] hover:text-[var(--ink)]'
                }`}
              >
                Lista Geral
              </button>
            </div>
          </div>

          {/* RENDER BY SELECTED GROUPING MODE */}
          {groupBy === 'cargo_categoria' && (
            <div className="columns-1 sm:columns-2 lg:columns-3 gap-2.5 space-y-2.5 max-h-[calc(100vh-250px)] overflow-y-auto pr-1">
              {Object.keys(groupedByRoleCategory).length > 0 ? (
                Object.entries(groupedByRoleCategory).map(([groupKey, rawList]) => {
                  const list = rawList as typeof filteredPresent;
                  const [rName, cName] = groupKey.split(' • ');
                  return (
                    <div key={groupKey} className="bg-[var(--bg)] border border-[var(--line)] rounded-xl p-2.5 space-y-2 shadow-2xs hover:border-[var(--primary-border)] transition-all break-inside-avoid inline-block w-full">
                      <div className="flex items-center justify-between border-b border-[var(--line)] pb-1.5">
                        <div className="flex items-center gap-1.5 min-w-0 pr-1">
                          <Users className="w-3.5 h-3.5 text-[var(--primary)] shrink-0" />
                          <h5 className="text-xs font-black text-[var(--ink)] uppercase tracking-wide truncate">
                            {rName} <span className="text-[var(--muted)] font-bold font-mono">/</span> <span className="text-purple-600 dark:text-purple-400 font-extrabold">{cName}</span>
                          </h5>
                        </div>
                        <span className="text-[10px] font-black bg-[var(--primary-soft)] text-[var(--primary)] px-2 py-0.5 rounded-full border border-[var(--primary-border)] shrink-0">
                          {list.length} {list.length === 1 ? 'Presente' : 'Presentes'}
                        </span>
                      </div>

                      {/* Dynamic List with max-h-64 internal scroll for long lists */}
                      <div className="divide-y divide-[var(--line)] max-h-64 overflow-y-auto pr-1">
                        {list.map(({ collaborator, isExtraPresence }) => (
                          <div key={collaborator.id} className="py-1.5 flex items-center justify-between gap-2 px-1">
                            <div className="flex items-center gap-2 min-w-0">
                              <input
                                type="checkbox"
                                checked={true}
                                onChange={(e) => toggleAttendance(collaborator.id, e.target.checked)}
                                className="w-3.5 h-3.5 text-[var(--primary)] rounded accent-[var(--primary)] cursor-pointer shrink-0"
                              />
                              <div className="min-w-0">
                                <div className="text-xs font-bold text-[var(--ink)] truncate flex items-center gap-1.5">
                                  <span className="truncate">{collaborator.name}</span>
                                  {isExtraPresence && (
                                    <span className="text-[8.5px] font-black bg-purple-100 dark:bg-purple-950 text-purple-900 dark:text-purple-200 border border-purple-300 dark:border-purple-800 px-1.5 py-0.2 rounded-md shrink-0">
                                      TROCA
                                    </span>
                                  )}
                                </div>
                                <div className="text-[9.5px] text-[var(--muted)] flex items-center gap-1 truncate">
                                  <span>Turma {collaborator.scale}</span>
                                  {collaborator.teamLeader && (
                                    <>
                                      <span>•</span>
                                      <span className="truncate">TL: {collaborator.teamLeader}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                            <span className="text-[9.5px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold px-2 py-0.2 rounded-full shrink-0">
                              {isExtraPresence ? 'Extra' : 'Presente'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="p-8 text-center text-xs text-[var(--muted)] col-span-full">
                  Nenhum colaborador presente para os filtros selecionados.
                </p>
              )}
            </div>
          )}
          {groupBy === 'geral' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 w-full items-start max-h-[calc(100vh-250px)] overflow-y-auto pr-1">
              {filteredPresent.length > 0 ? (
                filteredPresent.map(({ collaborator, isExtraPresence }) => (
                  <div key={collaborator.id} className="p-2.5 bg-[var(--bg)] border border-[var(--line)] hover:border-[var(--primary-border)] rounded-xl flex items-center justify-between gap-2 shadow-2xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <input
                        type="checkbox"
                        checked={true}
                        onChange={(e) => toggleAttendance(collaborator.id, e.target.checked)}
                        className="w-4 h-4 text-[var(--primary)] rounded accent-[var(--primary)] cursor-pointer shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-black text-[var(--ink)] truncate">{collaborator.name}</div>
                        <div className="text-[10px] text-[var(--muted)] flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-[var(--primary)]">{collaborator.role}</span>
                          <span>•</span>
                          <span className="font-bold text-purple-600 dark:text-purple-400">{collaborator.category}</span>
                          <span>•</span>
                          <span className="font-semibold">Turma {collaborator.scale}</span>
                        </div>
                      </div>
                    </div>
                    <span className="text-[9.5px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold px-2 py-0.5 rounded-full shrink-0">
                      {isExtraPresence ? 'Extra' : 'Confirmado'}
                    </span>
                  </div>
                ))
              ) : (
                <p className="p-8 text-center text-xs text-[var(--muted)] col-span-full">
                  Nenhum colaborador presente para os filtros aplicados.
                </p>
              )}
            </div>
          )}

          {/* POR CARGO MODE */}
          {groupBy === 'cargo' && (
            <div className="columns-1 sm:columns-2 lg:columns-3 gap-2.5 space-y-2.5 max-h-[calc(100vh-250px)] overflow-y-auto pr-1">
              {Object.keys(groupedByRole).length > 0 ? (
                Object.entries(groupedByRole).map(([roleName, rawList]) => {
                  const list = rawList as typeof filteredPresent;
                  return (
                    <div key={roleName} className="bg-[var(--bg)] border border-[var(--line)] rounded-xl p-2.5 space-y-2 shadow-2xs hover:border-[var(--primary-border)] transition-all break-inside-avoid inline-block w-full">
                      <div className="flex items-center justify-between border-b border-[var(--line)] pb-1.5">
                        <div className="flex items-center gap-1.5 min-w-0 pr-1">
                          <Users className="w-3.5 h-3.5 text-[var(--primary)] shrink-0" />
                          <h5 className="text-xs font-black text-[var(--ink)] uppercase tracking-wider truncate">{roleName}</h5>
                        </div>
                        <span className="text-[10px] font-black bg-[var(--primary-soft)] text-[var(--primary)] px-2 py-0.5 rounded-full border border-[var(--primary-border)] shrink-0">
                          {list.length} {list.length === 1 ? 'Presente' : 'Presentes'}
                        </span>
                      </div>

                      {/* Internal Scroll Container inside card */}
                      <div className="divide-y divide-[var(--line)] max-h-64 overflow-y-auto pr-1">
                        {list.map(({ collaborator, isExtraPresence }) => (
                          <div key={collaborator.id} className="py-1.5 flex items-center justify-between gap-2 px-1">
                            <div className="flex items-center gap-2 min-w-0">
                              <input
                                type="checkbox"
                                checked={true}
                                onChange={(e) => toggleAttendance(collaborator.id, e.target.checked)}
                                className="w-3.5 h-3.5 text-[var(--primary)] rounded accent-[var(--primary)] cursor-pointer shrink-0"
                              />
                              <div className="min-w-0">
                                <div className="text-xs font-bold text-[var(--ink)] truncate">{collaborator.name}</div>
                                <div className="text-[9.5px] text-[var(--muted)] flex items-center gap-1 truncate">
                                  <span className="text-purple-600 dark:text-purple-400 font-semibold">{collaborator.category}</span>
                                  <span>•</span>
                                  <span>Turma {collaborator.scale}</span>
                                </div>
                              </div>
                            </div>
                            <span className="text-[9.5px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold px-2 py-0.2 rounded-full shrink-0">
                              {isExtraPresence ? 'Extra' : 'Presente'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="p-8 text-center text-xs text-[var(--muted)] col-span-full">
                  Nenhum colaborador presente para os filtros selecionados.
                </p>
              )}
            </div>
          )}

          {/* POR CATEGORIA MODE */}
          {groupBy === 'categoria' && (
            <div className="columns-1 sm:columns-2 lg:columns-3 gap-2.5 space-y-2.5 max-h-[calc(100vh-250px)] overflow-y-auto pr-1">
              {Object.keys(groupedByCategory).length > 0 ? (
                Object.entries(groupedByCategory).map(([categoryName, rawList]) => {
                  const list = rawList as typeof filteredPresent;
                  return (
                    <div key={categoryName} className="bg-[var(--bg)] border border-[var(--line)] rounded-xl p-2.5 space-y-2 shadow-2xs hover:border-[var(--primary-border)] transition-all break-inside-avoid inline-block w-full">
                      <div className="flex items-center justify-between border-b border-[var(--line)] pb-1.5">
                        <div className="flex items-center gap-1.5 min-w-0 pr-1">
                          <Tag className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                          <h5 className="text-xs font-black text-[var(--ink)] uppercase tracking-wider truncate">{categoryName}</h5>
                        </div>
                        <span className="text-[10px] font-black bg-purple-100 text-purple-900 dark:bg-purple-950 dark:text-purple-200 px-2 py-0.5 rounded-full border border-purple-300 shrink-0">
                          {list.length} {list.length === 1 ? 'Presente' : 'Presentes'}
                        </span>
                      </div>

                      {/* Internal Scroll Container inside card */}
                      <div className="divide-y divide-[var(--line)] max-h-64 overflow-y-auto pr-1">
                        {list.map(({ collaborator, isExtraPresence }) => (
                          <div key={collaborator.id} className="py-1.5 flex items-center justify-between gap-2 px-1">
                            <div className="flex items-center gap-2 min-w-0">
                              <input
                                type="checkbox"
                                checked={true}
                                onChange={(e) => toggleAttendance(collaborator.id, e.target.checked)}
                                className="w-3.5 h-3.5 text-[var(--primary)] rounded accent-[var(--primary)] cursor-pointer shrink-0"
                              />
                              <div className="min-w-0">
                                <div className="text-xs font-bold text-[var(--ink)] truncate">{collaborator.name}</div>
                                <div className="text-[9.5px] text-[var(--muted)] flex items-center gap-1 truncate">
                                  <span className="text-blue-600 dark:text-blue-400 font-semibold">{collaborator.role}</span>
                                  <span>•</span>
                                  <span>Turma {collaborator.scale}</span>
                                </div>
                              </div>
                            </div>
                            <span className="text-[9.5px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold px-2 py-0.2 rounded-full shrink-0">
                              {isExtraPresence ? 'Extra' : 'Presente'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="p-8 text-center text-xs text-[var(--muted)] col-span-full">
                  Nenhum colaborador presente para os filtros selecionados.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Right Side: Programmed Absences & Faltas */}
        <div className="space-y-6">
          {/* Scheduled Vacations / Leaves / Trainings Card */}
          <div className="bg-[var(--paper)] border border-[var(--line)] p-5 rounded-xl space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--ink)] flex items-center gap-2">
              <Palmtree className="w-4 h-4 text-purple-600" />
              <span>Afastamentos Programados Hoje</span>
            </h4>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {filteredVacation.length > 0 || filteredLeaveTraining.length > 0 ? (
                <>
                  {filteredVacation.map(({ collaborator, absenceDetail }) => (
                    <div
                      key={collaborator.id}
                      className="p-2.5 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 rounded-lg text-xs"
                    >
                      <div className="font-bold text-purple-950 dark:text-purple-200">{collaborator.name}</div>
                      <div className="flex items-center justify-between text-[10px] text-purple-800 dark:text-purple-300 mt-1">
                        <span className="font-semibold uppercase tracking-wider">Férias</span>
                        <span>
                          {formatDateBR(absenceDetail?.startDate)} até {formatDateBR(absenceDetail?.endDate)}
                        </span>
                      </div>
                    </div>
                  ))}

                  {filteredLeaveTraining.map(({ collaborator, absenceDetail, status }) => (
                    <div
                      key={collaborator.id}
                      className={`p-2.5 rounded-lg border text-xs ${
                        status === 'licenca'
                          ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200'
                          : 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200'
                      }`}
                    >
                      <div className="font-bold">{collaborator.name}</div>
                      <div className="flex items-center justify-between text-[10px] mt-1 opacity-90">
                        <span className="font-semibold uppercase tracking-wider">{status}</span>
                        <span>
                          {formatDateBR(absenceDetail?.startDate)} até {formatDateBR(absenceDetail?.endDate)}
                        </span>
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                <p className="text-xs text-[var(--muted)] italic p-2">Nenhum colaborador em férias ou licença hoje.</p>
              )}
            </div>
          </div>

          {/* Faltas / Ausentes Card */}
          <div className="bg-[var(--paper)] border border-[var(--line)] p-5 rounded-xl space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-red-600 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>Faltas Não Justificadas ({filteredAbsent.length})</span>
            </h4>

            <div className="space-y-3 max-h-72 overflow-y-auto">
              {filteredAbsent.length > 0 ? (
                filteredAbsent.map(({ collaborator }) => {
                  const currentReason = dayReport.absenceReasons?.[collaborator.id] || '';
                  return (
                    <div key={collaborator.id} className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-lg space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-red-950 dark:text-red-200">{collaborator.name}</span>
                        <button
                          onClick={() => toggleAttendance(collaborator.id, true)}
                          className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
                        >
                          Marcar Presente
                        </button>
                      </div>
                      <input
                        type="text"
                        value={currentReason}
                        onChange={(e) => setAbsenceReason(collaborator.id, e.target.value)}
                        placeholder="Motivo da ausência (ex: atestado médico)..."
                        className="w-full p-1.5 bg-[var(--paper)] border border-[var(--line)] rounded text-xs text-[var(--ink)]"
                      />
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-[var(--muted)] italic p-2">Nenhuma falta não justificada registrada.</p>
              )}
            </div>
          </div>

          {/* Folga Escala & Troca de Folga / Presença Extra */}
          <div className="bg-[var(--paper)] border border-[var(--line)] p-5 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black uppercase tracking-wider text-[var(--ink)] flex items-center gap-2">
                <Sun className="w-4 h-4 text-amber-500" />
                <span>Folga de Escala ({scaleOffList.length})</span>
              </h4>
              <span className="text-[10px] font-extrabold text-purple-600 dark:text-purple-400">
                Troca de Folga
              </span>
            </div>
            <p className="text-[11px] text-[var(--muted)] leading-normal">
              Colaboradores de folga hoje. Se algum trabalhou em dia de folga (troca/extra), clique em <strong>Adicionar Presença Extra</strong>.
            </p>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {scaleOffList.length > 0 ? (
                scaleOffList.map(({ collaborator }) => (
                  <div
                    key={collaborator.id}
                    className="p-2.5 bg-[var(--bg)] border border-[var(--line)] hover:border-purple-300 rounded-xl flex items-center justify-between text-xs transition-colors gap-2"
                  >
                    <div className="min-w-0">
                      <div className="font-extrabold text-[var(--ink)] truncate">{collaborator.name}</div>
                      <div className="text-[10px] text-[var(--muted)] font-medium truncate">
                        Turma {collaborator.scale} • {collaborator.role}
                      </div>
                    </div>

                    <button
                      onClick={() => toggleAttendance(collaborator.id, true)}
                      className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white text-[10px] font-black rounded-lg shadow-2xs transition-colors cursor-pointer shrink-0"
                    >
                      + Presença Extra
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-xs text-[var(--muted)] italic p-2">Nenhum colaborador de folga programada hoje.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
