import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ShiftGroup } from '../types';
import { Download, Upload, RefreshCw, Calendar as CalendarIcon, Sparkles } from 'lucide-react';
import { SUGGESTED_CALENDAR_2026 } from '../utils/suggestedScale';

const SHIFT_GROUPS: ShiftGroup[] = ['A', 'B', 'C', 'D'];
const SHIFT_COLORS: Record<ShiftGroup, string> = {
  A: 'bg-red-500 text-white',
  B: 'bg-amber-400 text-slate-900',
  C: 'bg-teal-400 text-slate-900',
  D: 'bg-indigo-400 text-white',
};

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export const CalendarView: React.FC = () => {
  const { state, setYear, markDayScale, generate6x2Scale, setDate, showNotice, importFullState } = useApp();
  const [selectedOff, setSelectedOff] = useState<ShiftGroup | ''>('A');

  const [genModalOpen, setGenModalOpen] = useState(false);
  const [genStartDate, setGenStartDate] = useState(`${state.year}-01-01`);
  const [genFirstGroup, setGenFirstGroup] = useState<ShiftGroup>('A');

  const handleDayClick = (dayStr: string) => {
    markDayScale(dayStr, selectedOff);
  };

  const handleGenerate = () => {
    if (!genStartDate) return;
    generate6x2Scale(genStartDate, genFirstGroup);
    setGenModalOpen(false);
  };

  const handleLoadSuggestedScale = () => {
    importFullState({
      calendar: { ...state.calendar, ...SUGGESTED_CALENDAR_2026 },
      year: 2026,
    });
    setYear(2026);
    showNotice('Escala Sugerida de 2026 carregada com sucesso no calendário!');
  };

  const handleExportCalendar = () => {
    const data = {
      type: 'people-scheduler-calendar',
      version: 3,
      year: state.year,
      calendar: state.calendar,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `calendario-escala-${state.year}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showNotice('Calendário exportado.');
  };

  const handleImportCalendar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json && typeof json === 'object') {
          const calendarData = json.calendar || (json.type === 'people-scheduler-calendar' ? json.calendar : null);
          if (calendarData) {
            importFullState({
              calendar: { ...state.calendar, ...calendarData },
              ...(json.year ? { year: json.year } : {}),
            });
            showNotice('Calendário de escala importado com sucesso!');
          } else {
            showNotice('Arquivo JSON não possui dados de calendário válidos.');
          }
        }
      } catch (err) {
        showNotice('Erro ao ler o arquivo JSON de calendário.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const renderMonth = (monthIndex: number) => {
    const firstDay = new Date(state.year, monthIndex, 1).getDay();
    const totalDays = new Date(state.year, monthIndex + 1, 0).getDate();

    const blanks = Array.from({ length: firstDay });
    const days = Array.from({ length: totalDays }, (_, i) => i + 1);

    return (
      <div key={monthIndex} className="bg-[var(--paper)] border border-[var(--line)] rounded-xl p-3 shadow-xs">
        <h4 className="text-sm font-bold text-center text-[var(--ink)] mb-2">{MONTH_NAMES[monthIndex]}</h4>
        <div className="grid grid-cols-7 text-center text-[10px] font-bold text-[var(--muted)] border-b border-[var(--line)] pb-1 mb-1">
          <span>D</span>
          <span>S</span>
          <span>T</span>
          <span>Q</span>
          <span>Q</span>
          <span>S</span>
          <span>S</span>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center">
          {blanks.map((_, idx) => (
            <div key={`blank-${idx}`} className="aspect-square" />
          ))}
          {days.map((dayNum) => {
            const dayStr = `${state.year}-${String(monthIndex + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
            const offGroup = state.calendar[dayStr];
            const isSelectedDay = dayStr === state.selectedDate;

            return (
              <button
                key={dayStr}
                onClick={() => handleDayClick(dayStr)}
                onDoubleClick={() => setDate(dayStr)}
                className={`aspect-square text-[11px] font-semibold rounded flex items-center justify-center transition-all ${
                  offGroup ? SHIFT_COLORS[offGroup] : 'bg-[var(--bg)] hover:bg-[var(--primary-soft)] hover:text-[var(--primary)] text-[var(--ink)]'
                } ${isSelectedDay ? 'ring-2 ring-[var(--ink)] font-black scale-105' : ''}`}
                title={offGroup ? `Folga Turma ${offGroup}` : 'Clique para marcar folga'}
              >
                {dayNum}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[var(--paper)] p-4 rounded-xl border border-[var(--line)]">
        <div>
          <h3 className="text-lg font-bold text-[var(--ink)]">Calendário Anual da Escala 6x2</h3>
          <p className="text-xs text-[var(--muted)]">
            Selecione a turma em folga e clique nos dias para personalizar, ou gere o ciclo automático para o ano todo.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleLoadSuggestedScale}
            className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white text-xs font-extrabold rounded-lg flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            title="Preencher calendário com a sugestão oficial de escala de Julho a Dezembro de 2026"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Aplicar Escala 2026</span>
          </button>
          <label className="px-3 py-1.5 border border-[var(--line)] text-xs font-semibold rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5 text-[var(--ink)] cursor-pointer">
            <Upload className="w-3.5 h-3.5 text-[var(--muted)]" />
            <span>Importar JSON</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportCalendar}
              className="hidden"
            />
          </label>
          <button
            onClick={handleExportCalendar}
            className="px-3 py-1.5 border border-[var(--line)] text-xs font-semibold rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5 text-[var(--ink)]"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar JSON</span>
          </button>
          <button
            onClick={() => setGenModalOpen(true)}
            className="px-3 py-1.5 bg-[var(--primary)] text-white text-xs font-bold rounded-lg hover:bg-[var(--primary-hover)] flex items-center gap-1.5 shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Gerar Ciclo 6x2</span>
          </button>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="bg-[var(--paper)] border border-[var(--line)] p-4 rounded-xl flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-[var(--muted)]">Ano:</label>
          <select
            value={state.year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="bg-[var(--bg)] border border-[var(--line)] rounded-lg px-3 py-1.5 text-sm font-bold text-[var(--ink)]"
          >
            <option value={state.year - 1}>{state.year - 1}</option>
            <option value={state.year}>{state.year}</option>
            <option value={state.year + 1}>{state.year + 1}</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-[var(--muted)]">Turma em Folga Selecionada:</label>
          <div className="flex items-center gap-1">
            {SHIFT_GROUPS.map((grp) => (
              <button
                key={grp}
                onClick={() => setSelectedOff(grp)}
                className={`px-3 py-1 rounded-lg text-xs font-extrabold transition-all ${
                  selectedOff === grp
                    ? `${SHIFT_COLORS[grp]} ring-2 ring-slate-900`
                    : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                Turma {grp}
              </button>
            ))}
            <button
              onClick={() => setSelectedOff('')}
              className={`px-2 py-1 rounded-lg text-xs font-medium border border-[var(--line)] ${
                selectedOff === '' ? 'bg-slate-200 dark:bg-slate-700 font-bold' : ''
              }`}
            >
              Limpar
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="ml-auto flex items-center gap-3 text-xs font-semibold">
          {SHIFT_GROUPS.map((grp) => (
            <div key={grp} className="flex items-center gap-1">
              <span className={`w-3 h-3 rounded ${SHIFT_COLORS[grp]}`}></span>
              <span className="text-[var(--muted)]">Turma {grp}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 12 Months Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {MONTH_NAMES.map((_, idx) => renderMonth(idx))}
      </div>

      {/* Generate 6x2 Modal */}
      {genModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-[var(--paper)] border border-[var(--line)] rounded-xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-[var(--ink)]">Gerar Ciclo Automático 6x2</h3>
            <p className="text-xs text-[var(--muted)]">
              Preenche o calendário do ano {state.year} alternando 6 dias de trabalho por 2 dias de folga para cada turma.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[var(--muted)] mb-1">Data Inicial do Ciclo:</label>
                <input
                  type="date"
                  value={genStartDate}
                  onChange={(e) => setGenStartDate(e.target.value)}
                  className="w-full p-2 bg-[var(--bg)] border border-[var(--line)] rounded-lg text-sm text-[var(--ink)] font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--muted)] mb-1">Turma que inicia em folga:</label>
                <select
                  value={genFirstGroup}
                  onChange={(e) => setGenFirstGroup(e.target.value as ShiftGroup)}
                  className="w-full p-2 bg-[var(--bg)] border border-[var(--line)] rounded-lg text-sm text-[var(--ink)] font-semibold"
                >
                  <option value="A">Turma A</option>
                  <option value="B">Turma B</option>
                  <option value="C">Turma C</option>
                  <option value="D">Turma D</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setGenModalOpen(false)}
                className="px-3 py-1.5 border border-[var(--line)] rounded-lg text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                onClick={handleGenerate}
                className="px-4 py-1.5 bg-[var(--primary)] text-white rounded-lg text-xs font-bold hover:bg-[var(--primary-hover)]"
              >
                Gerar Escala
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
