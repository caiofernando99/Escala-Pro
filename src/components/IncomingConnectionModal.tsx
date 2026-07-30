import React from 'react';
import { FileSpreadsheet, Link as LinkIcon, ShieldCheck, CheckCircle2, X } from 'lucide-react';

interface IncomingConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamName: string;
  sheetUrl: string;
  webhookUrl?: string;
  onAcceptConnection: () => void;
}

export const IncomingConnectionModal: React.FC<IncomingConnectionModalProps> = ({
  isOpen,
  onClose,
  teamName,
  sheetUrl,
  webhookUrl,
  onAcceptConnection,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[var(--paper)] border border-[var(--line)] w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-[var(--primary-soft)] border-b border-[var(--primary-border)] p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--primary)] text-white flex items-center justify-center font-black shadow-xs shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase text-[var(--primary)] tracking-wider">
                Convite de Conexão em Nuvem
              </span>
              <h3 className="text-base font-extrabold text-[var(--ink)] leading-snug">
                Conectar à Equipe "{teamName || 'Operacional'}"
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[var(--muted)] hover:text-[var(--ink)] hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 text-xs text-[var(--muted)]">
          <p className="font-semibold text-[var(--ink)]">
            Você abriu um link de compartilhamento para conectar seu aplicativo diretamente à planilha oficial da equipe na nuvem.
          </p>

          <div className="bg-[var(--bg)] p-3.5 rounded-xl border border-[var(--line)] space-y-2 font-mono text-[11px]">
            <div>
              <span className="font-sans font-bold text-[var(--muted)] text-[10px] uppercase block">
                Link do Google Sheets:
              </span>
              <p className="text-[var(--ink)] truncate">{sheetUrl}</p>
            </div>
            {webhookUrl && (
              <div>
                <span className="font-sans font-bold text-[var(--muted)] text-[10px] uppercase block">
                  Webhook de Integração (Apps Script):
                </span>
                <p className="text-emerald-600 dark:text-emerald-400 truncate">Configurado (/exec)</p>
              </div>
            )}
          </div>

          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-900 dark:text-emerald-200 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
            <p>
              <strong>Segurança Garantida:</strong> Seus dados locais atuais serão preservados automaticamente em um ponto de restauração de segurança antes de sincronizar.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--line)] bg-[var(--bg)] flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[var(--paper)] border border-[var(--line)] hover:bg-[var(--bg)] text-[var(--ink)] text-xs font-bold rounded-xl transition-all cursor-pointer"
          >
            Ignorar
          </button>
          <button
            onClick={() => {
              onAcceptConnection();
              onClose();
            }}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Conectar e Sincronizar Agora</span>
          </button>
        </div>
      </div>
    </div>
  );
};
