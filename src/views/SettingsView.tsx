import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ConfirmModal } from '../components/ConfirmModal';
import { AppsScriptModal } from '../components/AppsScriptModal';
import { ConfirmImportBackupModal } from '../components/ConfirmImportBackupModal';
import {
  Palette,
  Download,
  Upload,
  Trash2,
  Check,
  ShieldAlert,
  Database,
  FileSpreadsheet,
  Link as LinkIcon,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  ShieldCheck,
  RotateCcw,
  History,
  Pencil,
  Plus,
  Clock,
  Briefcase,
  Layers,
  Award,
  Users,
  Presentation,
  UserCheck,
  SlidersHorizontal,
  Code2,
  Activity,
  Copy,
  Share2,
  Zap,
} from 'lucide-react';
import { ThemeOption, AppState } from '../types';

export const SettingsView: React.FC = () => {
  const {
    state,
    setTheme,
    importFullStateWithBackup,
    resetAllData,
    showNotice,
    setOnlineSpreadsheetConfig,
    syncToOnlineSpreadsheet,
    testWebhookConnection,
    exportLocalSpreadsheet,
    generateTemplateSpreadsheet,
    lastAutoBackupInfo,
    backupHistory,
    createAutoBackup,
    restoreFromAutoBackup,
    restoreBackupById,
    deleteBackupById,
    clearBackupHistory,
    exportBackupToFile,
    generateShareableConnectionLink,
    disconnectOnlineSpreadsheet,
    addCatalogItem,
    removeCatalogItem,
    editCatalogItem,
    addTeamLeader,
    removeTeamLeader,
    editTeamLeader,
    addBreakSlot,
    updateBreakSlot,
    deleteBreakSlot,
    setModuleVisibility,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'general' | 'spreadsheet' | 'backups' | 'catalogs'>('spreadsheet');

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
  const [isTesting, setIsTesting] = useState(false);
  const [testDiag, setTestDiag] = useState<{ success: boolean; message: string; details?: string } | null>(null);
  const [showAppsScriptModal, setShowAppsScriptModal] = useState(false);
  const [copiedShareLink, setCopiedShareLink] = useState(false);

  // Safe import modal state
  const [pendingImportData, setPendingImportData] = useState<Partial<AppState> | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Catalog editing state
  const [catalogTab, setCatalogTab] = useState<'roles' | 'categories' | 'skills' | 'breaks' | 'leaders'>('roles');
  const [newCatalogInput, setNewCatalogInput] = useState('');
  const [editingItem, setEditingItem] = useState<{ key: 'roles' | 'categories' | 'skills' | 'leaders'; oldVal: string; newVal: string } | null>(null);
  const [newBreakTime, setNewBreakTime] = useState('20:00');
  const [newBreakCap, setNewBreakCap] = useState<number>(10);
  const [editingBreak, setEditingBreak] = useState<{ id: string; time: string; capacity: number } | null>(null);

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

  const handleCopyShareConnectionLink = () => {
    const link = generateShareableConnectionLink();
    navigator.clipboard.writeText(link);
    setCopiedShareLink(true);
    showNotice('Link direto de conexão em nuvem copiado com sucesso! Compartilhe com os colegas de turno.');
    setTimeout(() => setCopiedShareLink(false), 2500);
  };

  const themeOptions: Array<{
    id: ThemeOption;
    name: string;
    category: string;
    colorBg: string;
    colorAccent: string;
  }> = [
    { id: 'emerald', name: 'Verde Esmeralda', category: 'Padrão', colorBg: '#f0fdf4', colorAccent: '#047857' },
    { id: 'slate', name: 'Azul Corporativo', category: 'Claro', colorBg: '#f8fafc', colorAccent: '#1d4ed8' },
    { id: 'indigo', name: 'Índigo Elegante', category: 'Claro', colorBg: '#f5f3ff', colorAccent: '#4338ca' },
    { id: 'teal', name: 'Menta & Teal', category: 'Refrescante', colorBg: '#f2f7f6', colorAccent: '#006a60' },
    { id: 'terracotta', name: 'Areia & Terracota', category: 'Editorial Warm', colorBg: '#fbf7f4', colorAccent: '#a8381e' },
    { id: 'obsidian', name: 'Obsidian Dark', category: 'Modo Escuro', colorBg: '#18181b', colorAccent: '#2dd4bf' },
  ];

  const handleExportConfig = () => {
    exportBackupToFile();
  };

  const handleSelectImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const json = JSON.parse(evt.target?.result as string);
        setPendingImportData(json);
        setIsImportModalOpen(true);
      } catch (err) {
        showNotice('Arquivo JSON inválido.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleConfirmImport = (mode: 'full' | 'config_only', createSafetyBackup: boolean) => {
    if (pendingImportData) {
      importFullStateWithBackup(pendingImportData, mode, createSafetyBackup);
      setPendingImportData(null);
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Settings Navigation Tabs */}
      <div className="bg-[var(--paper)] border border-[var(--line)] p-2 rounded-2xl flex flex-wrap items-center justify-between gap-2 shadow-2xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setActiveTab('spreadsheet')}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'spreadsheet'
                ? 'bg-[var(--primary)] text-white shadow-2xs'
                : 'text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--bg)]'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Planilha & Webhook Nuvem</span>
          </button>

          <button
            onClick={() => setActiveTab('backups')}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'backups'
                ? 'bg-amber-600 text-white shadow-2xs'
                : 'text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--bg)]'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Opções Avançadas & Gestão de Backups</span>
            {backupHistory.length > 0 && (
              <span className="px-1.5 py-0.2 bg-white/20 text-white text-[10px] font-black rounded-full">
                {backupHistory.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('general')}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'general'
                ? 'bg-[var(--primary)] text-white shadow-2xs'
                : 'text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--bg)]'
            }`}
          >
            <Palette className="w-4 h-4" />
            <span>Aparência, Temas & Módulos</span>
          </button>
        </div>

        <button
          onClick={handleCopyShareConnectionLink}
          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
          title="Gera um link com credenciais da planilha prontas para colegas se conectarem sem trocar arquivos JSON"
        >
          {copiedShareLink ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
          <span>{copiedShareLink ? 'Link Copiado!' : 'Compartilhar Conexão em Nuvem'}</span>
        </button>
      </div>

      {/* TAB 1: PLANILHA & WEBHOOK NUVEM */}
      {activeTab === 'spreadsheet' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Google Sheets Integration (7 cols) */}
          <div className="lg:col-span-7 bg-[var(--paper)] border border-[var(--line)] p-5 rounded-2xl space-y-4 shadow-2xs">
            <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-[var(--ink)]">
                    Conectar Planilha Compartilhada (Google Sheets)
                  </h3>
                  <p className="text-[11px] text-[var(--muted)]">
                    Banco de dados online compartilhado em tempo real com os líderes do setor.
                  </p>
                </div>
              </div>
              {state.onlineSpreadsheet && (
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200 text-[10px] font-black uppercase rounded-md border border-emerald-300">
                  Conectado
                </span>
              )}
            </div>

            <form onSubmit={handleSaveSpreadsheetConfig} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[var(--ink)] mb-1">
                    Nome do Banco / Planilha
                  </label>
                  <input
                    type="text"
                    value={sheetName}
                    onChange={(e) => setSheetName(e.target.value)}
                    className="w-full bg-[var(--bg)] border border-[var(--line)] rounded-lg px-3 py-1.5 font-semibold text-[var(--ink)]"
                    placeholder="Ex: Planilha de Turnos T2"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[var(--ink)] mb-1">
                    Link de Acesso (URL)
                  </label>
                  <input
                    type="url"
                    value={sheetUrl}
                    onChange={(e) => setSheetUrl(e.target.value)}
                    className="w-full bg-[var(--bg)] border border-[var(--line)] rounded-lg px-3 py-1.5 font-semibold text-[var(--ink)]"
                    placeholder="https://docs.google.com/spreadsheets/d/..."
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <label className="block text-[11px] font-bold text-[var(--ink)]">
                    Webhook / Script URL (Google Apps Script)
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowAppsScriptModal(true)}
                    className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black rounded-md flex items-center gap-1 cursor-pointer shadow-2xs"
                  >
                    <Code2 className="w-3 h-3" />
                    <span>Ver Passo a Passo & Copiar Código</span>
                  </button>
                </div>
                <input
                  type="text"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  className="w-full bg-[var(--bg)] border border-[var(--line)] rounded-lg px-3 py-1.5 font-mono text-[11px] text-[var(--ink)]"
                  placeholder="https://script.google.com/macros/s/.../exec"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[var(--line)] pt-3">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-[var(--ink)]">
                  <input
                    type="checkbox"
                    checked={autoSync}
                    onChange={(e) => setAutoSync(e.target.checked)}
                    className="w-4 h-4 rounded text-[var(--primary)] focus:ring-0 cursor-pointer"
                  />
                  <span>Sincronização Automática em Segundo Plano</span>
                </label>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      setIsTesting(true);
                      setTestDiag(null);
                      if (sheetName.trim() && sheetUrl.trim()) {
                        setOnlineSpreadsheetConfig({
                          name: sheetName.trim(),
                          url: sheetUrl.trim(),
                          webhookUrl: webhookUrl.trim() || undefined,
                          autoSyncEnabled: autoSync,
                          lastSyncedAt: state.onlineSpreadsheet?.lastSyncedAt || '',
                          syncCount: state.onlineSpreadsheet?.syncCount || 0,
                        });
                      }
                      const res = await testWebhookConnection(webhookUrl);
                      setTestDiag(res);
                      setIsTesting(false);
                    }}
                    disabled={isTesting || !webhookUrl.trim()}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-black rounded-lg flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors shadow-2xs"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                    <span>{isTesting ? 'Testando...' : 'Testar Conexão'}</span>
                  </button>

                  {state.onlineSpreadsheet && (
                    <button
                      type="button"
                      onClick={handleSyncNow}
                      disabled={isSyncing}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                      <span>Sincronizar Agora</span>
                    </button>
                  )}
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                  >
                    Salvar Conexão
                  </button>
                </div>
              </div>

              {testDiag && (
                <div className={`p-3 rounded-xl text-xs border ${
                  testDiag.success
                    ? 'bg-emerald-50 text-emerald-950 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-100 dark:border-emerald-800'
                    : 'bg-rose-50 text-rose-950 border-rose-300 dark:bg-rose-950/60 dark:text-rose-100 dark:border-rose-800'
                }`}>
                  <div className="font-black flex items-center gap-1.5 mb-0.5">
                    {testDiag.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <ShieldAlert className="w-4 h-4 text-rose-600" />}
                    <span>{testDiag.message}</span>
                  </div>
                  {testDiag.details && (
                    <p className="text-[11px] opacity-90 pl-5 leading-relaxed">
                      {testDiag.details}
                    </p>
                  )}
                </div>
              )}
            </form>
          </div>

          {/* Safe Export & Import Box (5 cols) */}
          <div className="lg:col-span-5 bg-[var(--paper)] border border-[var(--line)] p-5 rounded-2xl space-y-4 shadow-2xs flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[var(--primary)] font-extrabold text-sm border-b border-[var(--line)] pb-3">
                <Database className="w-4 h-4" />
                <h3 className="text-sm text-[var(--ink)] font-black">Exportar e Importar Seguros (.JSON)</h3>
              </div>
              <p className="text-xs text-[var(--muted)] leading-relaxed">
                Exporte todo o cadastro, regras de negócio e credenciais em arquivo JSON portátil. Ao importar, você poderá escolher entre atualizar apenas as regras ou realizar restauração completa com backup automático.
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={handleExportConfig}
                className="w-full px-3.5 py-2.5 bg-[var(--primary)] text-white text-xs font-bold rounded-xl hover:bg-[var(--primary-hover)] flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Exportar Backup do Sistema (.JSON)</span>
              </button>

              <label className="w-full cursor-pointer px-3.5 py-2.5 border border-[var(--line)] text-xs font-bold rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center gap-2 text-[var(--ink)] transition-colors">
                <Upload className="w-4 h-4 text-[var(--muted)]" />
                <span>Importar Backup (.JSON) com Alerta de Segurança</span>
                <input type="file" accept="application/json" onChange={handleSelectImportFile} className="hidden" />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: OPÇÕES AVANÇADAS & GESTÃO DE BACKUPS */}
      {activeTab === 'backups' && (
        <div className="space-y-4">
          {/* Header Banner */}
          <div className="bg-amber-500/10 border border-amber-500/30 p-5 rounded-2xl flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow-xs shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-[var(--ink)]">
                  Central de Segurança, Diagnósticos e Gestão de Backups
                </h3>
                <p className="text-xs text-[var(--muted)] font-semibold">
                  Proteja sua operação contra perdas acidentais de dados durante importações e trocas de turno.
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                const info = createAutoBackup('Backup de Emergência Manual');
                if (info) showNotice('Novo ponto de restauração criado com sucesso!');
              }}
              className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-black rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Criar Ponto de Restauração Manual Agora</span>
            </button>
          </div>

          {/* Backup History Table */}
          <div className="bg-[var(--paper)] border border-[var(--line)] p-5 rounded-2xl space-y-4 shadow-2xs">
            <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
              <div className="flex items-center gap-2 text-[var(--ink)] font-extrabold text-sm">
                <History className="w-4 h-4 text-amber-600" />
                <span>Histórico de Pontos de Restauração Salvos (Local & Nuvem)</span>
              </div>
              {backupHistory.length > 0 && (
                <button
                  onClick={clearBackupHistory}
                  className="text-[11px] font-bold text-red-600 hover:underline cursor-pointer"
                >
                  Limpar Histórico de Backups
                </button>
              )}
            </div>

            {backupHistory.length === 0 ? (
              <div className="p-8 text-center text-[var(--muted)] text-xs space-y-2 bg-[var(--bg)] rounded-xl border border-[var(--line)]">
                <ShieldCheck className="w-8 h-8 mx-auto text-amber-500 opacity-60" />
                <p className="font-bold text-[var(--ink)]">Nenhum ponto de restauração manual criado ainda.</p>
                <p className="text-[11px]">
                  O sistema gera pontos de restauração automaticamente antes de limpezas ou importações.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[var(--line)] bg-[var(--bg)] text-[var(--muted)] uppercase font-black text-[10px]">
                      <th className="p-3">Data e Hora</th>
                      <th className="p-3">Motivo / Origem</th>
                      <th className="p-3">Equipe / Qtd Colaboradores</th>
                      <th className="p-3 text-right">Ações de Segurança</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--line)]">
                    {backupHistory.map((snap) => (
                      <tr key={snap.id} className="hover:bg-[var(--bg)]/50 transition-colors">
                        <td className="p-3 font-bold text-[var(--ink)] whitespace-nowrap">
                          {snap.formattedDate}
                        </td>
                        <td className="p-3 font-semibold text-[var(--ink)]">
                          <span className="px-2 py-0.5 bg-amber-500/10 text-amber-800 dark:text-amber-200 border border-amber-500/20 rounded-md font-mono text-[11px]">
                            {snap.reason}
                          </span>
                        </td>
                        <td className="p-3 text-[var(--muted)]">
                          <strong className="text-[var(--ink)]">{snap.teamName || 'Equipe'}</strong> ({snap.collaboratorCount} colaboradores)
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => restoreBackupById(snap.id)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
                              title="Restaurar este ponto de backup"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Restaurar</span>
                            </button>
                            <button
                              onClick={() => exportBackupToFile(snap)}
                              className="p-1.5 bg-[var(--bg)] border border-[var(--line)] hover:bg-[var(--paper)] text-[var(--ink)] rounded-lg text-[11px] cursor-pointer"
                              title="Baixar JSON deste ponto"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => deleteBackupById(snap.id)}
                              className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg cursor-pointer"
                              title="Excluir do histórico"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Share Connection Link */}
          <div className="bg-[var(--paper)] border border-[var(--line)] p-5 rounded-2xl space-y-3 shadow-2xs">
            <div className="flex items-center gap-2 text-[var(--ink)] font-black text-sm border-b border-[var(--line)] pb-3">
              <Share2 className="w-4 h-4 text-emerald-600" />
              <span>Link Direto de Compartilhamento de Equipe (Evita Sobrescrever Dados)</span>
            </div>
            <p className="text-xs text-[var(--muted)] leading-relaxed">
              Em vez de enviar arquivos JSON de backup por e-mail, compartilhe o link direto abaixo com outros gestores. Ao abrir, o colega conecta o aplicativo à mesma planilha do Google Sheets de forma limpa e sem risco de perda de registros!
            </p>
            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                readOnly
                value={generateShareableConnectionLink()}
                className="flex-1 bg-[var(--bg)] border border-[var(--line)] px-3 py-2 rounded-xl font-mono text-xs text-[var(--ink)] select-all"
              />
              <button
                onClick={handleCopyShareConnectionLink}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-2xs shrink-0"
              >
                {copiedShareLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedShareLink ? 'Copiado!' : 'Copiar Link'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: APARÊNCIA, TEMAS & MÓDULOS */}
      {activeTab === 'general' && (
        <div className="space-y-4">
          <div className="bg-[var(--paper)] border border-[var(--line)] p-5 rounded-2xl space-y-3 shadow-2xs">
            <div className="flex items-center gap-2 text-[var(--primary)] font-extrabold text-sm border-b border-[var(--line)] pb-3">
              <SlidersHorizontal className="w-4 h-4" />
              <h3 className="text-sm font-black text-[var(--ink)]">Módulos Opcionais e Exibição do Menu Lateral</h3>
            </div>
            <p className="text-xs text-[var(--muted)]">
              Marque ou desmarque os módulos abaixo conforme a necessidade do seu setor para evitar opções desnecessárias no menu lateral.
            </p>

            <div className="grid grid-cols-1 gap-3 pt-1">
              <label className={`p-3.5 rounded-xl border-2 flex items-center justify-between cursor-pointer transition-all ${
                state.showBriefingSlide !== false
                  ? 'border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--ink)]'
                  : 'border-[var(--line)] bg-[var(--bg)] text-[var(--muted)]'
              }`}>
                <div className="flex items-center gap-3">
                  <Presentation className={`w-5 h-5 ${state.showBriefingSlide !== false ? 'text-[var(--primary)]' : 'text-slate-400'}`} />
                  <div>
                    <div className="text-xs font-extrabold">Montagem de Slide</div>
                    <div className="text-[10px] font-medium opacity-80">Apresentação para passagens de turno e reuniões de alinhamento</div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={state.showBriefingSlide !== false}
                  onChange={(e) => setModuleVisibility({ showBriefingSlide: e.target.checked })}
                  className="w-4 h-4 rounded text-[var(--primary)] focus:ring-0 cursor-pointer"
                />
              </label>
            </div>
          </div>

          <div className="bg-[var(--paper)] border border-[var(--line)] p-4 rounded-2xl space-y-2.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[var(--primary)] font-bold text-xs">
                <Palette className="w-3.5 h-3.5" />
                <h3 className="text-xs font-extrabold text-[var(--ink)]">Ajuste de Tema Visual</h3>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              {themeOptions.map((t) => {
                const isSelected = state.theme === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setTheme(t.id)}
                    className={`px-2.5 py-1 rounded-lg border text-[11px] font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary)] shadow-2xs'
                        : 'border-[var(--line)] hover:border-slate-400 bg-[var(--bg)] text-[var(--ink)]'
                    }`}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full border border-slate-300 shrink-0"
                      style={{ backgroundColor: t.colorAccent }}
                    />
                    <span>{t.name}</span>
                    {isSelected && <Check className="w-3 h-3 text-[var(--primary)] shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* DANGER ZONE RESET */}
      <div className="bg-red-50 dark:bg-red-950/20 border border-red-300 dark:border-red-900/50 p-5 rounded-2xl space-y-3">
        <div className="flex items-center justify-between border-b border-red-200 dark:border-red-900/50 pb-2">
          <div className="flex items-center gap-2 text-red-700 dark:text-red-300 font-extrabold text-xs">
            <ShieldAlert className="w-4 h-4" />
            <span>Gestão de Limpeza e Reset Local</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
          <p className="text-xs text-red-900 dark:text-red-200 font-medium max-w-xl">
            A limpeza remove os dados salvos neste navegador sem alterar a planilha online conectada ao Google Sheets.
          </p>

          <button
            onClick={() => setResetModalOpen(true)}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer shrink-0"
          >
            <Trash2 className="w-4 h-4" />
            <span>Limpar Dados Locais</span>
          </button>
        </div>
      </div>

      <ConfirmModal
        isOpen={resetModalOpen}
        onClose={() => setResetModalOpen(false)}
        onConfirm={resetAllData}
        title="Limpar Dados Locais da Aplicação"
        description="Tem certeza de que deseja apagar os dados locais? Um backup automático será gerado antes da limpeza."
        confirmText="Limpar Dados Locais"
        requireKeyword="DELETAR"
      />

      <ConfirmImportBackupModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        importedData={pendingImportData}
        currentCollaboratorCount={state.collaborators.length}
        currentTeamName={state.teamName}
        onConfirmImport={handleConfirmImport}
      />

      <AppsScriptModal
        isOpen={showAppsScriptModal}
        onClose={() => setShowAppsScriptModal(false)}
      />
    </div>
  );
};
