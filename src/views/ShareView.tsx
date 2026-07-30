import React, { useState, useRef } from 'react';
import html2canvas from 'html2canvas';
import { useApp } from '../context/AppContext';
import { SearchInput } from '../components/SearchInput';
import { ConnectSpreadsheetModal } from '../components/ConnectSpreadsheetModal';
import {
  Printer,
  Copy,
  History,
  Download,
  Check,
  Clock,
  Sparkles,
  ExternalLink,
  FileSpreadsheet,
  RefreshCw,
  Settings,
  CheckCircle2,
  ShieldCheck,
  Filter,
  SlidersHorizontal,
  Layers,
} from 'lucide-react';
import {
  matchesSearch,
  isScaleOff,
  formatDateBR,
  formatDateLongBR,
  abbreviateName,
} from '../utils/helpers';

interface ShareViewProps {
  onNavigate?: (view: string) => void;
}

export interface ImageThemeConfig {
  id: string;
  name: string;
  bg: string;
  cardBg: string;
  itemBg: string;
  text: string;
  mutedText: string;
  border: string;
  accent: string;
  accentBg: string;
  badgeBg: string;
  badgeText: string;
  headerBg: string;
  breakBg: string;
  breakBorder: string;
  breakText: string;
}

const IMAGE_THEMES: Record<string, ImageThemeConfig> = {
  app: {
    id: 'app',
    name: 'Tema da Aplicação',
    bg: '#0f172a',
    cardBg: '#1e293b',
    itemBg: '#334155',
    text: '#f8fafc',
    mutedText: '#94a3b8',
    border: '#475569',
    accent: '#38bdf8',
    accentBg: 'rgba(56, 189, 248, 0.15)',
    badgeBg: 'rgba(56, 189, 248, 0.2)',
    badgeText: '#38bdf8',
    headerBg: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
    breakBg: 'rgba(56, 189, 248, 0.12)',
    breakBorder: 'rgba(56, 189, 248, 0.3)',
    breakText: '#38bdf8',
  },
  dark: {
    id: 'dark',
    name: 'Dark Operacional',
    bg: '#090d16',
    cardBg: '#131b2e',
    itemBg: '#1c2842',
    text: '#f1f5f9',
    mutedText: '#94a3b8',
    border: '#2a3a5c',
    accent: '#818cf8',
    accentBg: 'rgba(129, 140, 248, 0.15)',
    badgeBg: 'rgba(129, 140, 248, 0.2)',
    badgeText: '#a5b4fc',
    headerBg: 'linear-gradient(135deg, #131b2e 0%, #090d16 100%)',
    breakBg: 'rgba(129, 140, 248, 0.12)',
    breakBorder: 'rgba(129, 140, 248, 0.3)',
    breakText: '#a5b4fc',
  },
  emerald: {
    id: 'emerald',
    name: 'Verde Esmeralda',
    bg: '#022c22',
    cardBg: '#064e3b',
    itemBg: '#065f46',
    text: '#ecfdf5',
    mutedText: '#6ee7b7',
    border: '#047857',
    accent: '#34d399',
    accentBg: 'rgba(52, 211, 153, 0.15)',
    badgeBg: 'rgba(52, 211, 153, 0.2)',
    badgeText: '#6ee7b7',
    headerBg: 'linear-gradient(135deg, #064e3b 0%, #022c22 100%)',
    breakBg: 'rgba(52, 211, 153, 0.15)',
    breakBorder: 'rgba(52, 211, 153, 0.35)',
    breakText: '#34d399',
  },
  indigo: {
    id: 'indigo',
    name: 'Roxo & Índigo',
    bg: '#1e1b4b',
    cardBg: '#312e81',
    itemBg: '#3730a3',
    text: '#f5f3ff',
    mutedText: '#c084fc',
    border: '#4338ca',
    accent: '#a855f7',
    accentBg: 'rgba(168, 85, 247, 0.18)',
    badgeBg: 'rgba(168, 85, 247, 0.25)',
    badgeText: '#e9d5ff',
    headerBg: 'linear-gradient(135deg, #312e81 0%, #1e1b4b 100%)',
    breakBg: 'rgba(168, 85, 247, 0.15)',
    breakBorder: 'rgba(168, 85, 247, 0.35)',
    breakText: '#c084fc',
  },
  light: {
    id: 'light',
    name: 'Claro Minimalista',
    bg: '#f8fafc',
    cardBg: '#ffffff',
    itemBg: '#f1f5f9',
    text: '#0f172a',
    mutedText: '#64748b',
    border: '#cbd5e1',
    accent: '#2563eb',
    accentBg: 'rgba(37, 99, 235, 0.08)',
    badgeBg: '#e0e7ff',
    badgeText: '#1d4ed8',
    headerBg: 'linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%)',
    breakBg: '#eff6ff',
    breakBorder: '#bfdbfe',
    breakText: '#1d4ed8',
  },
};

