import React, { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  requireKeyword?: string;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirmar',
  requireKeyword,
}) => {
  const [inputVal, setInputVal] = useState('');

  if (!isOpen) return null;

  const isConfirmDisabled = requireKeyword
    ? inputVal.trim().toUpperCase() !== requireKeyword.toUpperCase()
    : false;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-[var(--paper)] border border-[var(--line)] rounded-xl max-w-md w-full p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-md"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4 text-red-600">
          <div className="p-3 bg-red-100 rounded-full dark:bg-red-950/50">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-[var(--ink)]">{title}</h3>
        </div>

        <p className="text-sm text-[var(--muted)] mb-4 leading-relaxed">{description}</p>

        {requireKeyword && (
          <div className="mb-5">
            <label className="block text-xs font-semibold text-[var(--muted)] mb-1">
              Digite <span className="font-mono text-red-600 uppercase">{requireKeyword}</span> para confirmar:
            </label>
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder={requireKeyword}
              className="w-full p-2.5 bg-[var(--paper)] border border-[var(--line)] rounded-lg text-sm text-[var(--ink)] uppercase tracking-wider"
            />
          </div>
        )}

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-[var(--line)] rounded-lg text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Cancelar
          </button>
          <button
            disabled={isConfirmDisabled}
            onClick={() => {
              onConfirm();
              setInputVal('');
              onClose();
            }}
            className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
