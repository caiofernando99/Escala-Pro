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
  Stethoscope,
  FileSpreadsheet,
  Link as LinkIcon,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  ShieldCheck,
  RotateCcw,
  History,
  Info,
  AlertTriangle,
  PanelLeftClose,
  PanelLeft,
} from 'lucide-react';
import { ThemeOption } from '../types';
import { BRAND_OPTIONS, DEFAULT_BRAND } from '../utils/brands';

export const SettingsView: React.FC = () => {
  const {
    state,
    setTheme,
    setBrandId,
    importFullState,
    resetAllData,
    showNotice,
    setOnlineSpreadsheetConfig,
    syncToOnlineSpreadsheet,
    exportLocalSpreadsheet,
    generateTemplateSpreadsheet,
    lastAutoBackupInfo,
    createAutoBackup,
    restoreFromAutoBackup,
    disconnectOnlineSpreadsheet,
    toggleSidebarCollapsed,
    setSidebarCollapsed,
  } = useApp();

  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [sheetName, setSheetName] = useState(
    state.onlineSpreadsheet?.name || 'Planilha Oficial de Turnos - Logística T2'
  );
  const [sheetUrl, setSheetUrl] = useState(
    state.onlineSpreadsheet?.url ||
      'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit'
  );
  const [webhookUrl, setWebhookUrl] = useState(
    state.onlineSpreadsheet?.webhookUrl || ''
  );
  const [autoSync, setAutoSync] = useState(
    state.onlineSpreadsheet?.autoSyncEnabled !== false
  );
  const [isSyncing, setIsSyncing] = useState(false);

  const activeBrand = BRAND_OPTIONS.find((b) => b.id === state.brandId) || DEFAULT_BRAND;

  const handleSaveSpreadsheetConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sheetName.trim()) {
      showNotice('Informe o nome da planilha.');
      return;
    }
    if (!sheetUrl.trim()) {
      showNotice('Informe o link/URL da planilha.');
      return;
    }

    setOnlineSpreadsheetConfig({
      name: sheetName.trim(),
      url: sheetUrl.trim(),
      webhookUrl: webhookUrl.trim() || undefined,
      autoSyncEnabled: autoSync,
      lastSyncedAt: state.onlineSpreadsheet?.lastSyncedAt || '',
      syncCount: state.onlineSpreadsheet?.syncCount || 0,
    });
  };

  const handleSyncNow = async () => {
    setIsSyncing(true);
    await syncToOnlineSpreadsheet();
    setTimeout(() => setIsSyncing(false), 600);
  };

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
    a.download = `escalapro-config-${state.teamName || 'equipe'}.json`;
    a.click();
    URL.revokeObjectURL(url);
    if (state.onlineSpreadsheet?.webhookUrl) {
      showNotice('Configurações exportadas! Inclui os parâmetros do sistema e a conexão completa com a planilha online (com Webhook e links).');
    } else {
      showNotice('Configurações exportadas com sucesso em formato .JSON!');
    }
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
    <div className="space-y-3 animate-in fade-in duration-200">
      {/* App Identity Info */}
      <div className="bg-[var(--paper)] border border-[var(--line)] p-3 rounded-xl flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-600 text-white font-black flex items-center justify-center text-sm shadow-2xs">
            EP
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-[var(--ink)] leading-tight">EscalaPro — Sistema de Gestão 6x2</h3>
            <p className="text-[11px] text-[var(--muted)] font-medium">
              Gestão de escalas, dimensionamento, presença e intervalos de refeição.
            </p>
          </div>
        </div>
        <span className="text-[10px] font-black px-2.5 py-0.5 bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200 rounded-full border border-emerald-300 dark:border-emerald-800 shrink-0">
          v2.5
        </span>
      </div>

      {/* Navigation & Interface Controls */}
      <div className="bg-[var(--paper)] border border-[var(--line)] p-5 rounded-2xl space-y-3 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[var(--primary-soft)] text-[var(--primary)] border border-[var(--primary-border)] rounded-xl">
              <PanelLeft className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-[var(--ink)]">Menu Lateral de Navegação (Sidebar)</h3>
              <p className="text-xs text-[var(--muted)] font-medium">
                Reduza o menu lateral para exibir apenas os ícones, liberando mais espaço de tela para a escala.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setSidebarCollapsed(false)}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
                !state.isSidebarCollapsed
                  ? 'bg-[var(--primary)] text-white shadow-2xs'
                  : 'bg-[var(--bg)] text-[var(--ink)] border border-[var(--line)] hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <PanelLeft className="w-4 h-4" />
              <span>Expandido (Padrão)</span>
            </button>

            <button
              onClick={() => setSidebarCollapsed(true)}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
                state.isSidebarCollapsed
                  ? 'bg-[var(--primary)] text-white shadow-2xs'
                  : 'bg-[var(--bg)] text-[var(--ink)] border border-[var(--line)] hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <PanelLeftClose className="w-4 h-4" />
              <span>Reduzido (Apenas Ícones)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Compact Themes Section */}
      <div className="bg-[var(--paper)] border border-[var(--line)] p-5 rounded-2xl space-y-3 shadow-2xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[var(--primary)] font-extrabold text-sm">
            <Palette className="w-4 h-4" />
            <h3 className="text-sm text-[var(--ink)]">Personalização de Temas Visuais</h3>
          </div>
          <span className="text-[11px] font-bold text-[var(--muted)]">
            {themeOptions.length} temas disponíveis
          </span>
        </div>

        {/* Dense Compact Theme Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 pt-1">
          {themeOptions.map((t) => {
            const isSelected = state.theme === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                title={`${t.name} — ${t.desc}`}
                className={`p-2.5 rounded-xl border-2 text-left flex flex-col justify-between transition-all cursor-pointer relative ${
                  isSelected
                    ? 'border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary)] ring-1 ring-[var(--primary-border)]'
                    : 'border-[var(--line)] hover:border-slate-400 bg-[var(--bg)] text-[var(--ink)]'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-3 h-3 rounded-full border border-slate-300 shrink-0"
                      style={{ backgroundColor: t.colorBg }}
                    ></span>
                    <span
                      className="w-3 h-3 rounded-full border border-slate-300 shrink-0"
                      style={{ backgroundColor: t.colorAccent }}
                    ></span>
                  </div>
                  {isSelected && (
                    <span className="p-0.5 bg-[var(--primary)] text-white rounded-full shrink-0">
                      <Check className="w-3 h-3" />
                    </span>
                  )}
                </div>

                <div>
                  <div className="font-extrabold text-[11px] leading-tight truncate">{t.name}</div>
                  <div className="text-[9px] font-bold opacity-75 uppercase truncate mt-0.5">
                    {t.category}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Shared Google Sheets Database Integration Section */}
      <div className="bg-[var(--paper)] border border-[var(--line)] p-6 rounded-2xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--line)] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white font-bold flex items-center justify-center shadow-xs">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-[var(--ink)]">
                  Conectar Planilha Compartilhada (Google Sheets Banco de Dados)
                </h3>
                {state.onlineSpreadsheet ? (
                  <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800 rounded-full text-[10px] font-black uppercase flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Conectada
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700 rounded-full text-[10px] font-black uppercase">
                    Não Conectada
                  </span>
                )}
              </div>
              <p className="text-xs text-[var(--muted)] font-medium">
                Transforme uma planilha do Google Sheets em seu banco de dados online compartilhado para armazenar e sincronizar as escalas da equipe entre administradores.
              </p>
            </div>
          </div>

          {state.onlineSpreadsheet && (
            <a
              href={state.onlineSpreadsheet.url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800 text-xs font-bold rounded-xl hover:bg-emerald-100 flex items-center gap-1.5 shrink-0"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Abrir no Google Sheets</span>
            </a>
          )}
        </div>

        {/* Form Controls */}
        <form onSubmit={handleSaveSpreadsheetConfig} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[var(--ink)] uppercase tracking-wider block">
                Nome da Planilha
              </label>
              <input
                type="text"
                value={sheetName}
                onChange={(e) => setSheetName(e.target.value)}
                placeholder="Ex: Planilha Oficial de Turnos - Logística T2"
                className="w-full px-3.5 py-2.5 bg-[var(--bg)] border border-[var(--line)] rounded-xl text-xs font-bold text-[var(--ink)] focus:outline-none focus:border-[var(--primary)]"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[var(--ink)] uppercase tracking-wider block">
                Link / URL da Planilha (Google Sheets)
              </label>
              <div className="relative">
                <input
                  type="url"
                  value={sheetUrl}
                  onChange={(e) => setSheetUrl(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                  className="w-full pl-9 pr-3.5 py-2.5 bg-[var(--bg)] border border-[var(--line)] rounded-xl text-xs font-mono text-[var(--ink)] focus:outline-none focus:border-[var(--primary)]"
                  required
                />
                <LinkIcon className="w-4 h-4 text-[var(--muted)] absolute left-3 top-3" />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <label className="text-xs font-bold text-[var(--ink)] uppercase tracking-wider block">
                URL do Webhook (Google Apps Script Web App — Opcional)
              </label>
              {webhookUrl.trim() && (
                <button
                  type="button"
                  onClick={async () => {
                    if (webhookUrl.includes('docs.google.com/spreadsheets')) {
                      showNotice('A URL do Webhook deve ser o link do Web App do Apps Script (iniciando com https://script.google.com/macros/s/.../exec) e não o link da planilha.');
                      return;
                    }
                    setIsSyncing(true);
                    setOnlineSpreadsheetConfig({
                      name: sheetName.trim() || 'Planilha Oficial',
                      url: sheetUrl.trim() || 'https://docs.google.com',
                      webhookUrl: webhookUrl.trim(),
                      autoSyncEnabled: autoSync,
                    });
                    const success = await syncToOnlineSpreadsheet();
                    setIsSyncing(false);
                    if (success) {
                      showNotice('Conexão testada e aprovada! Planilha atualizada na nuvem.');
                    }
                  }}
                  disabled={isSyncing}
                  className="px-2.5 py-1 bg-[var(--primary-soft)] hover:bg-[var(--line)] text-[var(--primary)] text-[11px] font-extrabold rounded-lg border border-[var(--primary-border)] flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'Testando Conexão...' : 'Testar Conexão'}</span>
                </button>
              )}
            </div>
            <input
              type="url"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="https://script.google.com/macros/s/.../exec"
              className="w-full px-3.5 py-2.5 bg-[var(--bg)] border border-[var(--line)] rounded-xl text-xs font-mono text-[var(--ink)] focus:outline-none focus:border-[var(--primary)]"
            />
            {webhookUrl.includes('docs.google.com/spreadsheets') && (
              <p className="text-[11px] text-amber-700 dark:text-amber-400 font-bold bg-amber-50 dark:bg-amber-950/40 p-2 rounded-lg border border-amber-200 dark:border-amber-900">
                ⚠️ Atenção: Você inseriu o link direto da planilha. O Webhook deve ser a URL do Web App gerada no Google Apps Script (iniciando com https://script.google.com/macros/s/.../exec).
              </p>
            )}
            <p className="text-[11px] text-[var(--muted)]">
              Sua equipe pode publicar um Web App simples no Google Apps Script para receber e gravar as alterações de colaboradores, escala e configurações diretamente nas abas do Google Sheets.
            </p>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="autoSyncSettings"
                checked={autoSync}
                onChange={(e) => setAutoSync(e.target.checked)}
                className="w-4 h-4 text-[var(--primary)] rounded accent-[var(--primary)] cursor-pointer"
              />
              <label htmlFor="autoSyncSettings" className="text-xs font-extrabold text-[var(--ink)] cursor-pointer">
                Sincronização Automática em Tempo Real
              </label>
            </div>
            <p className="text-[11px] text-[var(--muted)] pl-6">
              Sincroniza automaticamente qualquer edição de colaborador, posto, escala ou configuração diretamente com o Google Sheets em segundo plano.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="submit"
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl flex items-center gap-2 shadow-xs transition-colors"
              >
                <Check className="w-4 h-4" />
                <span>Salvar Configuração da Planilha</span>
              </button>

              {state.onlineSpreadsheet && (
                <button
                  type="button"
                  onClick={handleSyncNow}
                  disabled={isSyncing}
                  className="px-4 py-2.5 bg-[var(--primary)] text-white text-xs font-black rounded-xl hover:bg-[var(--primary-hover)] flex items-center gap-2 shadow-xs transition-colors border border-[var(--primary-border)] disabled:opacity-75"
                >
                  <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>
                    {isSyncing ? 'Sincronizando...' : `Atualizar Dados na Planilha Online (${state.onlineSpreadsheet.name})`}
                  </span>
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={exportLocalSpreadsheet}
                className="px-3.5 py-2.5 border border-[var(--line)] text-xs font-bold rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-[var(--ink)] flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-4 h-4 text-blue-600" />
                <span>Salvar Planilha Local (.CSV)</span>
              </button>

              <button
                type="button"
                onClick={generateTemplateSpreadsheet}
                className="px-3.5 py-2.5 border border-[var(--line)] text-xs font-bold rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-[var(--ink)] flex items-center gap-1.5 transition-colors"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>Baixar Modelo (.CSV)</span>
              </button>
            </div>
          </div>
        </form>

        {state.onlineSpreadsheet?.lastSyncedAt && state.onlineSpreadsheet?.syncStatus !== 'error' && (
          <div className="bg-[var(--primary-soft)] border border-[var(--primary-border)] p-3.5 rounded-xl text-xs font-extrabold text-[var(--primary)] flex flex-wrap items-center justify-between gap-2">
            <span>
              ÚLTIMA SINCRONIZAÇÃO DA BANCO DE DADOS: <strong>{state.onlineSpreadsheet.lastSyncedAt}</strong>
            </span>
            <span>
              TOTAL DE ATUALIZAÇÕES: <strong>{state.onlineSpreadsheet.syncCount || 0} vezes</strong>
            </span>
          </div>
        )}

        {state.onlineSpreadsheet?.syncStatus === 'error' && (
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 p-3.5 rounded-xl text-xs font-bold text-amber-900 dark:text-amber-200 flex flex-wrap items-center justify-between gap-2">
            <span>
              ⚠️ FALHA NA ÚLTIMA SINCRONIZAÇÃO: {state.onlineSpreadsheet.lastError || 'Não foi possível conectar à planilha online.'}
            </span>
            <span className="text-[11px] font-black uppercase text-amber-800 dark:text-amber-300 bg-amber-200/50 dark:bg-amber-900/50 px-2.5 py-1 rounded-md">
              Exibindo Armazenamento Local
            </span>
          </div>
        )}
      </div>

      {/* Backup Automático e Proteção de Dados */}
      <div className="bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-400 dark:border-emerald-700 p-6 rounded-2xl space-y-4 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-emerald-950 dark:text-emerald-100 font-extrabold text-sm">
            <ShieldCheck className="w-5 h-5 text-emerald-700 dark:text-emerald-400 shrink-0" />
            <span>Sistema de Proteção e Backup Automático do EscalaPro</span>
          </div>
          <span className="px-2.5 py-1 bg-emerald-200 dark:bg-emerald-900 text-emerald-950 dark:text-emerald-100 text-[10px] font-black rounded-full uppercase tracking-wider border border-emerald-300 dark:border-emerald-700">
            Proteção Ativa
          </span>
        </div>

        <p className="text-xs text-slate-900 dark:text-slate-100 leading-relaxed max-w-3xl font-medium">
          Por precaução e segurança contra perdas acidentais, a aplicação cria um <strong className="text-emerald-900 dark:text-emerald-200 font-extrabold">backup automático de emergência</strong> imediatamente antes de qualquer limpeza de dados. Você também pode criar cópias manuais ou restaurar o estado salvo a qualquer momento.
        </p>

        {lastAutoBackupInfo ? (
          <div className="bg-[var(--paper)] border-2 border-emerald-500/50 p-4 rounded-xl space-y-2 text-xs shadow-2xs">
            <div className="flex flex-wrap items-center justify-between gap-2 font-black text-[var(--ink)]">
              <span className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300">
                <History className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Último Backup Automático: {lastAutoBackupInfo.formattedDate}</span>
              </span>
              <span className="text-[var(--ink)] font-bold">
                {lastAutoBackupInfo.collaboratorCount} pessoas • {lastAutoBackupInfo.taskCount} tarefas
              </span>
            </div>
            <p className="text-[11px] text-[var(--ink)] opacity-90 font-medium italic">
              Motivo do registro: {lastAutoBackupInfo.reason}
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={restoreFromAutoBackup}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white text-xs font-black rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Restaurar do Último Backup Automático</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="pt-1">
            <button
              type="button"
              onClick={() => {
                const info = createAutoBackup('Backup manual gerado via Configurações');
                if (info) {
                  showNotice(`Backup automático gerado com sucesso às ${info.formattedDate}!`);
                }
              }}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white text-xs font-black rounded-xl shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Gerar Backup de Emergência Agora</span>
            </button>
          </div>
        )}
      </div>

      {/* Export & Import Backup Section (JSON) */}
      <div className="bg-[var(--paper)] border border-[var(--line)] p-6 rounded-2xl space-y-4">
        <div className="flex items-center gap-2 text-[var(--primary)] font-bold text-sm">
          <Database className="w-5 h-5" />
          <h3 className="text-base text-[var(--ink)]">Exportar e Importar Cópia Completa (.JSON)</h3>
        </div>
        <p className="text-xs text-[var(--muted)] leading-relaxed">
          Faça download do arquivo JSON contendo toda a estrutura cadastrada, colaboradores, cargos, tarefas e a <strong>conexão completa da planilha online (com Webhook e links do Google Sheets)</strong>. Ao importar este JSON em qualquer outro computador, a sincronização estará pronta para uso imediato.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={handleExportConfig}
            className="px-4 py-2.5 bg-[var(--primary)] text-white text-xs font-bold rounded-xl hover:bg-[var(--primary-hover)] flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
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

      {/* Clear Data & Online Spreadsheet Distinction Section */}
      <div className="bg-red-50 dark:bg-red-950/30 border-2 border-red-300 dark:border-red-800 p-6 rounded-2xl space-y-6">
        <div className="flex items-center gap-2 text-red-700 dark:text-red-300 font-extrabold text-sm border-b border-red-200 dark:border-red-900/50 pb-3">
          <ShieldAlert className="w-5 h-5 shrink-0" />
          <h3 className="text-base">Gestão de Limpeza e Distinção de Armazenamento</h3>
        </div>

        {/* Informative Grid: Local vs Online distinction */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card 1: Local Data */}
          <div className="bg-[var(--paper)] border-2 border-red-300 dark:border-red-800 p-4 rounded-xl space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-red-800 dark:text-red-300 font-black text-xs uppercase tracking-wider">
                <Database className="w-4 h-4" />
                <span>1. Dados Locais do Navegador</span>
              </div>
              <p className="text-xs text-[var(--ink)] font-medium leading-relaxed">
                Apaga os colaboradores, tarefas, presença diária e históricos armazenados <strong className="text-red-900 dark:text-red-200">localmente neste navegador/dispositivo</strong>.
              </p>
              <p className="text-xs text-emerald-950 dark:text-emerald-100 font-bold bg-emerald-100 dark:bg-emerald-950/80 p-2.5 rounded-lg border-2 border-emerald-300 dark:border-emerald-700">
                ✓ Por precaução, um backup automático é gerado antes de limpar, permitindo restauração imediata se necessário.
              </p>
            </div>

            <button
              onClick={() => setResetModalOpen(true)}
              className="mt-2 w-full px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-black rounded-xl flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Limpar Apenas Dados Locais</span>
            </button>
          </div>

          {/* Card 2: Online Spreadsheet */}
          <div className="bg-[var(--paper)] border-2 border-blue-300 dark:border-blue-800 p-4 rounded-xl space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-blue-800 dark:text-blue-300 font-black text-xs uppercase tracking-wider">
                <FileSpreadsheet className="w-4 h-4" />
                <span>2. Planilha Online (Google Sheets)</span>
              </div>
              <p className="text-xs text-[var(--ink)] font-medium leading-relaxed">
                A limpeza de dados locais <strong className="text-blue-900 dark:text-blue-200">NÃO apaga a planilha online no Google Sheets</strong>, protegendo dados de outros usuários e turnos.
              </p>
              <p className="text-xs text-blue-950 dark:text-blue-100 font-bold bg-blue-100 dark:bg-blue-950/80 p-2.5 rounded-lg border-2 border-blue-300 dark:border-blue-700">
                ℹ Para desvincular a planilha online desta aplicação sem apagar dados, use o botão abaixo.
              </p>
            </div>

            {state.onlineSpreadsheet ? (
              <button
                type="button"
                onClick={disconnectOnlineSpreadsheet}
                className="mt-2 w-full px-4 py-2.5 border-2 border-blue-400 dark:border-blue-700 bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100 hover:bg-blue-100 dark:hover:bg-blue-900 text-xs font-black rounded-xl flex items-center justify-center gap-2 shadow-2xs transition-colors cursor-pointer"
              >
                <LinkIcon className="w-4 h-4" />
                <span>Desconectar Planilha Online</span>
              </button>
            ) : (
              <div className="text-xs text-[var(--muted)] font-bold italic text-center py-2">
                Nenhuma planilha online vinculada no momento.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={resetModalOpen}
        onClose={() => setResetModalOpen(false)}
        onConfirm={resetAllData}
        title="Limpar Dados Locais da Aplicação"
        description="Tem certeza de que deseja apagar os dados locais armazenados neste navegador? Um backup de emergência será gravado automaticamente antes da limpeza para permitir restauração rápida se necessário."
        confirmText="Limpar Dados Locais"
        requireKeyword="DELETAR"
      />
    </div>
  );
};
