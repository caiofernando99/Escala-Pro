import React from 'react';
import { useApp } from '../context/AppContext';
import { FileText, Save, Download, CheckCircle2 } from 'lucide-react';
import { formatDateLongBR, getCollaboratorStatus } from '../utils/helpers';

export const ReportView: React.FC = () => {
  const {
    state,
    setAbsenceReason,
    setOccurrence,
    setGeneralNotes,
    saveDailyReport,
  } = useApp();

  const activeDate = state.selectedDate;
  const dayReport = state.dailyReports[activeDate] || {};

  const handleDownloadReport = () => {
    const data = {
      teamName: state.teamName,
      sector: state.sector,
      date: activeDate,
      ...dayReport,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-diario-${activeDate}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[var(--paper)] p-4 rounded-xl border border-[var(--line)]">
        <div>
          <h3 className="text-lg font-bold text-[var(--ink)]">Relatório Diário Operacional — {formatDateLongBR(activeDate)}</h3>
          <p className="text-xs text-[var(--muted)]">
            Registre ocorrências individuais, justificativas de ausências e notas finais do turno.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadReport}
            className="px-3 py-2 border border-[var(--line)] text-xs font-semibold rounded-lg hover:bg-[var(--bg)] flex items-center gap-1.5 text-[var(--ink)]"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar JSON</span>
          </button>
          <button
            onClick={saveDailyReport}
            className="px-4 py-2 bg-[var(--primary)] text-white text-xs font-bold rounded-lg hover:bg-[var(--primary-hover)] flex items-center gap-1.5 shadow-xs"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Salvar Relatório</span>
          </button>
        </div>
      </div>

      {dayReport.generatedAt && (
        <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Último relatório gravado em: {dayReport.generatedAt}</span>
        </div>
      )}

      {/* Snapshot Table */}
      <div className="bg-[var(--paper)] border border-[var(--line)] p-5 rounded-xl space-y-4">
        <h4 className="text-sm font-bold text-[var(--ink)]">Quadro de Ocorrências e Status da Equipe</h4>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[750px]">
            <thead>
              <tr className="border-b border-[var(--line)] text-[var(--muted)] font-bold uppercase">
                <th className="p-2.5">Colaborador</th>
                <th className="p-2.5">Status</th>
                <th className="p-2.5">Tarefa</th>
                <th className="p-2.5">Motivo da Ausência / Justificativa</th>
                <th className="p-2.5">Ocorrência Individual</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)]">
              {state.collaborators.map((c) => {
                const statusInfo = getCollaboratorStatus(c, activeDate, state);
                const taskName =
                  state.tasks.find((t) => t.members.includes(c.id))?.name || 'Não direcionado';

                const currentReason = dayReport.absenceReasons?.[c.id] || '';
                const currentOccur = dayReport.occurrences?.[c.id] || '';

                const statusBadgeClass =
                  statusInfo.status === 'presente'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : statusInfo.status === 'ferias'
                    ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                    : statusInfo.status === 'licenca' || statusInfo.status === 'treinamento'
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    : statusInfo.status === 'folga'
                    ? 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
                    : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300';

                return (
                  <tr key={c.id} className="hover:bg-[var(--bg)]">
                    <td className="p-2.5 font-bold text-[var(--ink)]">
                      <div>{c.name}</div>
                      <div className="text-[10px] text-[var(--muted)] font-normal">{c.role}</div>
                    </td>

                    <td className="p-2.5">
                      <span className={`px-2 py-0.5 rounded-full font-bold uppercase text-[10px] ${statusBadgeClass}`}>
                        {statusInfo.status}
                      </span>
                    </td>

                    <td className="p-2.5 font-semibold text-[var(--ink)]">{taskName}</td>

                    <td className="p-2.5">
                      {statusInfo.status === 'presente' ? (
                        <span className="text-[var(--muted)]">—</span>
                      ) : (
                        <input
                          type="text"
                          value={currentReason}
                          onChange={(e) => setAbsenceReason(c.id, e.target.value)}
                          placeholder="Registrar justificativa..."
                          className="w-full p-1.5 bg-[var(--bg)] border border-[var(--line)] rounded text-xs text-[var(--ink)]"
                        />
                      )}
                    </td>

                    <td className="p-2.5">
                      <input
                        type="text"
                        value={currentOccur}
                        onChange={(e) => setOccurrence(c.id, e.target.value)}
                        placeholder="Registrar ocorrência do turno..."
                        className="w-full p-1.5 bg-[var(--bg)] border border-[var(--line)] rounded text-xs text-[var(--ink)]"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* General Operational Notes */}
      <div className="bg-[var(--paper)] border border-[var(--line)] p-5 rounded-xl space-y-3">
        <h4 className="text-sm font-bold text-[var(--ink)]">Observações Gerais da Operação no Turno</h4>
        <textarea
          rows={5}
          value={dayReport.generalNotes || ''}
          onChange={(e) => setGeneralNotes(e.target.value)}
          placeholder="Registre informações relevantes, gargalos de produção, metas atingidas e pendências para a próxima equipe..."
          className="w-full p-3 bg-[var(--bg)] border border-[var(--line)] rounded-xl text-xs text-[var(--ink)] leading-relaxed focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
        />
      </div>
    </div>
  );
};
