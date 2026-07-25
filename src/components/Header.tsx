import React from 'react';
import { useApp } from '../context/AppContext';
import { formatDateLongBR, formatDateBR, isScaleOff } from '../utils/helpers';
import { Calendar as CalendarIcon, CheckCircle2, UserX, Sun, Stethoscope, Palmtree, BookOpen, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  pageTitle: string;
  onOpenTutorial?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ pageTitle, onOpenTutorial }) => {
  const { state, setDate, noticeMessage, noticeActionLabel, onNoticeAction } = useApp();

  const activeDate = state.selectedDate;

  // Calculate stats for selected date
  const totalCols = state.collaborators.length;

  let presentCount = 0;
  let vacationCount = 0;
  let leaveCount = 0;
  let trainingCount = 0;
  let absentCount = 0;
  let scaleOffCount = 0;

  state.collaborators.forEach((c) => {
    const activeAbsence = (c.absences || []).find((a) => activeDate >= a.startDate && activeDate <= a.endDate);
    if (activeAbsence) {
      if (activeAbsence.type === 'ferias') vacationCount++;
      else if (activeAbsence.type === 'licenca') leaveCount++;
      else if (activeAbsence.type === 'treinamento') trainingCount++;
      return;
    }

    const offScale = isScaleOff(state.calendar, activeDate, c.scale);
    if (offScale) {
      scaleOffCount++;
      return;
    }

    const manual = state.attendance[activeDate]?.[c.id];
    if (manual === false) {
      absentCount++;
    } else {
      presentCount++;
    }
  });

  return (
    <header className="no-print border-b border-[var(--line)] bg-[var(--paper)] px-6 py-4 transition-colors duration-200">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">
            <span className="font-extrabold text-[var(--ink)]">{state.teamName || 'Gestão sem Equipe'}</span>
            {state.sector && (
              <>
                <span>•</span>
                <span>{state.sector}</span>
              </>
            )}
            {state.teamShift && (
              <span className="bg-[var(--primary-soft)] text-[var(--primary)] px-2 py-0.5 rounded-full text-[10px] font-black border border-[var(--primary-border)]">
                Turno {state.teamShift}
              </span>
            )}
            {state.manager && (
              <span className="bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 px-2 py-0.5 rounded-full text-[10px] font-bold border border-slate-300 dark:border-slate-700">
                Gestor: {state.manager}
              </span>
            )}
            {state.defaultTeamLeader && (
              <span className="bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200 px-2 py-0.5 rounded-full text-[10px] font-black border border-emerald-300 dark:border-emerald-800">
                {state.defaultTeamLeader}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-0.5">
            <h2 className="text-2xl font-extrabold text-[var(--ink)] tracking-tight">{pageTitle}</h2>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[var(--primary-soft)] text-[var(--primary)] border border-[var(--primary-border)] rounded-full text-xs font-black">
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              <span>EscalaPro</span>
            </span>
          </div>
        </div>

        {/* Right side date control & tutorial button */}
        <div className="flex flex-wrap items-center gap-3">
          {onOpenTutorial && (
            <button
              onClick={onOpenTutorial}
              className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-800 dark:text-emerald-200 border border-emerald-500/30 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
              title="Abrir Tutorial / Demonstração Interativa"
            >
              <BookOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Ver Tutorial / Guia</span>
            </button>
          )}

          <div className="flex items-center gap-2 bg-[var(--bg)] border border-[var(--line)] px-3 py-1.5 rounded-lg">
            <CalendarIcon className="w-4 h-4 text-[var(--muted)]" />
            <input
              type="date"
              value={state.selectedDate}
              onChange={(e) => setDate(e.target.value)}
              className="bg-transparent text-sm font-bold text-[var(--ink)] focus:outline-none cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Prominent Active Date Highlight Bar */}
      <div className="mt-3 bg-[var(--primary-soft)] border-2 border-[var(--primary-border)] px-4 py-2.5 rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs font-black text-[var(--primary)] shadow-2xs">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 shrink-0" />
          <span>DATA ATIVA:</span>
          <span className="text-sm px-2.5 py-0.5 bg-[var(--paper)] border border-[var(--primary-border)] rounded-md shadow-2xs tracking-wide">
            {formatDateBR(state.selectedDate)}
          </span>
          <span className="text-[11px] font-bold opacity-80 capitalize hidden sm:inline">
            ({formatDateLongBR(state.selectedDate)})
          </span>
        </div>
      </div>

      {/* Daily Metrics Bar - Prominently Signaling Vacations, Leaves, Trainings next to Present */}
      <div className="mt-4 pt-3 border-t border-[var(--line)] flex flex-wrap items-center gap-2.5 text-xs">
        {/* Presentes Pill */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-100 text-emerald-950 dark:bg-emerald-950 dark:text-emerald-100 border-2 border-emerald-400 dark:border-emerald-600 rounded-lg font-bold shadow-2xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-700 dark:text-emerald-300 shrink-0" />
          <span>Presentes: <strong className="text-sm font-extrabold text-emerald-950 dark:text-emerald-100 ml-0.5">{presentCount}</strong></span>
        </div>

        {/* Férias Pill */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-100 text-purple-950 dark:bg-purple-950 dark:text-purple-100 border-2 border-purple-400 dark:border-purple-600 rounded-lg font-bold shadow-2xs">
          <Palmtree className="w-4 h-4 text-purple-700 dark:text-purple-300 shrink-0" />
          <span>Férias: <strong className="text-sm font-extrabold text-purple-950 dark:text-purple-100 ml-0.5">{vacationCount}</strong></span>
        </div>

        {/* Licenças / Afastamentos Médicos Pill */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-100 text-amber-950 dark:bg-amber-950 dark:text-amber-100 border-2 border-amber-400 dark:border-amber-600 rounded-lg font-bold shadow-2xs" title="Licenças e afastamentos médicos prolongados">
          <Stethoscope className="w-4 h-4 text-amber-700 dark:text-amber-300 shrink-0" />
          <span>Licenças: <strong className="text-sm font-extrabold text-amber-950 dark:text-amber-100 ml-0.5">{leaveCount}</strong></span>
        </div>

        {/* Treinamentos Pill */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-950 dark:bg-blue-950 dark:text-blue-100 border-2 border-blue-400 dark:border-blue-600 rounded-lg font-bold shadow-2xs">
          <BookOpen className="w-4 h-4 text-blue-700 dark:text-blue-300 shrink-0" />
          <span>Treinamentos: <strong className="text-sm font-extrabold text-blue-950 dark:text-blue-100 ml-0.5">{trainingCount}</strong></span>
        </div>

        {/* Ausentes Pill */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-100 text-red-950 dark:bg-red-950 dark:text-red-100 border-2 border-red-400 dark:border-red-600 rounded-lg font-bold shadow-2xs">
          <UserX className="w-4 h-4 text-red-700 dark:text-red-300 shrink-0" />
          <span>Ausentes: <strong className="text-sm font-extrabold text-red-950 dark:text-red-100 ml-0.5">{absentCount}</strong></span>
        </div>

        {/* Folga Escala Pill */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[var(--bg)] text-[var(--ink)] border-2 border-[var(--line)] rounded-lg font-bold shadow-2xs">
          <Sun className="w-4 h-4 text-[var(--muted)] shrink-0" />
          <span>Folga Escala: <strong className="text-sm font-extrabold text-[var(--ink)] ml-0.5">{scaleOffCount}</strong></span>
        </div>

        <div className="ml-auto text-[var(--ink)] font-bold text-xs bg-[var(--bg)] border border-[var(--line)] px-3 py-1.5 rounded-lg">
          Total Equipe: <strong className="text-sm text-[var(--primary)] font-extrabold">{totalCols}</strong>
        </div>
      </div>

      {/* Floating Notice Banner with Undo Action */}
      {noticeMessage && (
        <div className="mt-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-200 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold animate-in fade-in slide-in-from-top-1 duration-200 flex flex-wrap items-center justify-between gap-2 shadow-2xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>{noticeMessage}</span>
          </div>
          {noticeActionLabel && onNoticeAction && (
            <button
              onClick={onNoticeAction}
              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-black transition-colors shadow-2xs cursor-pointer flex items-center gap-1 ml-auto"
            >
              <span>{noticeActionLabel}</span>
            </button>
          )}
        </div>
      )}
    </header>
  );
};
