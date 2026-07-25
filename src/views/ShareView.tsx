import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { SearchInput } from '../components/SearchInput';
import { InteractiveEmployeePortal } from '../components/InteractiveEmployeePortal';
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
} from 'lucide-react';
import { matchesSearch, isScaleOff } from '../utils/helpers';

export const ShareView: React.FC = () => {
  const { state, saveHistory, showNotice } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [groupBy, setGroupBy] = useState<'task' | 'role'>('task');
  const [showPortal, setShowPortal] = useState(false);

  const activeDate = state.selectedDate;
  const dayIntervals = state.intervals[activeDate] || {};

  // Copy Interactive Share Link
  const handleCopyInteractiveLink = () => {
    const publicUrl = `${window.location.origin}${window.location.pathname}?view=employee_portal&date=${activeDate}`;
    navigator.clipboard.writeText(publicUrl);
    setCopiedLink(true);
    showNotice('Link do Portal Interativo do Colaborador copiado com sucesso!');
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

  // Generate plain text summary for WhatsApp / Slack
  const handleCopyText = () => {
    let text = `📋 *ESCALA OPERACIONAL — ${state.teamName.toUpperCase()}*\n`;
    text += `📅 Data: ${activeDate} | Setor: ${state.sector || 'Geral'}\n\n`;

    state.tasks.forEach((t) => {
      text += `*🔹 TAREFA: ${t.name.toUpperCase()}*\n`;
      const members = t.members
        .map((id) => state.collaborators.find((c) => c.id === id))
        .filter(Boolean);

      if (members.length === 0) {
        text += `   _(Sem colaboradores atribuídos)_\n`;
      } else {
        members.forEach((m) => {
          if (!m) return;
          const breakTime = getBreakTime(m.id);
          text += `   • *${m.name}* (${m.role || 'Operador'}) ➔ 🕒 Intervalo: *${breakTime}*\n`;
        });
      }
      text += `\n`;
    });

    navigator.clipboard.writeText(text);
    setCopied(true);
    showNotice('Resumo formatado copiado para a área de transferência!');
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
            <span>Novo Portal Interativo do Colaborador</span>
          </div>
          <h3 className="text-lg font-black text-white">Link Público Interativo para Envio à Equipe</h3>
          <p className="text-xs text-white/80 font-medium max-w-xl">
            Permite que colaboradores em equipes grandes consultem facilmente seu horário de intervalo e tarefa digitando o nome ou filtrando por cargo e categoria.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={handleCopyInteractiveLink}
            className="px-4 py-2.5 bg-white/20 hover:bg-white/30 text-white text-xs font-black rounded-xl flex items-center gap-2 shadow-sm transition-colors border border-white/30"
          >
            {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copiedLink ? 'Link Copiado!' : 'Copiar Link Interativo'}</span>
          </button>

          <button
            onClick={() => setShowPortal(true)}
            className="px-4 py-2.5 bg-white text-[var(--ink)] hover:bg-white/90 text-xs font-black rounded-xl flex items-center gap-2 shadow-sm transition-colors"
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

      {/* Top Controls Bar */}
      <div className="no-print flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[var(--paper)] p-4 rounded-xl border border-[var(--line)]">
        <div>
          <h3 className="text-lg font-bold text-[var(--ink)]">Escala Unificada de Trabalho e Intervalos</h3>
          <p className="text-xs text-[var(--muted)]">
            Visualização integrada desenvolvida para envio aos colaboradores e impressão.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Pesquisar seu nome na escala..."
            className="w-full sm:w-60"
          />

          <button
            onClick={handleCopyText}
            className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-xs transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>Copiar WhatsApp</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-3 py-2 border border-[var(--line)] text-xs font-semibold rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5 text-[var(--ink)]"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimir / PDF</span>
          </button>

          <button
            onClick={saveHistory}
            className="px-3 py-2 bg-[var(--primary)] text-white text-xs font-bold rounded-lg hover:bg-[var(--primary-hover)] flex items-center gap-1.5 shadow-xs"
          >
            <History className="w-3.5 h-3.5" />
            <span>Salvar Histórico</span>
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
