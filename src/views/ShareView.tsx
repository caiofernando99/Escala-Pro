import React, { useState, useRef } from 'react';
import html2canvas from 'html2canvas';
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
  ShieldCheck,
  HelpCircle,
  MessageSquare,
} from 'lucide-react';
import { matchesSearch, isScaleOff, formatDateBR, formatDateLongBR, encodeSharedState, abbreviateName } from '../utils/helpers';

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

  // Mobile High-Res 9x32 Image Export Modal State
  const [showMobileImageModal, setShowMobileImageModal] = useState(false);
  const [isGeneratingMobileImage, setIsGeneratingMobileImage] = useState(false);
  const [mobileAbbreviateNames, setMobileAbbreviateNames] = useState(true);
  const [imageTheme, setImageTheme] = useState<'dark' | 'light' | 'emerald' | 'purple'>('dark');
  const mobileCardRef = useRef<HTMLDivElement>(null);

  const handleDownloadMobileImage = async () => {
    if (!mobileCardRef.current) return;
    setIsGeneratingMobileImage(true);
    try {
      showNotice('Gerando imagem de alta resolução (9x32)...');
      const canvas = await html2canvas(mobileCardRef.current, {
        scale: 2.5, // Ultra-sharp high resolution for mobile displays
        useCORS: true,
        backgroundColor: '#0f172a',
      });
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `Escala_Mobile_9x32_${state.teamName || 'Equipe'}_${activeDate}.png`;
      link.href = dataUrl;
      link.click();
      showNotice('Imagem de alta resolução (9x32) baixada com sucesso!');
    } catch (err) {
      alert('Erro ao gerar imagem de alta resolução.');
    } finally {
      setIsGeneratingMobileImage(false);
    }
  };

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
      {/* SHARE LINK & WHATSAPP BANNER */}
      <div className="no-print bg-gradient-to-r from-[var(--sidebar-bg)] via-[var(--primary)] to-[var(--sidebar-bg)] text-white p-3.5 rounded-xl shadow-2xs border border-[var(--primary-border)] flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5 text-white/90 font-black text-[10px] uppercase tracking-wider">
            <Share2 className="w-3.5 h-3.5 text-white" />
            <span>Compartilhamento da Escala & Transmissão</span>
          </div>
          <h3 className="text-sm font-black text-white leading-tight">Envio Rápido para a Equipe</h3>
          <p className="text-[11px] text-white/80 font-medium max-w-xl">
            Copie o link interativo do dia ou o texto formatado para envio direto via WhatsApp, Slack e e-mail.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => setShowMobileImageModal(true)}
            className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs rounded-lg flex items-center gap-1.5 shadow-md transition-all border border-purple-300/40 cursor-pointer hover:scale-102"
          >
            <FileImage className="w-3.5 h-3.5" />
            <span>Gerar Imagem (9x32)</span>
          </button>

          <button
            onClick={() => handleCopyText()}
            className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs rounded-lg flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copiado para WhatsApp!' : 'Copiar Texto para WhatsApp'}</span>
          </button>

          <button
            onClick={handleCopyInteractiveLink}
            className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-black rounded-lg flex items-center gap-1.5 shadow-2xs transition-colors border border-white/30 cursor-pointer"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedLink ? 'Link Copiado!' : 'Copiar Link do Portal'}</span>
          </button>
        </div>
      </div>

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

      {/* 9x32 HIGH-RES IMAGE GENERATOR MODAL */}
      {showMobileImageModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[var(--paper)] border border-[var(--line)] rounded-3xl p-5 max-w-2xl w-full max-h-[90vh] flex flex-col justify-between space-y-4 shadow-2xl text-[var(--ink)]">
            {/* Modal Header Controls */}
            <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center font-black">
                  <FileImage className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider">
                    Gerador de Imagem 9x32
                  </h3>
                  <p className="text-[11px] text-[var(--muted)] font-medium">
                    Alta resolução no formato 9x32 para compartilhamento e impressão da escala
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowMobileImageModal(false)}
                className="p-1.5 hover:bg-[var(--bg)] rounded-xl text-[var(--muted)] hover:text-[var(--ink)] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Options Bar & Theme Selector */}
            <div className="flex flex-wrap items-center justify-between gap-2 bg-[var(--bg)] p-2.5 rounded-xl border border-[var(--line)] text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setMobileAbbreviateNames(!mobileAbbreviateNames)}
                  className={`px-3 py-1.5 rounded-lg font-black text-xs border cursor-pointer transition-all ${
                    mobileAbbreviateNames
                      ? 'bg-purple-600 text-white border-purple-500 shadow-2xs'
                      : 'bg-[var(--paper)] text-[var(--muted)] border-[var(--line)]'
                  }`}
                >
                  {mobileAbbreviateNames ? 'Nomes Abreviados' : 'Nomes Completos'}
                </button>

                {/* Theme Selector */}
                <div className="flex items-center gap-1 bg-[var(--paper)] p-1 rounded-lg border border-[var(--line)]">
                  <span className="text-[10px] font-bold text-[var(--muted)] px-1">Tema:</span>
                  {[
                    { id: 'dark', label: 'Dark' },
                    { id: 'light', label: 'Light' },
                    { id: 'emerald', label: 'Verde' },
                    { id: 'purple', label: 'Roxo' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setImageTheme(t.id as any)}
                      className={`px-2 py-0.5 rounded text-[10px] font-extrabold cursor-pointer transition-all ${
                        imageTheme === t.id
                          ? 'bg-[var(--primary)] text-[var(--primary-fg)] shadow-2xs'
                          : 'text-[var(--muted)] hover:text-[var(--ink)]'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleDownloadMobileImage}
                disabled={isGeneratingMobileImage}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50 transition-all"
              >
                <Download className="w-4 h-4" />
                <span>{isGeneratingMobileImage ? 'Gerando PNG...' : 'Baixar Imagem 9x32 (PNG)'}</span>
              </button>
            </div>

            {/* Preview Stage (9x32 Card Container for html2canvas capture) */}
            <div className="flex-1 overflow-y-auto pr-1 flex justify-center bg-slate-950/20 p-4 rounded-2xl border border-[var(--line)]">
              <div
                ref={mobileCardRef}
                className={`w-[420px] p-5 rounded-2xl border shadow-2xl space-y-4 font-sans text-xs transition-colors ${
                  imageTheme === 'light'
                    ? 'bg-slate-50 text-slate-900 border-purple-200'
                    : imageTheme === 'emerald'
                    ? 'bg-emerald-950 text-emerald-50 border-emerald-500/30'
                    : imageTheme === 'purple'
                    ? 'bg-purple-950 text-purple-50 border-purple-500/30'
                    : 'bg-slate-900 text-slate-100 border-purple-500/30'
                }`}
                style={{ minHeight: '1200px' }}
              >
                {/* Image Card Header */}
                <div className={`text-center border-b-2 pb-3 space-y-1 p-3 rounded-xl ${
                  imageTheme === 'light'
                    ? 'border-purple-300 bg-purple-50/60'
                    : 'border-purple-500/50 bg-gradient-to-b from-purple-900/30 to-transparent'
                }`}>
                  <div className="text-[10px] font-black uppercase text-purple-400 tracking-widest flex items-center justify-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    <span>Briefing & Escala Operacional</span>
                  </div>
                  <h2 className={`text-base font-black uppercase tracking-wide ${imageTheme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                    {state.teamName || 'EQUIPE OPERACIONAL'}
                  </h2>
                  <p className={`text-[11px] font-bold ${imageTheme === 'light' ? 'text-slate-600' : 'text-slate-300'}`}>
                    {formatDateLongBR(activeDate)} • Turno {state.teamShift || 'T2'}
                  </p>
                  <div className="flex items-center justify-center gap-2 pt-1 text-[10px] font-extrabold">
                    <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/40 rounded-md">
                      {presentPeople.length} Colaboradores
                    </span>
                    <span className="px-2 py-0.5 bg-purple-500/20 text-purple-600 dark:text-purple-300 border border-purple-500/40 rounded-md">
                      {state.sector || 'Operacional'}
                    </span>
                  </div>
                </div>

                {/* Tasks & Allocations Section */}
                <div className="space-y-3">
                  <div className={`text-[11px] font-black uppercase border-b pb-1 flex items-center justify-between ${
                    imageTheme === 'light' ? 'text-slate-500 border-slate-200' : 'text-slate-400 border-slate-800'
                  }`}>
                    <span>1. Dimensionamento de Tarefas</span>
                    <span className="text-[9px] text-purple-400">{state.tasks.length} Tarefas</span>
                  </div>

                  <div className="space-y-2.5">
                    {state.tasks.map((task) => {
                      const members = task.members
                        .map((id) => state.collaborators.find((c) => c.id === id))
                        .filter((c): c is NonNullable<typeof c> => Boolean(c));

                      if (members.length === 0) return null;

                      // Group members by break time for visual dividers
                      const timeGroups = new Map<string, typeof members>();
                      members.forEach((person) => {
                        const breakTime = getBreakTime(person.id) || 'Sem Pausa';
                        if (!timeGroups.has(breakTime)) {
                          timeGroups.set(breakTime, []);
                        }
                        timeGroups.get(breakTime)!.push(person);
                      });

                      return (
                        <div
                          key={task.id}
                          className={`border rounded-xl p-3 space-y-2 ${
                            imageTheme === 'light'
                              ? 'bg-white border-slate-200 shadow-2xs'
                              : 'bg-slate-950/80 border-slate-800'
                          }`}
                        >
                          <div className={`flex items-center justify-between border-b pb-1 ${
                            imageTheme === 'light' ? 'border-slate-200' : 'border-slate-800/80'
                          }`}>
                            <span className={`font-black text-xs uppercase tracking-wide ${imageTheme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                              {task.name}
                            </span>
                            <span className="px-2 py-0.2 bg-purple-500/20 text-purple-600 dark:text-purple-300 border border-purple-500/30 rounded text-[10px] font-black">
                              {members.length}
                            </span>
                          </div>

                          <div className="space-y-2">
                            {Array.from(timeGroups.entries()).map(([timeLabel, groupMembers], gIdx) => (
                              <div key={gIdx} className="space-y-1">
                                <div className="flex items-center justify-between px-2 py-0.5 bg-amber-500/10 border-b border-amber-500/20 rounded text-[10px] font-black text-amber-500">
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-2.5 h-2.5" />
                                    <span>{timeLabel}</span>
                                  </span>
                                  <span>{groupMembers.length}p</span>
                                </div>

                                <div className="grid grid-cols-1 gap-1">
                                  {groupMembers.map((person) => {
                                    const displayName = mobileAbbreviateNames
                                      ? abbreviateName(person.name, true)
                                      : person.name;

                                    return (
                                      <div
                                        key={person.id}
                                        className={`flex items-center justify-between border rounded-lg px-2.5 py-1 text-[11px] ${
                                          imageTheme === 'light'
                                            ? 'bg-slate-50 border-slate-200 text-slate-800'
                                            : 'bg-slate-900 border-slate-800/80 text-slate-200'
                                        }`}
                                      >
                                        <span className="font-bold truncate">
                                          {displayName}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Meal Times Section */}
                <div className="space-y-2 pt-2">
                  <div className={`text-[11px] font-black uppercase border-b pb-1 flex items-center justify-between ${
                    imageTheme === 'light' ? 'text-slate-500 border-slate-200' : 'text-slate-400 border-slate-800'
                  }`}>
                    <span>2. Horários de Refeição & Pausas</span>
                    <span className="text-[9px] text-amber-500">Escala de Turno</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {(state.breaks || []).map((slot) => {
                      const idsInSlot = dayIntervals[slot.id] || [];
                      const membersInSlot = idsInSlot
                        .map((id) => presentPeople.find((c) => c.id === id))
                        .filter((c): c is NonNullable<typeof c> => Boolean(c));

                      if (membersInSlot.length === 0) return null;

                      return (
                        <div
                          key={slot.id}
                          className={`border rounded-xl p-2 space-y-1 ${
                            imageTheme === 'light'
                              ? 'bg-amber-50/50 border-amber-200'
                              : 'bg-slate-950 border-amber-500/20'
                          }`}
                        >
                          <div className="flex items-center justify-between text-[10px] font-black text-amber-500 border-b border-slate-800/20 pb-1">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-amber-500" />
                              <span>{slot.time}</span>
                            </span>
                            <span>{membersInSlot.length}p</span>
                          </div>

                          <div className="space-y-0.5 pt-0.5">
                            {membersInSlot.map((m) => (
                              <div
                                key={m.id}
                                className={`text-[10px] font-bold truncate ${
                                  imageTheme === 'light' ? 'text-slate-700' : 'text-slate-300'
                                }`}
                              >
                                • {mobileAbbreviateNames ? abbreviateName(m.name, true) : m.name}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Security & Leadership Footer Notes */}
                <div className={`pt-2 border-t space-y-1.5 text-[10px] ${
                  imageTheme === 'light' ? 'border-slate-200' : 'border-slate-800'
                }`}>
                  <div className="p-2 bg-emerald-950/30 border border-emerald-500/30 rounded-xl text-emerald-500 font-bold flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                    <span>Uso obrigatório de EPIs completos durante o turno.</span>
                  </div>
                  <div className={`text-center text-[9px] font-medium pt-1 ${
                    imageTheme === 'light' ? 'text-slate-400' : 'text-slate-500'
                  }`}>
                    Gerado via Gestão Operacional & Briefing • {formatDateBR(activeDate)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
