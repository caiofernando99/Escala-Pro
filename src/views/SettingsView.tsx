import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ConfirmModal } from '../components/ConfirmModal';
import {
  Palette,
  Download,
  Upload,
  Trash2,
  Check,
  ShieldAlert,
  Database,
  Sparkles,
  Award,
} from 'lucide-react';
import { ThemeOption } from '../types';
import { BRAND_OPTIONS, DEFAULT_BRAND } from '../utils/brands';

export const SettingsView: React.FC = () => {
  const { state, setTheme, setBrandId, importFullState, resetAllData, showNotice } = useApp();
  const [resetModalOpen, setResetModalOpen] = useState(false);

  const activeBrand = BRAND_OPTIONS.find((b) => b.id === state.brandId) || DEFAULT_BRAND;

  const themeOptions: Array<{
    id: ThemeOption;
    name: string;
    desc: string;
    category: string;
    colorBg: string;
    colorAccent: string;
  }> = [
    {
      id: 'slate',
      name: 'Slate Blue (Executivo)',
      desc: 'Azul clássico e limpo para rotina administrativa',
      category: 'Claro Ergonômico',
      colorBg: '#f8fafc',
      colorAccent: '#1d4ed8',
    },
    {
      id: 'material-you',
      name: 'Material Design Steel',
      desc: 'Material You M3 com contêineres suaves e azul aço',
      category: 'Material Design',
      colorBg: '#f4f6fa',
      colorAccent: '#005faf',
    },
    {
      id: 'material-teal',
      name: 'Material Teal & Sage',
      desc: 'M3 em tons de verde-azulado para longa jornada sem fadiga',
      category: 'Material Design',
      colorBg: '#f2f7f6',
      colorAccent: '#006a60',
    },
    {
      id: 'material-terracotta',
      name: 'Material Warm Terracotta',
      desc: 'M3 em argila quente de baixíssima luz azul para descanso visual',
      category: 'Material Design',
      colorBg: '#fbf7f4',
      colorAccent: '#a8381e',
    },
    {
      id: 'sage-matte',
      name: 'Sálvia Opaco & Areia',
      desc: 'Tom pastel natural, altamente fosco e anti-reflexo',
      category: 'Opaco Soft',
      colorBg: '#f4f6f4',
      colorAccent: '#386641',
    },
    {
      id: 'nord-frost',
      name: 'Nord Frost Arctic',
      desc: 'Paleta escandinava fosca em tons de gelo e azul ártico',
      category: 'Opaco Soft',
      colorBg: '#eceff4',
      colorAccent: '#5e81ac',
    },
    {
      id: 'emerald',
      name: 'Emerald Logística',
      desc: 'Verde focado em logística e chão de fábrica',
      category: 'Claro Ergonômico',
      colorBg: '#f0fdf4',
      colorAccent: '#047857',
    },
    {
      id: 'indigo',
      name: 'Indigo Velvet',
      desc: 'Tons suaves de violeta e azul profundo',
      category: 'Claro Ergonômico',
      colorBg: '#f5f3ff',
      colorAccent: '#4338ca',
    },
    {
      id: 'material-dark',
      name: 'Material You Dark M3',
      desc: 'Modo escuro Material Design com contraste suave sem brilho',
      category: 'Escuro Ergonômico',
      colorBg: '#121318',
      colorAccent: '#80b5ff',
    },
    {
      id: 'obsidian-dark',
      name: 'Obsidian & Teal Opaco',
      desc: 'Grafite escuro opaco com destaques em azul turquesa suave',
      category: 'Escuro Ergonômico',
      colorBg: '#18181b',
      colorAccent: '#2dd4bf',
    },
    {
      id: 'dark',
      name: 'Dark Midnight (Noturno)',
      desc: 'Fundo escuro tradicional para plantões noturnos',
      category: 'Escuro Ergonômico',
      colorBg: '#090d16',
      colorAccent: '#3b82f6',
    },
    {
      id: 'high-contrast',
      name: 'Alto Contraste Acessível',
      desc: 'Preto e branco de máxima legibilidade',
      category: 'Acessibilidade',
      colorBg: '#ffffff',
      colorAccent: '#000000',
    },
  ];

  const handleExportConfig = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `people-scheduler-backup-${state.teamName || 'equipe'}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showNotice('Configuração exportada com sucesso.');
  };

  const handleImportConfig = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const json = JSON.parse(evt.target?.result as string);
        importFullState(json);
      } catch (err) {
        showNotice('Arquivo JSON inválido.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* App Identity Info */}
      <div className="bg-[var(--paper)] border border-[var(--line)] p-6 rounded-2xl flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-600 text-white font-black flex items-center justify-center text-xl shadow-sm">
            EP
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-[var(--ink)]">EscalaPro — Sistema de Gestão 6x2</h3>
            <p className="text-xs text-[var(--muted)] font-medium">
              Gestão de escalas, dimensionamento de tarefas, controle de presença e intervalos de refeição.
            </p>
          </div>
        </div>
        <span className="text-xs font-black px-3 py-1 bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200 rounded-full border border-emerald-300 dark:border-emerald-800">
          Versão Operacional 2.5
        </span>
      </div>

      {/* Themes Section */}
      <div className="bg-[var(--paper)] border border-[var(--line)] p-6 rounded-2xl space-y-4">
        <div className="flex items-center gap-2 text-[var(--primary)] font-bold text-sm">
          <Palette className="w-5 h-5" />
          <h3 className="text-base text-[var(--ink)]">Personalização de Temas Visuais</h3>
        </div>
        <p className="text-xs text-[var(--muted)]">
          Escolha o tema de cores que melhor se adapta ao seu ambiente de trabalho ou preferência visual.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
          {themeOptions.map((t) => {
            const isSelected = state.theme === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                className={`p-4 rounded-xl border-2 text-left flex flex-col justify-between transition-all relative overflow-hidden ${
                  isSelected
                    ? 'border-[var(--primary)] ring-2 ring-[var(--primary-border)] shadow-md'
                    : 'border-[var(--line)] hover:border-slate-400 bg-[var(--bg)]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-extrabold text-sm text-[var(--ink)]">{t.name}</span>
                    {isSelected && (
                      <span className="p-1 bg-[var(--primary)] text-white rounded-full shrink-0">
                        <Check className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>
                  <div className="mb-2">
                    <span className="px-2 py-0.5 bg-[var(--primary-soft)] text-[var(--primary)] border border-[var(--primary-border)] rounded text-[10px] font-black uppercase">
                      {t.category}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--muted)] mb-4">{t.desc}</p>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-[var(--line)]">
                  <span
                    className="w-5 h-5 rounded-full border border-slate-300"
                    style={{ backgroundColor: t.colorBg }}
                  ></span>
                  <span
                    className="w-5 h-5 rounded-full border border-slate-300"
                    style={{ backgroundColor: t.colorAccent }}
                  ></span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Export & Import Backup Section */}
      <div className="bg-[var(--paper)] border border-[var(--line)] p-6 rounded-2xl space-y-4">
        <div className="flex items-center gap-2 text-[var(--primary)] font-bold text-sm">
          <Database className="w-5 h-5" />
          <h3 className="text-base text-[var(--ink)]">Exportar e Importar Configurações (Backup)</h3>
        </div>
        <p className="text-xs text-[var(--muted)]">
          Faça download de um arquivo JSON contendo todos os dados cadastrados ou restaure uma cópia de segurança.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={handleExportConfig}
            className="px-4 py-2.5 bg-[var(--primary)] text-white text-xs font-bold rounded-xl hover:bg-[var(--primary-hover)] flex items-center gap-2 shadow-xs transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Exportar Configurações JSON</span>
          </button>

          <label className="cursor-pointer px-4 py-2.5 border border-[var(--line)] text-xs font-bold rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 text-[var(--ink)] transition-colors">
            <Upload className="w-4 h-4 text-[var(--muted)]" />
            <span>Importar Configurações JSON</span>
            <input type="file" accept="application/json" onChange={handleImportConfig} className="hidden" />
          </label>
        </div>
      </div>

      {/* Clear All Data Section */}
      <div className="bg-red-50/50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 p-6 rounded-2xl space-y-4">
        <div className="flex items-center gap-2 text-red-600 font-bold text-sm">
          <ShieldAlert className="w-5 h-5" />
          <h3 className="text-base">Zona de Perigo — Limpar Todos os Dados</h3>
        </div>
        <p className="text-xs text-red-700 dark:text-red-300 leading-relaxed max-w-2xl">
          Esta ação apaga permanentemente todos os colaboradores, tarefas, calendário de escala, históricos e configurações gravadas neste navegador.
        </p>

        <div>
          <button
            onClick={() => setResetModalOpen(true)}
            className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-sm transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>Limpar Todos os Dados da Aplicação</span>
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={resetModalOpen}
        onClose={() => setResetModalOpen(false)}
        onConfirm={resetAllData}
        title="Redefinir Aplicação Completa"
        description="Tem certeza de que deseja apagar TODOS os dados da aplicação? Esta ação é irreversível e resetará colaboradores, tarefas, escalas e históricos."
        confirmText="Limpar Todos os Dados"
        requireKeyword="DELETAR"
      />
    </div>
  );
};
