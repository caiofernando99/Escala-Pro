import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { FileSpreadsheet, Link as LinkIcon, Download, Check, X, Shield, RefreshCw, ExternalLink } from 'lucide-react';

interface ConnectSpreadsheetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ConnectSpreadsheetModal: React.FC<ConnectSpreadsheetModalProps> = ({ isOpen, onClose }) => {
  const { state, setOnlineSpreadsheetConfig, generateTemplateSpreadsheet, showNotice } = useApp();

  const currentConfig = state.onlineSpreadsheet;

  const [name, setName] = useState(currentConfig?.name || 'Planilha Oficial de Turnos - EscalaPro');
  const [url, setUrl] = useState(currentConfig?.url || 'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit');
  const [webhookUrl, setWebhookUrl] = useState(currentConfig?.webhookUrl || '');

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showNotice('Informe o nome da planilha.');
      return;
    }
    if (!url.trim()) {
      showNotice('Informe o link/URL da planilha do Google Sheets.');
      return;
    }

    setOnlineSpreadsheetConfig({
      name: name.trim(),
      url: url.trim(),
      webhookUrl: webhookUrl.trim() || undefined,
      lastSyncedAt: currentConfig?.lastSyncedAt || '',
      syncCount: currentConfig?.syncCount || 0,
    });
    onClose();
  };

  const handleDisconnect = () => {
    setOnlineSpreadsheetConfig(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[var(--paper)] border border-[var(--line)] w-full max-w-xl rounded-2xl shadow-xl overflow-hidden space-y-0">
        {/* Header */}
        <div className="bg-[var(--primary-soft)] border-b border-[var(--primary-border)] p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--primary)] text-white flex items-center justify-center shadow-xs">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[var(--ink)]">Conectar Planilha Compartilhada</h3>
              <p className="text-xs text-[var(--muted)] font-medium">
                Transforme uma planilha do Google Sheets em seu banco de dados online.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[var(--muted)] hover:text-[var(--ink)] rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSave} className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[var(--ink)] uppercase tracking-wider block">
              Nome da Planilha
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Planilha Oficial da Equipe - Logística T2"
              className="w-full px-3.5 py-2.5 bg-[var(--bg)] border border-[var(--line)] rounded-xl text-xs font-bold text-[var(--ink)] focus:outline-none focus:border-[var(--primary)]"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[var(--ink)] uppercase tracking-wider block">
              Link / URL do Google Sheets (Compartilhada)
            </label>
            <div className="relative">
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/..."
                className="w-full pl-9 pr-3.5 py-2.5 bg-[var(--bg)] border border-[var(--line)] rounded-xl text-xs font-mono text-[var(--ink)] focus:outline-none focus:border-[var(--primary)]"
                required
              />
              <LinkIcon className="w-4 h-4 text-[var(--muted)] absolute left-3 top-3" />
            </div>
            <p className="text-[11px] text-[var(--muted)]">
              Cole o link da planilha no Google Drive com permissão de edição para administradores.
            </p>
          </div>

          <div className="space-y-1.5 pt-1">
            <label className="text-xs font-bold text-[var(--ink)] uppercase tracking-wider block">
              URL do Webhook (Google Apps Script — Opcional)
            </label>
            <input
              type="url"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="https://script.google.com/macros/s/.../exec"
              className="w-full px-3.5 py-2.5 bg-[var(--bg)] border border-[var(--line)] rounded-xl text-xs font-mono text-[var(--ink)] focus:outline-none focus:border-[var(--primary)]"
            />
            <p className="text-[11px] text-[var(--muted)]">
              Caso utilize um script automatizado no Google Sheets, este endpoint receberá atualizações em tempo real ao clicar no botão de sincronizar.
            </p>
          </div>

          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 p-3.5 rounded-xl text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
            <Shield className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold">Ainda não criou a planilha no Google Sheets?</span>
              <p className="text-[11px] opacity-90">
                Você pode baixar um modelo inicial no botão abaixo para importar no Google Sheets e compartilhar com seus gestores.
              </p>
              <button
                type="button"
                onClick={generateTemplateSpreadsheet}
                className="mt-1 inline-flex items-center gap-1.5 font-bold text-[11px] text-amber-700 dark:text-amber-300 underline hover:no-underline"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Baixar Planilha Modelo (.CSV)</span>
              </button>
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="pt-3 border-t border-[var(--line)] flex flex-wrap items-center justify-between gap-3">
            {currentConfig ? (
              <button
                type="button"
                onClick={handleDisconnect}
                className="px-3.5 py-2 text-xs font-bold text-red-600 hover:text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-colors"
              >
                Desconectar Planilha
              </button>
            ) : (
              <div></div>
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-[var(--line)] text-xs font-bold rounded-xl text-[var(--ink)] hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-[var(--primary)] text-white text-xs font-black rounded-xl hover:bg-[var(--primary-hover)] flex items-center gap-2 shadow-xs transition-colors"
              >
                <Check className="w-4 h-4" />
                <span>Salvar & Conectar Planilha</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
