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

export const ShareView: React.FC = () => {
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

  // Slide Generator options
  const [includeMealsInSlide, setIncludeMealsInSlide] = useState(false);
  const [mealTypeLabel, setMealTypeLabel] = useState<'janta' | 'almoco' | 'refeicao'>(() => {
    const shift = (state.teamShift || '').toUpperCase();
    if (['T1', 'T4'].includes(shift)) return 'almoco';
    return 'janta';
  });

  const activeDate = state.selectedDate;
  const dayIntervals = state.intervals[activeDate] || {};

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

    state.tasks.forEach((t) => {
      text += `*🔹 ${t.name.toUpperCase()}* (${t.members.length} colaboradores)\n`;
      const members = t.members
        .map((id) => state.collaborators.find((c) => c.id === id))
        .filter(Boolean);

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
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* INTERACTIVE EMPLOYEE PORTAL LINK BANNER */}
      <div className="no-print bg-gradient-to-r from-[var(--sidebar-bg)] via-[var(--primary)] to-[var(--sidebar-bg)] text-white p-5 rounded-2xl shadow-md border-2 border-[var(--primary-border)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-white/90 font-extrabold text-xs uppercase tracking-wider">
            <Smartphone className="w-4 h-4 text-white" />
            <span>Compartilhamento da Escala & Briefing</span>
          </div>
          <h3 className="text-lg font-black text-white">Portal do Colaborador & Slide de Briefing</h3>
          <p className="text-xs text-white/80 font-medium max-w-xl">
            Gere slides para apresentação no briefing diário e upload no Google Forms, ou compartilhe o link interativo diretamente com a equipe.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={() => setShowSlideModal(true)}
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl flex items-center gap-2 shadow-sm transition-colors border border-amber-400 cursor-pointer"
          >
            <Presentation className="w-4 h-4 text-slate-950" />
            <span>Gerar Slide de Briefing / Forms</span>
          </button>

          <button
            onClick={handleCopyInteractiveLink}
            className="px-4 py-2.5 bg-white/20 hover:bg-white/30 text-white text-xs font-black rounded-xl flex items-center gap-2 shadow-sm transition-colors border border-white/30 cursor-pointer"
          >
            {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copiedLink ? 'Link Copiado!' : 'Copiar Link Interativo'}</span>
          </button>

          <button
            onClick={() => setShowPortal(true)}
            className="px-4 py-2.5 bg-white text-[var(--ink)] hover:bg-white/90 text-xs font-black rounded-xl flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
          >
            <ExternalLink className="w-4 h-4 text-[var(--primary)]" />
            <span>Abrir Portal do Colaborador</span>
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

      {/* BRIEFING SLIDE GENERATOR MODAL */}
      {showSlideModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md overflow-y-auto flex items-center justify-center p-3 md:p-6 animate-in fade-in duration-200 no-print">
          <div className="w-full max-w-5xl bg-slate-900 border-2 border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            {/* Slide Toolbar Header */}
            <div className="bg-slate-800 border-b border-slate-700 p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 text-white">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/20 text-amber-400 border border-amber-500/40 rounded-xl">
                  <Presentation className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">Gerador de Slide de Briefing Operacional</h3>
                  <p className="text-[11px] text-slate-300">
                    Otimizado para apresentação no briefing diário e captura de imagem para Google Forms.
                  </p>
                </div>
              </div>

              {/* Controls */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Optional Toggle for Break/Meal Times */}
                <label className="flex items-center gap-2 bg-slate-900 border border-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-200 cursor-pointer hover:bg-slate-950">
                  <input
                    type="checkbox"
                    checked={includeMealsInSlide}
                    onChange={(e) => setIncludeMealsInSlide(e.target.checked)}
                    className="w-4 h-4 text-amber-500 rounded accent-amber-500 cursor-pointer"
                  />
                  <span>
                    Incluir Horários de {mealTypeLabel === 'almoco' ? 'Almoço' : mealTypeLabel === 'janta' ? 'Janta' : 'Refeição'}
                  </span>
                </label>

                {/* Meal type selector */}
                <select
                  value={mealTypeLabel}
                  onChange={(e) => setMealTypeLabel(e.target.value as any)}
                  className="bg-slate-900 border border-slate-700 text-white text-xs font-bold px-2.5 py-1.5 rounded-xl focus:outline-none"
                >
                  <option value="janta">Refeição: Janta (T2/T3/T5)</option>
                  <option value="almoco">Refeição: Almoço (T1/T4)</option>
                  <option value="refeicao">Refeição: Geral</option>
                </select>

                <button
                  onClick={() => handleCopyText()}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copiado!' : 'Copiar Texto'}</span>
                </button>

                <button
                  onClick={handlePrint}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir Slide</span>
                </button>

                <button
                  onClick={() => setShowSlideModal(false)}
                  className="p-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl cursor-pointer"
                  title="Fechar Slide"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Slide Body Container (Structured 16:9 Slide Design) */}
            <div className="p-4 md:p-6 overflow-y-auto bg-slate-950 flex-1 space-y-4">
              <div id="briefing-slide-canvas" className="bg-slate-900 border-2 border-slate-800 rounded-2xl p-6 shadow-2xl text-slate-100 space-y-6">
                {/* Slide Top Banner */}
                <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 p-5 rounded-xl border border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-amber-400 font-extrabold text-xs uppercase tracking-widest">
                      <Presentation className="w-4 h-4" />
                      <span>Briefing Operacional Diário</span>
                    </div>
                    <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight">
                      {state.teamName || 'EQUIPE OPERACIONAL'} — DIMENSIONAMENTO
                    </h2>
                    <p className="text-xs font-bold text-slate-300">
                      Setor: <strong className="text-white">{state.sector || 'Geral'}</strong> • Data: <strong className="text-amber-300">{formatDateBR(activeDate)}</strong> ({formatDateLongBR(activeDate)})
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <span className="px-3 py-1 bg-slate-800 border border-slate-700 rounded-lg text-xs font-extrabold text-slate-200">
                      Turno: {state.teamShift || 'T2'}
                    </span>
                    <span className={`px-3 py-1 border rounded-lg text-xs font-black ${
                      includeMealsInSlide
                        ? 'bg-emerald-950 border-emerald-600 text-emerald-300'
                        : 'bg-amber-950/60 border-amber-600 text-amber-300'
                    }`}>
                      {includeMealsInSlide
                        ? `Com Horários de ${mealTypeLabel === 'almoco' ? 'Almoço' : 'Janta'}`
                        : `Sem Exibição de Horários de ${mealTypeLabel === 'almoco' ? 'Almoço' : 'Janta'}`}
                    </span>
                  </div>
                </div>

                {/* Sizing Grid (Tasks & Collaborators) */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {state.tasks.map((task) => {
                    const members = task.members
                      .map((id) => state.collaborators.find((c) => c.id === id))
                      .filter((c): c is NonNullable<typeof c> => Boolean(c));

                    return (
                      <div
                        key={task.id}
                        className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3 flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-2.5">
                            <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                              <Briefcase className="w-3.5 h-3.5 text-amber-400" />
                              <span>{task.name}</span>
                            </h4>
                            <span className="text-[10px] font-black bg-slate-800 text-amber-300 border border-slate-700 px-2 py-0.5 rounded-full">
                              {members.length}
                            </span>
                          </div>

                          <div className="space-y-2">
                            {members.length > 0 ? (
                              members.map((col) => {
                                const breakTime = getBreakTime(col.id);
                                return (
                                  <div
                                    key={col.id}
                                    className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-between text-xs"
                                  >
                                    <div>
                                      <div className="font-bold text-slate-100 text-xs">{col.name}</div>
                                      <div className="text-[10px] text-slate-400">
                                        {col.role || 'Operador'} • {col.category || 'Geral'}
                                      </div>
                                    </div>

                                    {/* Optional Break Time Badge */}
                                    {includeMealsInSlide && (
                                      <div className="flex items-center gap-1 bg-amber-950/80 text-amber-200 border border-amber-800/80 px-2 py-0.5 rounded-md font-bold text-[10px] shrink-0">
                                        <Clock className="w-3 h-3 text-amber-400" />
                                        <span>{breakTime}</span>
                                      </div>
                                    )}
                                  </div>
                                );
                              })
                            ) : (
                              <p className="text-[11px] text-slate-500 italic p-2 text-center">
                                Sem colaboradores atribuídos
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Footer Note */}
                <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800 pt-3">
                  <span>
                    Briefing Gerado pelo EscalaPro • {state.teamName} ({formatDateBR(activeDate)})
                  </span>
                  <span>
                    {includeMealsInSlide
                      ? `* Horários de ${mealTypeLabel === 'almoco' ? 'almoço' : 'janta'} sujeitos a ajustes operacionais.`
                      : `* Horários de refeição omitidos conforme configuração de divulgação.`}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Connect Spreadsheet Modal */}
      <ConnectSpreadsheetModal
        isOpen={showConnectModal}
        onClose={() => setShowConnectModal(false)}
      />

      {/* Top Controls Bar */}
      <div className="no-print flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[var(--paper)] p-4 rounded-xl border border-[var(--line)]">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-[var(--ink)]">Escala Unificada de Trabalho e Intervalos</h3>
            {state.onlineSpreadsheet && (
              <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800 rounded-md">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Planilha Ativa
              </span>
            )}
          </div>
          <p className="text-xs text-[var(--muted)]">
            Visualização integrada desenvolvida para envio aos colaboradores, sincronização em planilha e impressão.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowSlideModal(true)}
            className="px-3 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black rounded-lg flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            title="Gerar visualização em slide para briefing e forms"
          >
            <Presentation className="w-3.5 h-3.5" />
            <span>Slide de Briefing</span>
          </button>

          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Pesquisar seu nome na escala..."
            className="w-full sm:w-52"
          />

          {state.onlineSpreadsheet ? (
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={handleSyncSpreadsheet}
                disabled={isSyncing}
                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-black rounded-lg flex items-center gap-1.5 shadow-xs transition-colors border border-emerald-500 disabled:opacity-75 cursor-pointer"
                title={`Sincronizar escala com ${state.onlineSpreadsheet.name}`}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>
                  {isSyncing
                    ? 'Sincronizando...'
                    : `Atualizar Dados na Planilha Online`}
                </span>
              </button>

              <button
                onClick={exportLocalSpreadsheet}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                title="Salvar cópia de backup local (.CSV)"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Salvar CSV</span>
              </button>

              <a
                href={state.onlineSpreadsheet.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-2 border border-[var(--line)] text-xs font-bold rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5 text-[var(--ink)] cursor-pointer"
                title="Abrir planilha no Google Sheets"
              >
                <ExternalLink className="w-3.5 h-3.5 text-[var(--primary)]" />
              </a>

              <button
                onClick={() => setShowConnectModal(true)}
                className="p-2 border border-[var(--line)] text-xs font-bold rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-[var(--muted)] hover:text-[var(--ink)] cursor-pointer"
                title="Configurar planilha conectada"
              >
                <Settings className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => setShowConnectModal(true)}
                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-lg flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Gerar / Conectar Planilha Online</span>
              </button>

              <button
                onClick={exportLocalSpreadsheet}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Salvar (.CSV)</span>
              </button>
            </div>
          )}

          <button
            onClick={handlePrint}
            className="px-3 py-2 border border-[var(--line)] text-xs font-semibold rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5 text-[var(--ink)] cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Imprimir / PDF</span>
          </button>

          <button
            onClick={saveHistory}
            className="px-3 py-2 bg-[var(--primary)] text-white text-xs font-bold rounded-lg hover:bg-[var(--primary-hover)] flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <History className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Salvar Histórico</span>
          </button>
        </div>
      </div>

      {/* Grouping Toggle */}
      <div className="no-print flex items-center gap-2 bg-[var(--paper)] p-3 rounded-xl border border-[var(--line)] text-xs font-bold">
        <span className="text-[var(--muted)]">Agrupar por:</span>
        <button
          onClick={() => setGroupBy('task')}
          className={`px-3 py-1 rounded-lg transition-all ${
            groupBy === 'task'
              ? 'bg-[var(--primary)] text-white'
              : 'bg-[var(--bg)] text-[var(--ink)] border border-[var(--line)]'
          }`}
        >
          Tarefas Operacionais
        </button>
        <button
          onClick={() => setGroupBy('role')}
          className={`px-3 py-1 rounded-lg transition-all ${
            groupBy === 'role'
              ? 'bg-[var(--primary)] text-white'
              : 'bg-[var(--bg)] text-[var(--ink)] border border-[var(--line)]'
          }`}
        >
          Cargos / Funções
        </button>
      </div>

      {/* Main Unified Printable Share Sheet Container */}
      <div className="share-container bg-[var(--paper)] border border-[var(--line)] p-8 rounded-2xl shadow-sm space-y-6">
        {/* Printable Header */}
        <div className="text-center border-b-2 border-[var(--ink)] pb-4 space-y-1">
          <h2 className="text-2xl font-black text-[var(--ink)] uppercase tracking-wide">
            {state.teamName || 'ESCALA OPERACIONAL'}
          </h2>
          <p className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider">
            {state.sector} • Data: {activeDate} • Turno: {state.teamShift || 'Geral'}
          </p>
        </div>

        {/* Group By Tasks */}
        {groupBy === 'task' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {state.tasks.map((task) => {
              const members = task.members
                .map((id) => state.collaborators.find((c) => c.id === id))
                .filter((c): c is NonNullable<typeof c> => Boolean(c) && matchesSearch(c.name, searchTerm));

              return (
                <div
                  key={task.id}
                  className="bg-[var(--bg)] border border-[var(--line)] p-4 rounded-xl space-y-3 page-break-inside-avoid"
                >
                  <div className="flex items-center justify-between border-b border-[var(--line)] pb-2">
                    <h3 className="font-extrabold text-sm text-[var(--ink)] uppercase tracking-wide flex items-center gap-2">
                      <span>{task.name}</span>
                    </h3>
                    <span className="text-xs font-black bg-[var(--primary-soft)] text-[var(--primary)] px-2.5 py-0.5 rounded-full">
                      {members.length} colaboradores
                    </span>
                  </div>

                  <div className="space-y-2">
                    {members.length > 0 ? (
                      members.map((col) => {
                        const breakTime = getBreakTime(col.id);
                        return (
                          <div
                            key={col.id}
                            className="p-2.5 bg-[var(--paper)] border border-[var(--line)] rounded-lg flex items-center justify-between text-xs hover:border-[var(--primary-border)] transition-colors shadow-2xs"
                          >
                            <div>
                              <div className="font-bold text-[var(--ink)] text-sm">{col.name}</div>
                              <div className="text-[10px] text-[var(--muted)]">
                                {col.role} • {col.category}
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 bg-blue-50 text-blue-900 dark:bg-blue-950 dark:text-blue-200 border border-blue-200 dark:border-blue-800 px-2.5 py-1 rounded-full font-bold text-xs">
                              <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                              <span>{breakTime}</span>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-xs text-[var(--muted)] italic p-2 text-center">Nenhum colaborador atribuído.</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Group By Roles */}
        {groupBy === 'role' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {state.roles.map((role) => {
              const members = presentPeople.filter(
                (p) => p.role === role && matchesSearch(p.name, searchTerm)
              );

              return (
                <div
                  key={role}
                  className="bg-[var(--bg)] border border-[var(--line)] p-4 rounded-xl space-y-3 page-break-inside-avoid"
                >
                  <div className="flex items-center justify-between border-b border-[var(--line)] pb-2">
                    <h3 className="font-extrabold text-sm text-[var(--ink)] uppercase tracking-wide">
                      {role}
                    </h3>
                    <span className="text-xs font-black bg-[var(--primary-soft)] text-[var(--primary)] px-2.5 py-0.5 rounded-full">
                      {members.length}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {members.length > 0 ? (
                      members.map((col) => {
                        const taskName =
                          state.tasks.find((t) => t.members.includes(col.id))?.name || 'Não direcionado';
                        const breakTime = getBreakTime(col.id);

                        return (
                          <div
                            key={col.id}
                            className="p-2.5 bg-[var(--paper)] border border-[var(--line)] rounded-lg flex items-center justify-between text-xs"
                          >
                            <div>
                              <div className="font-bold text-[var(--ink)]">{col.name}</div>
                              <div className="text-[10px] text-[var(--muted)]">
                                Tarefa: <strong className="text-[var(--ink)]">{taskName}</strong>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800 px-2.5 py-1 rounded-full font-bold text-xs">
                              <Clock className="w-3 h-3" />
                              <span>{breakTime}</span>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-xs text-[var(--muted)] italic p-2 text-center">
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
