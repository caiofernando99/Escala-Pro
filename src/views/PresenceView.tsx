import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { SearchInput } from '../components/SearchInput';
import {
  CheckCircle2,
  XCircle,
  Palmtree,
  Award,
  BookOpen,
  Sun,
  RotateCcw,
  AlertCircle,
} from 'lucide-react';
import { getCollaboratorStatus, matchesSearch } from '../utils/helpers';

export const PresenceView: React.FC = () => {
  const { state, toggleAttendance, resetAttendance, setAbsenceReason } = useApp();
  const [searchTerm, setSearchTerm] = useState('');

  const activeDate = state.selectedDate;

  // Classify all collaborators for current date
  const classified = state.collaborators.map((col) => {
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

  const dayReport = state.dailyReports[activeDate] || {};

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[var(--paper)] p-4 rounded-xl border border-[var(--line)]">
        <div>
          <h3 className="text-lg font-bold text-[var(--ink)]">Presença de Hoje — {activeDate}</h3>
          <p className="text-xs text-[var(--muted)]">
            Férias, licenças e treinamentos são sinalizados e separados automaticamente das faltas não justificadas.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Pesquisar presente ou ausente..."
            className="w-full md:w-72"
          />
          <button
            onClick={resetAttendance}
            className="px-3 py-2 border border-[var(--line)] text-xs font-semibold rounded-lg hover:bg-[var(--bg)] flex items-center gap-1.5 shrink-0 text-[var(--ink)]"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restaurar Escala</span>
          </button>
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
            <span>Licenças</span>
            <Award className="w-4 h-4 text-amber-700 dark:text-amber-300" />
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
        <div className="lg:col-span-2 bg-[var(--paper)] border border-[var(--line)] p-5 rounded-xl space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
            <h4 className="text-sm font-bold text-[var(--ink)] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Colaboradores Presentes ({filteredPresent.length})</span>
            </h4>
            <span className="text-xs text-[var(--muted)]">Desmarque apenas se a pessoa faltou</span>
          </div>

          <div className="divide-y divide-[var(--line)] max-h-[500px] overflow-y-auto">
            {filteredPresent.length > 0 ? (
              filteredPresent.map(({ collaborator }) => (
                <div key={collaborator.id} className="py-2.5 flex items-center justify-between gap-3 hover:bg-[var(--bg)] px-2 rounded-lg">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={true}
                      onChange={(e) => toggleAttendance(collaborator.id, e.target.checked)}
                      className="w-4 h-4 text-[var(--primary)] rounded accent-[var(--primary)] cursor-pointer"
                    />
                    <div>
                      <div className="text-xs font-bold text-[var(--ink)]">{collaborator.name}</div>
                      <div className="text-[10px] text-[var(--muted)] flex items-center gap-2">
                        <span>{collaborator.role}</span>
                        <span>•</span>
                        <span>{collaborator.category}</span>
                        <span>•</span>
                        <span className="font-semibold">Turma {collaborator.scale}</span>
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold px-2 py-0.5 rounded-full">
                    Confirmado
                  </span>
                </div>
              ))
            ) : (
              <p className="p-8 text-center text-xs text-[var(--muted)]">
                Nenhum colaborador presente para os filtros aplicados.
              </p>
            )}
          </div>
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
                          {absenceDetail?.startDate} até {absenceDetail?.endDate}
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
                          {absenceDetail?.startDate} até {absenceDetail?.endDate}
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
                          className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 hover:underline"
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
        </div>
      </div>
    </div>
  );
};
