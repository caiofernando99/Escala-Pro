import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { SearchInput } from '../components/SearchInput';
import { InteractiveEmployeePortal } from '../components/InteractiveEmployeePortal';
import { ConnectSpreadsheetModal } from '../components/ConnectSpreadsheetModal';
import {
  Printer,
  Copy,
  History,
  Download,
  Check,
  Clock,
  Briefcase,
  Users,
  Sparkles,
  Share2,
  ExternalLink,
  Smartphone,
  FileSpreadsheet,
  RefreshCw,
  Settings,
  Database,
  CheckCircle2,
  Presentation,
  Utensils,
  Eye,
  EyeOff,
  X,
  FileImage,
} from 'lucide-react';
import { matchesSearch, isScaleOff, formatDateBR, formatDateLongBR, encodeSharedState } from '../utils/helpers';

interface ShareViewProps {
  onNavigate?: (view: string) => void;
}

export const ShareView: React.FC<ShareViewProps> = ({ onNavigate }) => {
  const {
    state,
    saveHistory,
    showNotice,
    syncToOnlineSpreadsheet,
    exportLocalSpreadsheet,
  } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [groupBy, setGroupBy] = useState<'task' | 'role'>('task');
  const [showPortal, setShowPortal] = useState(false);
  const [showSlideModal, setShowSlideModal] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Slide Generator options & filters
  const [includeMealsInSlide, setIncludeMealsInSlide] = useState(false);
  const [mealTypeLabel, setMealTypeLabel] = useState<'janta' | 'almoco' | 'refeicao'>(() => {
    const shift = (state.teamShift || '').toUpperCase();
    if (['T1', 'T4'].includes(shift)) return 'almoco';
    return 'janta';
  });
  const [slideCategoryFilter, setSlideCategoryFilter] = useState<string>('todos');
  const [slideRoleFilter, setSlideRoleFilter] = useState<string>('todos');
  const [slideTLFilter, setSlideTLFilter] = useState<string>('todos');
  const [hideEmptyTasksInSlide, setHideEmptyTasksInSlide] = useState<boolean>(true);
  const [slideDensity, setSlideDensity] = useState<'auto' | 'normal' | 'compact' | 'ultra'>('auto');

  const activeDate = state.selectedDate;
  const dayIntervals = state.intervals[activeDate] || {};

  // Unique metadata lists for filters
  const availableCategories = Array.from(new Set(state.collaborators.map((c) => c.category || 'Geral'))).filter(Boolean);
  const availableRoles = Array.from(new Set(state.collaborators.map((c) => c.role || 'Operador'))).filter(Boolean);
  const availableTLs = Array.from(new Set(state.collaborators.map((c) => c.teamLeader || state.defaultTeamLeader || 'Sem Time'))).filter(Boolean);

  // Compute tasks & members filtered specifically for the 16:9 briefing slide
  const slideDisplayedTasks = state.tasks
    .map((task) => {
      const filteredMembers = task.members
        .map((id) => state.collaborators.find((c) => c.id === id))
        .filter((c): c is NonNullable<typeof c> => {
          if (!c) return false;
          if (slideCategoryFilter !== 'todos' && (c.category || 'Geral') !== slideCategoryFilter) return false;
          if (slideRoleFilter !== 'todos' && (c.role || 'Operador') !== slideRoleFilter) return false;
          if (slideTLFilter !== 'todos' && (c.teamLeader || state.defaultTeamLeader || 'Sem Time') !== slideTLFilter) return false;
          return true;
        });

      return {
        ...task,
        filteredMembers,
      };
    })
    .filter((task) => !hideEmptyTasksInSlide || task.filteredMembers.length > 0);

  const handleSyncSpreadsheet = async () => {
    setIsSyncing(true);
    await syncToOnlineSpreadsheet();
    setTimeout(() => setIsSyncing(false), 600);
  };

  // Copy Interactive Share Link
  const handleCopyInteractiveLink = () => {
    const dataHash = encodeSharedState(state as any);
    const publicUrl = `${window.location.origin}${window.location.pathname}?view=employee_portal&date=${activeDate}&data=${dataHash}`;
    navigator.clipboard.writeText(publicUrl);
    setCopiedLink(true);
    showNotice('Link do Portal Interativo com dados do dia copiado com sucesso!');
    setTimeout(() => setCopiedLink(false), 2500);
  };

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

  const getBreakTime = (personId: string) => {
    const slot = state.breaks.find((b) => (dayIntervals[b.id] || []).includes(personId));
    return slot ? slot.time : 'Sem Intervalo';
  };

  // Generate plain text summary for WhatsApp / Slack / Forms
  const handleCopyText = (includeBreaksOverride?: boolean) => {
    const showBreaks = includeBreaksOverride !== undefined ? includeBreaksOverride : includeMealsInSlide;
    const mealTitle = mealTypeLabel === 'almoco' ? 'Almoço' : mealTypeLabel === 'janta' ? 'Janta' : 'Refeição';

    let text = `📋 *BRIEFING OPERACIONAL — DIMENSIONAMENTO DE EQUIPE*\n`;
    text += `🏢 Equipe: ${state.teamName.toUpperCase()} | Setor: ${state.sector || 'Geral'}\n`;
    text += `📅 Data: ${formatDateBR(activeDate)} | Turno: ${state.teamShift || 'T2'}\n`;
    if (showBreaks) {
      text += `🕒 Incluindo horários de ${mealTitle}\n`;
    }
    text += `\n`;

    const tasksToExport = showSlideModal ? slideDisplayedTasks : state.tasks.map(t => ({
      ...t,
      filteredMembers: t.members.map(id => state.collaborators.find(c => c.id === id)).filter(Boolean) as any[]
    }));

    tasksToExport.forEach((t) => {
      text += `*🔹 ${t.name.toUpperCase()}* (${t.filteredMembers.length} colaboradores)\n`;
      const members = t.filteredMembers;

      if (members.length === 0) {
        text += `   _(Sem colaboradores atribuídos)_\n`;
      } else {
        members.forEach((m) => {
          if (!m) return;
          if (showBreaks) {
            const breakTime = getBreakTime(m.id);
            text += `   • *${m.name}* (${m.role || 'Operador'}) ➔ 🕒 ${mealTitle}: *${breakTime}*\n`;
          } else {
            text += `   • *${m.name}* (${m.role || 'Operador'})\n`;
          }
        });
      }
      text += `\n`;
    });

    navigator.clipboard.writeText(text);
    setCopied(true);
    showNotice('Resumo do briefing copiado para a área de transferência!');
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-3 animate-in fade-in duration-200">
      {/* INTERACTIVE EMPLOYEE PORTAL LINK BANNER */}
      <div className="no-print bg-gradient-to-r from-[var(--sidebar-bg)] via-[var(--primary)] to-[var(--sidebar-bg)] text-white p-3 rounded-xl shadow-2xs border border-[var(--primary-border)] flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5 text-white/90 font-black text-[10px] uppercase tracking-wider">
            <Smartphone className="w-3.5 h-3.5 text-white" />
            <span>Compartilhamento da Escala & Briefing</span>
          </div>
          <h3 className="text-sm font-black text-white leading-tight">Portal do Colaborador & Slide de Briefing</h3>
          <p className="text-[11px] text-white/80 font-medium max-w-xl">
            Gere slides para apresentação no briefing diário ou compartilhe o link interativo diretamente com a equipe.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => onNavigate?.('briefing')}
            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-lg flex items-center gap-1.5 shadow-2xs transition-colors border border-amber-400 cursor-pointer"
          >
            <Presentation className="w-3.5 h-3.5 text-slate-950" />
            <span>Ver Slide de Briefing (TV 16:9)</span>
          </button>

          <button
            onClick={handleCopyInteractiveLink}
            className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-black rounded-lg flex items-center gap-1.5 shadow-2xs transition-colors border border-white/30 cursor-pointer"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedLink ? 'Link Copiado!' : 'Copiar Link'}</span>
          </button>

          <button
            onClick={() => setShowPortal(true)}
            className="px-3 py-1.5 bg-white text-[var(--ink)] hover:bg-white/90 text-xs font-black rounded-lg flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5 text-[var(--primary)]" />
            <span>Abrir Portal</span>
          </button>
        </div>
      </div>

      {/* Interactive Portal Modal */}
      {showPortal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md overflow-y-auto flex items-start justify-center p-4 md:p-8 animate-in fade-in duration-200">
          <div className="w-full max-w-6xl">
            <InteractiveEmployeePortal onClose={() => setShowPortal(false)} />
          </div>
        </div>
      )}

      {/* Connect Spreadsheet Modal */}
      <ConnectSpreadsheetModal
        isOpen={showConnectModal}
        onClose={() => setShowConnectModal(false)}
      />

      {/* Top Controls Bar */}
      <div className="no-print flex flex-col md:flex-row md:items-center justify-between gap-2.5 bg-[var(--paper)] p-2.5 rounded-xl border border-[var(--line)] shadow-2xs text-xs">
        <div>
          <div className="flex items-center gap-1.5">
            <h3 className="text-sm font-black text-[var(--ink)]">Escala Unificada de Trabalho e Intervalos</h3>
            {state.onlineSpreadsheet && (
              <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-1.5 py-0.2 bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800 rounded">
                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                Planilha Ativa
              </span>
            )}
          </div>
          <p className="text-[11px] text-[var(--muted)]">
            Visualização integrada para envio aos colaboradores, sincronização e impressão.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => onNavigate?.('briefing')}
            className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black rounded-lg flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
            title="Ver slide de briefing em tela cheia 16:9"
          >
            <Presentation className="w-3.5 h-3.5" />
            <span>Slide Briefing 16:9</span>
          </button>

          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Pesquisar nome..."
            className="w-full sm:w-44"
          />

          {state.onlineSpreadsheet ? (
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={handleSyncSpreadsheet}
                disabled={isSyncing}
                className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-black rounded-lg flex items-center gap-1 shadow-2xs transition-colors border border-emerald-500 disabled:opacity-75 cursor-pointer"
                title={`Sincronizar escala com ${state.onlineSpreadsheet.name}`}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>
                  {isSyncing ? 'Sincronizando...' : `Atualizar Planilha`}
                </span>
              </button>

              <button
                onClick={exportLocalSpreadsheet}
                className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                title="Salvar cópia de backup local (.CSV)"
              >
                <Download className="w-3.5 h-3.5" />
                <span>CSV</span>
              </button>

              <a
                href={state.onlineSpreadsheet.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2 py-1.5 border border-[var(--line)] text-xs font-bold rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1 text-[var(--ink)] cursor-pointer"
                title="Abrir planilha no Google Sheets"
              >
                <ExternalLink className="w-3.5 h-3.5 text-[var(--primary)]" />
              </a>

              <button
                onClick={() => setShowConnectModal(true)}
                className="p-1.5 border border-[var(--line)] text-xs font-bold rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-[var(--muted)] hover:text-[var(--ink)] cursor-pointer"
                title="Configurar planilha conectada"
              >
                <Settings className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => setShowConnectModal(true)}
                className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-lg flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Conectar Planilha</span>
              </button>

              <button
                onClick={exportLocalSpreadsheet}
                className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>CSV</span>
              </button>
            </div>
          )}

          <button
            onClick={handlePrint}
            className="px-2.5 py-1.5 border border-[var(--line)] text-xs font-bold rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1 text-[var(--ink)] cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Imprimir / PDF</span>
          </button>

          <button
            onClick={saveHistory}
            className="px-2.5 py-1.5 bg-[var(--primary)] text-white text-xs font-black rounded-lg hover:bg-[var(--primary-hover)] flex items-center gap-1 shadow-2xs cursor-pointer"
          >
            <History className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Histórico</span>
          </button>
        </div>
      </div>

      {/* Grouping Toggle */}
      <div className="no-print flex items-center gap-2 bg-[var(--paper)] p-2 rounded-xl border border-[var(--line)] text-xs font-bold shadow-2xs">
        <span className="text-[var(--muted)] text-[11px] font-bold">Agrupar por:</span>
        <button
          onClick={() => setGroupBy('task')}
          className={`px-2.5 py-0.5 rounded-lg transition-all ${
            groupBy === 'task'
              ? 'bg-[var(--primary)] text-white font-extrabold'
              : 'bg-[var(--bg)] text-[var(--ink)] border border-[var(--line)]'
          }`}
        >
          Tarefas Operacionais
        </button>
        <button
          onClick={() => setGroupBy('role')}
          className={`px-2.5 py-0.5 rounded-lg transition-all ${
            groupBy === 'role'
              ? 'bg-[var(--primary)] text-white font-extrabold'
              : 'bg-[var(--bg)] text-[var(--ink)] border border-[var(--line)]'
          }`}
        >
          Cargos / Funções
        </button>
      </div>

      {/* Main Unified Printable Share Sheet Container */}
      <div className="share-container bg-[var(--paper)] border border-[var(--line)] p-4 sm:p-5 rounded-2xl shadow-2xs space-y-4">
        {/* Printable Header */}
        <div className="text-center border-b-2 border-[var(--ink)] pb-2 space-y-0.5">
          <h2 className="text-lg font-black text-[var(--ink)] uppercase tracking-wide">
            {state.teamName || 'ESCALA OPERACIONAL'}
          </h2>
          <p className="text-[11px] font-bold text-[var(--muted)] uppercase tracking-wider">
            {state.sector} • Data: {activeDate} • Turno: {state.teamShift || 'Geral'}
          </p>
        </div>

        {/* Group By Tasks */}
        {groupBy === 'task' && (
          <div className="columns-1 sm:columns-2 md:columns-3 xl:columns-4 gap-2.5 space-y-2.5 [&>div]:break-inside-avoid">
            {state.tasks.map((task) => {
              const members = task.members
                .map((id) => state.collaborators.find((c) => c.id === id))
                .filter((c): c is NonNullable<typeof c> => Boolean(c) && matchesSearch(c.name, searchTerm));

              // Sort members by break time
              const sortedMembers = [...members].sort((a, b) => {
                const timeA = getBreakTime(a.id);
                const timeB = getBreakTime(b.id);
                if (timeA === 'Sem Intervalo' && timeB !== 'Sem Intervalo') return 1;
                if (timeA !== 'Sem Intervalo' && timeB === 'Sem Intervalo') return -1;
                return timeA.localeCompare(timeB);
              });

              return (
                <div
                  key={task.id}
                  className="bg-[var(--bg)] border border-[var(--line)] p-2.5 rounded-xl space-y-2 page-break-inside-avoid shadow-2xs inline-block w-full"
                >
                  <div className="flex items-center justify-between border-b border-[var(--line)] pb-1">
                    <h3 className="font-black text-xs text-[var(--ink)] uppercase tracking-wide flex items-center gap-1.5 truncate">
                      <span className="truncate">{task.name}</span>
                    </h3>
                    <span className="text-[10px] font-black bg-[var(--primary-soft)] text-[var(--primary)] px-2 py-0.2 rounded-full shrink-0">
                      {members.length} {members.length === 1 ? 'pessoa' : 'pessoas'}
                    </span>
                  </div>

                  <div className="space-y-1">
                    {sortedMembers.length > 0 ? (
                      sortedMembers.map((col) => {
                        const breakTime = getBreakTime(col.id);
                        return (
                          <div
                            key={col.id}
                            className="p-1.5 bg-[var(--paper)] border border-[var(--line)] rounded-lg flex items-center justify-between text-[11px] hover:border-[var(--primary-border)] transition-colors shadow-2xs"
                          >
                            <div className="min-w-0 pr-1">
                              <div className="font-extrabold text-[var(--ink)] truncate text-[11px]">{col.name}</div>
                              <div className="text-[9px] text-[var(--muted)] truncate">
                                {col.role} • {col.category}
                              </div>
                            </div>

                            <div className="flex items-center gap-1 bg-blue-50 text-blue-900 dark:bg-blue-950 dark:text-blue-200 border border-blue-200 dark:border-blue-800 px-1.5 py-0.5 rounded font-black text-[10px] shrink-0">
                              <Clock className="w-2.5 h-2.5 text-blue-600 dark:text-blue-400" />
                              <span>{breakTime}</span>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-[10px] text-[var(--muted)] italic p-1 text-center">Nenhum colaborador.</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Group By Roles */}
        {groupBy === 'role' && (
          <div className="columns-1 sm:columns-2 md:columns-3 xl:columns-4 gap-2.5 space-y-2.5 [&>div]:break-inside-avoid">
            {state.roles.map((role) => {
              const members = presentPeople.filter(
                (p) => p.role === role && matchesSearch(p.name, searchTerm)
              );

              // Sort members by break time
              const sortedMembers = [...members].sort((a, b) => {
                const timeA = getBreakTime(a.id);
                const timeB = getBreakTime(b.id);
                if (timeA === 'Sem Intervalo' && timeB !== 'Sem Intervalo') return 1;
                if (timeA !== 'Sem Intervalo' && timeB === 'Sem Intervalo') return -1;
                return timeA.localeCompare(timeB);
              });

              return (
                <div
                  key={role}
                  className="bg-[var(--bg)] border border-[var(--line)] p-2.5 rounded-xl space-y-2 page-break-inside-avoid shadow-2xs inline-block w-full"
                >
                  <div className="flex items-center justify-between border-b border-[var(--line)] pb-1">
                    <h3 className="font-black text-xs text-[var(--ink)] uppercase tracking-wide truncate">
                      {role}
                    </h3>
                    <span className="text-[10px] font-black bg-[var(--primary-soft)] text-[var(--primary)] px-2 py-0.2 rounded-full shrink-0">
                      {members.length}
                    </span>
                  </div>

                  <div className="space-y-1">
                    {sortedMembers.length > 0 ? (
                      sortedMembers.map((col) => {
                        const taskName =
                          state.tasks.find((t) => t.members.includes(col.id))?.name || 'Não direcionado';
                        const breakTime = getBreakTime(col.id);

                        return (
                          <div
                            key={col.id}
                            className="p-1.5 bg-[var(--paper)] border border-[var(--line)] rounded-lg flex items-center justify-between text-[11px] shadow-2xs"
                          >
                            <div className="min-w-0 pr-1">
                              <div className="font-extrabold text-[var(--ink)] truncate text-[11px]">{col.name}</div>
                              <div className="text-[9px] text-[var(--muted)] truncate">
                                Tarefa: <strong className="text-[var(--ink)]">{taskName}</strong>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800 px-1.5 py-0.5 rounded font-black text-[10px] shrink-0">
                              <Clock className="w-2.5 h-2.5" />
                              <span>{breakTime}</span>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-[10px] text-[var(--muted)] italic p-1 text-center">
                        Nenhum colaborador neste cargo.
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Saved History List */}
      <div className="no-print bg-[var(--paper)] border border-[var(--line)] p-5 rounded-xl space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--ink)] flex items-center gap-2">
          <History className="w-4 h-4 text-[var(--primary)]" />
          <span>Histórico de Resumos Salvos ({state.history.length})</span>
        </h4>

        {state.history.length > 0 ? (
          <ul className="divide-y divide-[var(--line)] text-xs">
            {state.history.slice().reverse().map((h) => (
              <li key={h.id} className="py-2.5 flex items-center justify-between">
                <div>
                  <span className="font-bold text-[var(--ink)]">{h.date}</span>
                  <span className="text-[var(--muted)] ml-2">
                    ({h.peoplePresent} presentes, {h.peopleVacation} férias, {h.peopleLeave + h.peopleTraining} licença/trein.)
                  </span>
                </div>
                <span className="text-[10px] text-[var(--muted)]">{h.timestamp}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-[var(--muted)] italic">
            Nenhum resumo salvo no histórico local ainda. Clique em "Salvar Histórico" para registrar o dia.
          </p>
        )}
      </div>
    </div>
  );
};