export const ShareView: React.FC<ShareViewProps> = () => {
  const {
    state,
    saveHistory,
    showNotice,
    syncToOnlineSpreadsheet,
    exportLocalSpreadsheet,
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [copiedText, setCopiedText] = useState(false);
  const [copiedImage, setCopiedImage] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  // Image & Briefing Export Configuration Controls
  const [includeBreaks, setIncludeBreaks] = useState<boolean>(true);
  const [mealTypeLabel, setMealTypeLabel] = useState<'janta' | 'almoco' | 'refeicao' | 'pausa'>(() => {
    const shift = (state.teamShift || '').toUpperCase();
    if (['T1', 'T4'].includes(shift)) return 'almoco';
    return 'janta';
  });
  const [abbreviateNamesToggle, setAbbreviateNamesToggle] = useState<boolean>(true);
  const [hideEmptyTasks, setHideEmptyTasks] = useState<boolean>(true);

  // Filters (same logic as briefing slide)
  const [categoryFilter, setCategoryFilter] = useState<string>('todos');
  const [roleFilter, setRoleFilter] = useState<string>('todos');
  const [tlFilter, setTlFilter] = useState<string>('todos');
  const [selectedThemeId, setSelectedThemeId] = useState<string>('app');

  const cardImageRef = useRef<HTMLDivElement>(null);

  const activeDate = state.selectedDate;
  const dayIntervals = state.intervals[activeDate] || {};

  // Unique metadata lists for filters
  const availableCategories = Array.from(new Set(state.collaborators.map((c) => c.category || 'Geral'))).filter(Boolean);
  const availableRoles = Array.from(new Set(state.collaborators.map((c) => c.role || 'Operador'))).filter(Boolean);
  const availableTLs = Array.from(new Set(state.collaborators.map((c) => c.teamLeader || state.defaultTeamLeader || 'Sem Time'))).filter(Boolean);

  // Filter present people
  const presentPeople = state.collaborators.filter((c) => {
    const hasAbsence = (c.absences || []).some((a) => activeDate >= a.startDate && activeDate <= a.endDate);
    if (hasAbsence) return false;
    const off = isScaleOff(state.calendar, activeDate, c.scale);
    if (off) return false;
    const manual = state.attendance[activeDate]?.[c.id];
    if (manual === false) return false;

    // Apply filters
    if (categoryFilter !== 'todos' && (c.category || 'Geral') !== categoryFilter) return false;
    if (roleFilter !== 'todos' && (c.role || 'Operador') !== roleFilter) return false;
    if (tlFilter !== 'todos' && (c.teamLeader || state.defaultTeamLeader || 'Sem Time') !== tlFilter) return false;
    if (searchTerm && !matchesSearch(c.name, searchTerm)) return false;

    return true;
  });

  const getBreakTime = (personId: string) => {
    const slot = (state.breaks || []).find((b) => (dayIntervals[b.id] || []).includes(personId));
    return slot ? slot.time : 'Sem Horário Definido';
  };

  // Helper to group task members by break time slot
  const groupTaskMembersByBreakTime = (taskMembers: typeof state.collaborators) => {
    const map = new Map<string, typeof state.collaborators>();

    taskMembers.forEach((person) => {
      const time = getBreakTime(person.id);
      if (!map.has(time)) {
        map.set(time, []);
      }
      map.get(time)!.push(person);
    });

    const result: Array<{ timeLabel: string; members: typeof state.collaborators }> = [];
    map.forEach((members, timeLabel) => {
      result.push({ timeLabel, members });
    });

    result.sort((a, b) => {
      if (a.timeLabel.includes('Sem Horário')) return 1;
      if (b.timeLabel.includes('Sem Horário')) return -1;
      return a.timeLabel.localeCompare(b.timeLabel);
    });

    return result;
  };

  // Compute filtered tasks & assigned members
  const displayedTasks = state.tasks
    .map((task) => {
      const filteredMembers = task.members
        .map((id) => state.collaborators.find((c) => c.id === id))
        .filter((c): c is NonNullable<typeof c> => {
          if (!c) return false;
          const isPresent = presentPeople.some((p) => p.id === c.id);
          return isPresent;
        });

      return {
        ...task,
        filteredMembers,
      };
    })
    .filter((task) => !hideEmptyTasks || task.filteredMembers.length > 0);

  // Active theme config
  const activeTheme = IMAGE_THEMES[selectedThemeId] || IMAGE_THEMES.app;

  // Handle Sync Spreadsheet
  const handleSyncSpreadsheet = async () => {
    setIsSyncing(true);
    await syncToOnlineSpreadsheet();
    setTimeout(() => setIsSyncing(false), 600);
  };

  // Generate Image Download via html2canvas
  const handleDownloadImage = async () => {
    if (!cardImageRef.current) return;
    setIsGeneratingImage(true);
    try {
      showNotice('Gerando imagem de alta resolução...');
      const canvas = await html2canvas(cardImageRef.current, {
        scale: 2.5,
        useCORS: true,
        allowTaint: true,
        backgroundColor: activeTheme.bg,
        logging: false,
        windowWidth: 1280,
      });

      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `Escala_Resumo_${(state.teamName || 'Equipe').replace(/\s+/g, '_')}_${activeDate}.png`;
      link.href = dataUrl;
      link.click();
      showNotice('Imagem baixada com sucesso!');
    } catch (err) {
      console.error(err);
      alert('Erro ao gerar a imagem. Tente novamente.');
    } finally {
      setIsGeneratingImage(false);
    }
  };

  // Copy Image to Clipboard directly
  const handleCopyImageToClipboard = async () => {
    if (!cardImageRef.current) return;
    setIsGeneratingImage(true);
    try {
      showNotice('Renderizando imagem para a área de transferência...');
      const canvas = await html2canvas(cardImageRef.current, {
        scale: 2.5,
        useCORS: true,
        allowTaint: true,
        backgroundColor: activeTheme.bg,
        logging: false,
        windowWidth: 1280,
      });

      canvas.toBlob(async (blob) => {
        if (!blob) {
          alert('Erro ao criar arquivo de imagem.');
          setIsGeneratingImage(false);
          return;
        }
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob }),
          ]);
          setCopiedImage(true);
          showNotice('Imagem copiada para a área de transferência!');
          setTimeout(() => setCopiedImage(false), 2500);
        } catch {
          // Fallback if clipboard item is unsupported
          handleDownloadImage();
        } finally {
          setIsGeneratingImage(false);
        }
      }, 'image/png');
    } catch (err) {
      console.error(err);
      setIsGeneratingImage(false);
    }
  };

  // Generate formatted text for WhatsApp / Slack
  const handleCopyFormattedText = () => {
    const mealTitle =
      mealTypeLabel === 'almoco'
        ? 'Almoço'
        : mealTypeLabel === 'janta'
        ? 'Janta'
        : mealTypeLabel === 'pausa'
        ? 'Pausa'
        : 'Refeição';

    let text = `📋 *BRIEFING OPERACIONAL — ESCALA DO DIA*\n`;
    text += `🏢 Equipe: ${state.teamName.toUpperCase()} | Setor: ${state.sector || 'Geral'}\n`;
    text += `📅 Data: ${formatDateBR(activeDate)} | Turno: ${state.teamShift || 'T2'}\n`;
    if (includeBreaks) {
      text += `🕒 Horários de ${mealTitle} incluídos\n`;
    }
    text += `\n`;

    displayedTasks.forEach((t) => {
      text += `*🔹 ${t.name.toUpperCase()}* (${t.filteredMembers.length})\n`;
      if (t.filteredMembers.length === 0) {
        text += `   _(Sem colaboradores)_\n`;
      } else if (includeBreaks) {
        const timeGroups = groupTaskMembersByBreakTime(t.filteredMembers);
        timeGroups.forEach((g) => {
          text += `   🕒 *${mealTitle}: ${g.timeLabel}*\n`;
          g.members.forEach((m) => {
            const nameStr = abbreviateNamesToggle ? abbreviateName(m.name, true) : m.name;
            text += `     • *${nameStr}* (${m.role || 'Operador'})\n`;
          });
        });
      } else {
        t.filteredMembers.forEach((m) => {
          const nameStr = abbreviateNamesToggle ? abbreviateName(m.name, true) : m.name;
          text += `   • *${nameStr}* (${m.role || 'Operador'})\n`;
        });
      }
      text += `\n`;
    });

    if (includeBreaks) {
      text += `*🕒 TABELA DE INTERVALOS & REFEIÇÃO*\n`;
      (state.breaks || []).forEach((slot) => {
        const idsInSlot = dayIntervals[slot.id] || [];
        const membersInSlot = idsInSlot
          .map((id) => presentPeople.find((c) => c.id === id))
          .filter((c): c is NonNullable<typeof c> => Boolean(c));

        if (membersInSlot.length > 0) {
          const namesStr = membersInSlot
            .map((m) => (abbreviateNamesToggle ? abbreviateName(m.name, true) : m.name))
            .join(', ');
          text += `  • *${slot.time}*: ${namesStr}\n`;
        }
      });
      text += `\n`;
    }

    text += `🛡️ _EPIs Obrigatórios durante o turno. Boa jornada a todos!_\n`;

    navigator.clipboard.writeText(text);
    setCopiedText(true);
    showNotice('Texto formatado copiado com sucesso!');
    setTimeout(() => setCopiedText(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Connect Spreadsheet Modal */}
      <ConnectSpreadsheetModal
        isOpen={showConnectModal}
        onClose={() => setShowConnectModal(false)}
      />

      {/* TOP HEADER & QUICK SYNC ACTION BAR */}
      <div className="no-print bg-[var(--paper)] p-3.5 rounded-2xl border border-[var(--line)] shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-black text-[var(--ink)]">
              Resumo Operacional para Compartilhar
            </h2>
            {state.onlineSpreadsheet && (
              <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800 rounded-md">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Planilha Nuvem Conectada
              </span>
            )}
          </div>
          <p className="text-[11px] text-[var(--muted)] font-medium">
            Gere imagens em alta resolução, copie o texto formatado para o WhatsApp ou imprima a escala.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {state.onlineSpreadsheet ? (
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={handleSyncSpreadsheet}
                disabled={isSyncing}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-black rounded-xl flex items-center gap-1.5 shadow-2xs transition-all border border-emerald-500 disabled:opacity-75 cursor-pointer"
                title={`Sincronizar com ${state.onlineSpreadsheet.name}`}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Sincronizando...' : 'Atualizar Planilha'}</span>
              </button>

              <button
                onClick={exportLocalSpreadsheet}
                className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-1 shadow-2xs transition-all cursor-pointer"
                title="Salvar backup local CSV"
              >
                <Download className="w-3.5 h-3.5" />
                <span>CSV</span>
              </button>

              <a
                href={state.onlineSpreadsheet.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 border border-[var(--line)] text-xs font-bold rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-[var(--ink)] cursor-pointer"
                title="Abrir no Google Sheets"
              >
                <ExternalLink className="w-4 h-4 text-[var(--primary)]" />
              </a>

              <button
                onClick={() => setShowConnectModal(true)}
                className="p-1.5 border border-[var(--line)] text-xs font-bold rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-[var(--muted)] hover:text-[var(--ink)] cursor-pointer"
                title="Configurações da planilha"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => setShowConnectModal(true)}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Conectar Planilha</span>
              </button>

              <button
                onClick={exportLocalSpreadsheet}
                className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-1 shadow-2xs transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>CSV</span>
              </button>
            </div>
          )}

          <button
            onClick={handlePrint}
            className="px-3 py-1.5 border border-[var(--line)] text-xs font-bold rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5 text-[var(--ink)] cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Imprimir / PDF</span>
          </button>

          <button
            onClick={saveHistory}
            className="px-3 py-1.5 bg-[var(--primary)] text-white text-xs font-black rounded-xl hover:bg-[var(--primary-hover)] flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <History className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Salvar Histórico</span>
          </button>
        </div>
      </div>

      {/* MAIN CONFIGURATION & CONTROLS PANEL */}
      <div className="no-print bg-[var(--paper)] border border-[var(--line)] p-4 rounded-2xl shadow-2xs space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--line)] pb-2.5">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-[var(--primary)]" />
            <h3 className="text-xs font-black text-[var(--ink)] uppercase tracking-wider">
              Opções do Gerador de Imagem & Briefing
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleDownloadImage}
              disabled={isGeneratingImage}
              className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs rounded-xl flex items-center gap-1.5 shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isGeneratingImage ? 'Gerando...' : 'Baixar Imagem PNG'}</span>
            </button>

            <button
              onClick={handleCopyImageToClipboard}
              disabled={isGeneratingImage}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer disabled:opacity-50"
              title="Copia a imagem para colar diretamente no WhatsApp Web ou Teams"
            >
              {copiedImage ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedImage ? 'Imagem Copiada!' : 'Copiar Imagem'}</span>
            </button>

            <button
              onClick={handleCopyFormattedText}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-black text-xs rounded-xl flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
            >
              {copiedText ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedText ? 'Texto Copiado!' : 'Copiar Texto WhatsApp'}</span>
            </button>
          </div>
        </div>

        {/* CONTROLS GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* 1. Toggle Include Breaks */}
          <div className="bg-[var(--bg)] border border-[var(--line)] p-3 rounded-xl space-y-2">
            <span className="block font-extrabold text-[var(--ink)] text-[11px] flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[var(--primary)]" />
              <span>Intervalos & Refeições</span>
            </span>

            <label className="flex items-center gap-2 cursor-pointer pt-0.5">
              <input
                type="checkbox"
                checked={includeBreaks}
                onChange={(e) => setIncludeBreaks(e.target.checked)}
                className="w-4 h-4 rounded text-[var(--primary)] focus:ring-0 cursor-pointer"
              />
              <span className="font-bold text-[11px] text-[var(--ink)]">
                Exibir intervalos separados nos cards
              </span>
            </label>

            {includeBreaks && (
              <div className="pt-1 flex items-center gap-1">
                <span className="text-[10px] font-bold text-[var(--muted)]">Rótulo:</span>
                {(['janta', 'almoco', 'pausa', 'refeicao'] as const).map((lbl) => (
                  <button
                    key={lbl}
                    onClick={() => setMealTypeLabel(lbl)}
                    className={`px-2 py-0.5 rounded text-[10px] font-extrabold cursor-pointer transition-all uppercase ${
                      mealTypeLabel === lbl
                        ? 'bg-[var(--primary)] text-white font-black'
                        : 'bg-[var(--paper)] text-[var(--muted)] hover:text-[var(--ink)]'
                    }`}
                  >
                    {lbl}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 2. Display Toggles */}
          <div className="bg-[var(--bg)] border border-[var(--line)] p-3 rounded-xl space-y-2">
            <span className="block font-extrabold text-[var(--ink)] text-[11px] flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[var(--primary)]" />
              <span>Formatos e Densidade</span>
            </span>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={abbreviateNamesToggle}
                onChange={(e) => setAbbreviateNamesToggle(e.target.checked)}
                className="w-4 h-4 rounded text-[var(--primary)] focus:ring-0 cursor-pointer"
              />
              <span className="font-bold text-[11px] text-[var(--ink)]">
                Abreviar nomes (ex: Caio Costa ➔ Caio C.)
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={hideEmptyTasks}
                onChange={(e) => setHideEmptyTasks(e.target.checked)}
                className="w-4 h-4 rounded text-[var(--primary)] focus:ring-0 cursor-pointer"
              />
              <span className="font-bold text-[11px] text-[var(--ink)]">
                Ocultar tarefas sem colaboradores
              </span>
            </label>
          </div>

          {/* 3. Theme Selector */}
          <div className="bg-[var(--bg)] border border-[var(--line)] p-3 rounded-xl space-y-1.5 sm:col-span-2">
            <span className="block font-extrabold text-[var(--ink)] text-[11px] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[var(--primary)]" />
              <span>Tema Visual da Imagem (Combina com a Aplicação)</span>
            </span>

            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              {Object.values(IMAGE_THEMES).map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedThemeId(t.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 border transition-all cursor-pointer ${
                    selectedThemeId === t.id
                      ? 'bg-[var(--primary)] text-white border-[var(--primary-border)] shadow-2xs scale-102'
                      : 'bg-[var(--paper)] text-[var(--ink)] border-[var(--line)] hover:border-[var(--primary-border)]'
                  }`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0 border border-black/20"
                    style={{ backgroundColor: t.accent }}
                  />
                  <span>{t.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* FILTERS BAR */}
        <div className="flex flex-wrap items-center gap-2 bg-[var(--bg)] p-2.5 rounded-xl border border-[var(--line)] text-xs">
          <div className="flex items-center gap-1 text-[var(--muted)] font-bold shrink-0">
            <Filter className="w-3.5 h-3.5 text-[var(--primary)]" />
            <span>Filtros do Resumo:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-[var(--paper)] border border-[var(--line)] text-[var(--ink)] rounded-lg px-2.5 py-1 font-bold text-[11px]"
            >
              <option value="todos">Todas Categorias ({availableCategories.length})</option>
              {availableCategories.map((cat) => (
                <option key={cat} value={cat}>
                  Categoria: {cat}
                </option>
              ))}
            </select>

            {/* Role Filter */}
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-[var(--paper)] border border-[var(--line)] text-[var(--ink)] rounded-lg px-2.5 py-1 font-bold text-[11px]"
            >
              <option value="todos">Todos Cargos ({availableRoles.length})</option>
              {availableRoles.map((role) => (
                <option key={role} value={role}>
                  Cargo: {role}
                </option>
              ))}
            </select>

            {/* TL Filter */}
            <select
              value={tlFilter}
              onChange={(e) => setTlFilter(e.target.value)}
              className="bg-[var(--paper)] border border-[var(--line)] text-[var(--ink)] rounded-lg px-2.5 py-1 font-bold text-[11px]"
            >
              <option value="todos">Todos Líderes (TLs)</option>
              {availableTLs.map((tl) => (
                <option key={tl} value={tl}>
                  Líder: {tl}
                </option>
              ))}
            </select>

            <SearchInput
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Pesquisar colaborador..."
              className="w-40"
            />
          </div>
        </div>
      </div>

      {/* IMAGE PREVIEW & HIGH-RESOLUTION CANVAS STAGE */}
      <div className="bg-slate-950/20 p-3 sm:p-6 rounded-3xl border border-[var(--line)] flex justify-center overflow-x-auto shadow-inner">
        <div
          ref={cardImageRef}
          className="p-6 rounded-2xl shadow-2xl space-y-5 transition-colors duration-200 shrink-0"
          style={{
            backgroundColor: activeTheme.bg,
            color: activeTheme.text,
            border: `1.5px solid ${activeTheme.border}`,
            fontFamily: 'system-ui, -apple-system, sans-serif',
            boxSizing: 'border-box',
            width: '800px',
          }}
        >
          {/* HEADER SECTION */}
          <div
            className="p-4 rounded-xl border space-y-2 text-center"
            style={{
              background: activeTheme.headerBg,
              borderColor: activeTheme.border,
              boxSizing: 'border-box',
            }}
          >
            <div className="flex items-center justify-end text-[10px] font-black uppercase tracking-widest" style={{ color: activeTheme.accent, lineHeight: '1.4' }}>
              <span>{state.sector || 'Operacional'}</span>
            </div>

            <h2 className="text-lg font-black uppercase tracking-wide" style={{ color: activeTheme.text, lineHeight: '1.3' }}>
              {state.teamName || 'ESCALA OPERACIONAL DE TRABALHO'}
            </h2>

            <p className="text-xs font-bold" style={{ color: activeTheme.mutedText, lineHeight: '1.4' }}>
              {formatDateLongBR(activeDate)} • Turno {state.teamShift || 'T2'}
            </p>

            <div className="flex items-center justify-center gap-3 pt-1 text-xs font-black">
              <span
                className="px-2.5 py-0.5 rounded-md border text-[11px]"
                style={{
                  backgroundColor: activeTheme.badgeBg,
                  color: activeTheme.badgeText,
                  borderColor: activeTheme.border,
                  lineHeight: '1.4',
                }}
              >
                {presentPeople.length} Presentes
              </span>

              {includeBreaks && (
                <span
                  className="px-2.5 py-0.5 rounded-md border text-[11px] flex items-center gap-1"
                  style={{
                    backgroundColor: activeTheme.breakBg,
                    color: activeTheme.breakText,
                    borderColor: activeTheme.breakBorder,
                    lineHeight: '1.4',
                  }}
                >
                  <Clock className="w-3 h-3" />
                  <span>Horários de {mealTypeLabel === 'almoco' ? 'Almoço' : mealTypeLabel === 'janta' ? 'Janta' : 'Refeição'}</span>
                </span>
              )}
            </div>
          </div>

          {/* SECTION 1: TASKS ALLOCATION */}
          <div className="space-y-3" style={{ boxSizing: 'border-box' }}>
            <div
              className="text-xs font-black uppercase tracking-wider pb-1.5 border-b flex items-center justify-between"
              style={{
                color: activeTheme.accent,
                borderColor: activeTheme.border,
                lineHeight: '1.4',
              }}
            >
              <span>1. Dimensionamento de Tarefas</span>
              <span className="text-[10px]" style={{ color: activeTheme.mutedText }}>
                {displayedTasks.length} {displayedTasks.length === 1 ? 'Tarefa' : 'Tarefas'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {displayedTasks.map((task) => {
                const timeGroups = groupTaskMembersByBreakTime(task.filteredMembers);

                return (
                  <div
                    key={task.id}
                    className="p-3.5 rounded-2xl border space-y-2.5 shadow-sm"
                    style={{
                      backgroundColor: activeTheme.cardBg,
                      borderColor: activeTheme.border,
                      boxSizing: 'border-box',
                    }}
                  >
                    {/* Task Header - Badge displays ONLY the number */}
                    <div
                      className="flex items-center justify-between pb-2 border-b"
                      style={{ borderColor: activeTheme.border }}
                    >
                      <h4
                        className="font-black text-xs uppercase tracking-wide pr-1"
                        style={{ color: activeTheme.text, lineHeight: '1.4' }}
                      >
                        {task.name}
                      </h4>
                      <span
                        className="px-2.5 py-0.5 rounded-full text-xs font-black shrink-0"
                        style={{
                          backgroundColor: activeTheme.badgeBg,
                          color: activeTheme.badgeText,
                          lineHeight: '1.3',
                        }}
                      >
                        {task.filteredMembers.length}
                      </span>
                    </div>

                    {/* Task Collaborators */}
                    <div className="space-y-2">
                      {task.filteredMembers.length > 0 ? (
                        includeBreaks ? (
                          timeGroups.map((group, idx) => (
                            <div key={idx} className="space-y-1.5">
                              {/* Centered Break Time Divider Badge - Matches Theme Accent */}
                              <div className="flex items-center gap-1.5 my-1.5">
                                <div className="h-px flex-1" style={{ backgroundColor: activeTheme.border }} />
                                <span
                                  className="px-2.5 py-0.5 rounded-full text-[10px] font-black flex items-center gap-1 shrink-0 border"
                                  style={{
                                    backgroundColor: activeTheme.breakBg,
                                    borderColor: activeTheme.breakBorder,
                                    color: activeTheme.breakText,
                                    lineHeight: '1.4',
                                  }}
                                >
                                  <Clock className="w-3 h-3 shrink-0" />
                                  <span>{group.timeLabel} ({group.members.length})</span>
                                </span>
                                <div className="h-px flex-1" style={{ backgroundColor: activeTheme.border }} />
                              </div>

                              {/* Members Grid in Slot */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                {group.members.map((m) => {
                                  const displayName = abbreviateNamesToggle
                                    ? abbreviateName(m.name, true)
                                    : m.name;

                                  return (
                                    <div
                                      key={m.id}
                                      className="p-2 rounded-xl border text-xs"
                                      style={{
                                        backgroundColor: activeTheme.itemBg,
                                        borderColor: activeTheme.border,
                                        boxSizing: 'border-box',
                                      }}
                                    >
                                      <div className="min-w-0">
                                        <span
                                          className="font-extrabold block text-xs"
                                          style={{ color: activeTheme.text, lineHeight: '1.4' }}
                                        >
                                          {displayName}
                                        </span>
                                        <span
                                          className="text-[10px] block font-medium"
                                          style={{ color: activeTheme.mutedText, lineHeight: '1.3' }}
                                        >
                                          {m.role || 'Operador'}
                                        </span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                            {task.filteredMembers.map((m) => {
                              const displayName = abbreviateNamesToggle
                                ? abbreviateName(m.name, true)
                                : m.name;

                              return (
                                <div
                                  key={m.id}
                                  className="p-2 rounded-xl border text-xs"
                                  style={{
                                    backgroundColor: activeTheme.itemBg,
                                    borderColor: activeTheme.border,
                                    boxSizing: 'border-box',
                                  }}
                                >
                                  <div className="min-w-0">
                                    <span
                                      className="font-extrabold block text-xs"
                                      style={{ color: activeTheme.text, lineHeight: '1.4' }}
                                    >
                                      {displayName}
                                    </span>
                                    <span
                                      className="text-[10px] block font-medium"
                                      style={{ color: activeTheme.mutedText, lineHeight: '1.3' }}
                                    >
                                      {m.role || 'Operador'}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )
                      ) : (
                        <p className="text-[10px] italic p-1 text-center" style={{ color: activeTheme.mutedText }}>
                          Nenhum colaborador atribuído.
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECTION 2: BREAKS SUMMARY TABLE - Clean text rendering to eliminate baseline clipping */}
          {includeBreaks && (
            <div className="space-y-3 pt-2" style={{ boxSizing: 'border-box' }}>
              <div
                className="text-xs font-black uppercase tracking-wider pb-1.5 border-b flex items-center justify-between"
                style={{
                  color: activeTheme.breakText,
                  borderColor: activeTheme.border,
                  lineHeight: '1.4',
                }}
              >
                <span>2. Escala Geral de Horários de {mealTypeLabel === 'almoco' ? 'Almoço' : mealTypeLabel === 'janta' ? 'Janta' : 'Refeição'}</span>
                <span className="text-[10px]" style={{ color: activeTheme.mutedText }}>
                  Turno {state.teamShift || 'Geral'}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {(state.breaks || []).map((slot) => {
                  const idsInSlot = dayIntervals[slot.id] || [];
                  const membersInSlot = idsInSlot
                    .map((id) => presentPeople.find((c) => c.id === id))
                    .filter((c): c is NonNullable<typeof c> => Boolean(c));

                  if (membersInSlot.length === 0) return null;

                  return (
                    <div
                      key={slot.id}
                      className="p-3 rounded-xl border space-y-2"
                      style={{
                        backgroundColor: activeTheme.cardBg,
                        borderColor: activeTheme.breakBorder,
                        boxSizing: 'border-box',
                      }}
                    >
                      <div
                        className="flex items-center justify-between text-xs font-black pb-1.5 border-b"
                        style={{
                          color: activeTheme.breakText,
                          borderColor: activeTheme.border,
                          lineHeight: '1.4',
                        }}
                      >
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{slot.time}</span>
                        </span>
                        <span
                          className="px-1.5 py-0.5 rounded text-[10px] font-bold"
                          style={{
                            backgroundColor: activeTheme.breakBg,
                            color: activeTheme.breakText,
                          }}
                        >
                          {membersInSlot.length}p
                        </span>
                      </div>

                      <div className="space-y-1.5 pt-1 pb-1">
                        {membersInSlot.map((m) => {
                          const nameStr = abbreviateNamesToggle
                            ? abbreviateName(m.name, true)
                            : m.name;
                          return (
                            <div
                              key={m.id}
                              className="text-xs font-bold flex items-center gap-1.5"
                              style={{ color: activeTheme.text, lineHeight: '1.5' }}
                            >
                              <span style={{ color: activeTheme.accent }}>•</span>
                              <span>{nameStr}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* FOOTER & SECURITY GUIDELINE */}
          <div
            className="pt-3 border-t space-y-1 text-center text-[10px]"
            style={{ borderColor: activeTheme.border, boxSizing: 'border-box' }}
          >
            <div
              className="p-2 rounded-xl font-bold flex items-center justify-center gap-1.5"
              style={{
                backgroundColor: activeTheme.accentBg,
                color: activeTheme.accent,
                border: `1px solid ${activeTheme.border}`,
                lineHeight: '1.4',
              }}
            >
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              <span>Obrigatório o uso de EPIs completos. Mantenha a qualidade e segurança na operação.</span>
            </div>

            <div className="pt-1 text-[9px] font-semibold opacity-70" style={{ color: activeTheme.mutedText, lineHeight: '1.4' }}>
              Transmissão via EscalaPro • {formatDateBR(activeDate)}
            </div>
          </div>
        </div>
      </div>

      {/* SAVED HISTORY LIST */}
      <div className="no-print bg-[var(--paper)] border border-[var(--line)] p-5 rounded-2xl space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--ink)] flex items-center gap-2">
          <History className="w-4 h-4 text-[var(--primary)]" />
          <span>Histórico de Resumos Salvos ({state.history.length})</span>
        </h4>

        {state.history.length > 0 ? (
          <ul className="divide-y divide-[var(--line)] text-xs">
            {state.history
              .slice()
              .reverse()
              .map((h) => (
                <li key={h.id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-[var(--ink)]">{h.date}</span>
                    <span className="text-[var(--muted)] ml-2">
                      ({h.peoplePresent} presentes, {h.peopleVacation} férias,{' '}
                      {h.peopleLeave + h.peopleTraining} licença/trein.)
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
