import React from 'react';
import { useApp } from '../context/AppContext';
import { formatDateLongBR, formatDateBR, isScaleOff } from '../utils/helpers';
import { Calendar as CalendarIcon, CheckCircle2, UserX, Sun, Stethoscope, Palmtree, BookOpen, ShieldCheck, Menu } from 'lucide-react';

interface HeaderProps {
  pageTitle: string;
  onOpenTutorial?: () => void;
  onToggleMobileMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ pageTitle, onOpenTutorial, onToggleMobileMenu }) => {
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
    <header className="no-print border-b border-[var(--line)] bg-[var(--paper)] px-3 py-2 sm:px-4 transition-colors duration-200">
      {/* Sleek Compact Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
        {/* Left info: Title & Team Metadata */}
        <div className="flex items-center gap-2.5">
          {onToggleMobileMenu && (
            <button
              type="button"
              onClick={onToggleMobileMenu}
              className="md:hidden p-1.5 bg-[var(--bg)] border border-[var(--line)] hover:bg-[var(--line)] text-[var(--ink)] rounded-lg flex items-center justify-center shrink-0 cursor-pointer shadow-2xs"
              aria-label="Abrir Menu de Navegação"
              title="Abrir Menu"
            >
              <Menu className="w-4 h-4 text-[var(--ink)]" />
            </button>
          )}

          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base sm:text-lg font-black text-[var(--ink)] tracking-tight truncate">{pageTitle}</h2>

            <div className="hidden sm:flex items-center gap-1.5 text-[10px] font-bold text-[var(--muted)]">
              <span>•</span>
              <span className="font-extrabold text-[var(--ink)]">{state.teamName || 'Equipe'}</span>
              {state.sector && <span>({state.sector})</span>}
              {state.teamShift && (
                <span className="bg-[var(--primary-soft)] text-[var(--primary)] px-1.5 py-0.2 rounded-full text-[9.5px] font-black border border-[var(--primary-border)]">
                  Turno {state.teamShift}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right Info: Compact Date & Tutorial & Summary Metrics Pill */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Compact Metrics Pill Row */}
          <div className="hidden lg:flex items-center gap-1.5 bg-[var(--bg)] border border-[var(--line)] px-2 py-1 rounded-lg text-[10.5px] font-bold">
            <span className="text-emerald-700 dark:text-emerald-400 font-extrabold" title="Presentes">
              P: {presentCount}
            </span>
            <span className="text-[var(--line)]">|</span>
            <span className="text-purple-700 dark:text-purple-400 font-extrabold" title="Férias">
              F: {vacationCount}
            </span>
            <span className="text-[var(--line)]">|</span>
            <span className="text-amber-700 dark:text-amber-400 font-extrabold" title="Licenças">
              L: {leaveCount}
            </span>
            <span className="text-[var(--line)]">|</span>
            <span className="text-red-700 dark:text-red-400 font-extrabold" title="Ausentes">
              A: {absentCount}
            </span>
            <span className="text-[var(--line)]">|</span>
            <span className="text-[var(--muted)]" title="Folga Escala">
              FE: {scaleOffCount}
            </span>
          </div>

          {/* Date Picker */}
          <div className="flex items-center gap-1.5 bg-[var(--bg)] border border-[var(--line)] px-2 py-1 rounded-lg">
            <CalendarIcon className="w-3.5 h-3.5 text-[var(--primary)]" />
            <input
              type="date"
              value={state.selectedDate}
              onChange={(e) => setDate(e.target.value)}
              className="bg-transparent text-xs font-black text-[var(--ink)] focus:outline-none cursor-pointer"
            />
          </div>

          {/* Real-time Spreadsheet Sync Status Pill */}
          {state.onlineSpreadsheet && state.onlineSpreadsheet.webhookUrl && (
            <div
              className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10.5px] font-black border bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border-emerald-300 dark:border-emerald-800 shadow-2xs"
              title={`Sincronizado com "${state.onlineSpreadsheet.name}" • Última atualização: ${state.onlineSpreadsheet.lastSyncedAt || 'Agora'}`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
              <span className="truncate hidden sm:inline">Tempo Real Ativo</span>
            </div>
          )}

          {onOpenTutorial && (
            <button
              onClick={onOpenTutorial}
              className="px-2 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-800 dark:text-emerald-200 border border-emerald-500/30 rounded-lg text-[11px] font-black transition-all flex items-center gap-1 cursor-pointer shadow-2xs"
              title="Abrir Tutorial"
            >
              <BookOpen className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="hidden sm:inline">Guia</span>
            </button>
          )}
        </div>
      </div>

      {/* Notice Banner */}
      {noticeMessage && (
        <div className="mt-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-200 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between gap-2 shadow-2xs">
          <div className="flex items-center gap-2 truncate">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
            <span className="truncate">{noticeMessage}</span>
          </div>
          {noticeActionLabel && onNoticeAction && (
            <button
              onClick={onNoticeAction}
              className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-black transition-colors shrink-0 cursor-pointer"
            >
              {noticeActionLabel}
            </button>
          )}
        </div>
      )}
    </header>
  );
};
