import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ConfirmModal } from '../components/ConfirmModal';
import { AppsScriptModal } from '../components/AppsScriptModal';
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
} from 'lucide-react';
import { ThemeOption } from '../types';

export const SettingsView: React.FC = () => {
  const {
    state,
    setTheme,
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
  const [showAppsScriptModal, setShowAppsScriptModal] = useState(false);

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

  const themeOptions: Array<{
    id: ThemeOption;
    name: string;
    category: string;
    colorBg: string;
    colorAccent: string;
  }> = [
    { id: 'slate', name: 'Slate Blue', category: 'Claro', colorBg: '#f8fafc', colorAccent: '#1d4ed8' },
    { id: 'material-you', name: 'Material Steel', category: 'Material', colorBg: '#f4f6fa', colorAccent: '#005faf' },
    { id: 'material-teal', name: 'Material Teal', category: 'Material', colorBg: '#f2f7f6', colorAccent: '#006a60' },
    { id: 'material-terracotta', name: 'Material Warm', category: 'Material', colorBg: '#fbf7f4', colorAccent: '#a8381e' },
    { id: 'sage-matte', name: 'Sálvia Opaco', category: 'Soft', colorBg: '#f4f6f4', colorAccent: '#386641' },
    { id: 'nord-frost', name: 'Nord Frost', category: 'Soft', colorBg: '#eceff4', colorAccent: '#5e81ac' },
    { id: 'emerald', name: 'Emerald', category: 'Claro', colorBg: '#f0fdf4', colorAccent: '#047857' },
    { id: 'indigo', name: 'Indigo', category: 'Claro', colorBg: '#f5f3ff', colorAccent: '#4338ca' },
    { id: 'material-dark', name: 'Material Dark', category: 'Escuro', colorBg: '#121318', colorAccent: '#80b5ff' },
    { id: 'obsidian-dark', name: 'Obsidian', category: 'Escuro', colorBg: '#18181b', colorAccent: '#2dd4bf' },
    { id: 'dark', name: 'Dark Midnight', category: 'Escuro', colorBg: '#090d16', colorAccent: '#3b82f6' },
    { id: 'high-contrast', name: 'Alto Contraste', category: 'Acessível', colorBg: '#ffffff', colorAccent: '#000000' },
  ];

  const handleExportConfig = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `escalapro-config-${state.teamName || 'equipe'}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showNotice('Configurações completas exportadas com sucesso!');
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

  const handleAddCatalog = () => {
    const val = newCatalogInput.trim();
    if (!val) return;
    if (catalogTab === 'roles' || catalogTab === 'categories' || catalogTab === 'skills') {
      addCatalogItem(catalogTab, val);
    } else if (catalogTab === 'leaders') {
      addTeamLeader(val);
    }
    setNewCatalogInput('');
  };

  const handleSaveEditCatalog = () => {
    if (!editingItem) return;
    const { key, oldVal, newVal } = editingItem;
    if (key === 'leaders') {
      editTeamLeader(oldVal, newVal);
    } else {
      editCatalogItem(key, oldVal, newVal);
    }
    setEditingItem(null);
  };

  const handleAddBreak = () => {
    if (!newBreakTime) return;
    addBreakSlot(newBreakTime, newBreakCap || undefined);
    setNewBreakTime('20:00');
  };

  const handleSaveEditBreak = () => {
    if (!editingBreak) return;
    updateBreakSlot(editingBreak.id, {
      time: editingBreak.time,
      capacity: editingBreak.capacity || undefined,
    });
    setEditingBreak(null);
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* 1. TOP SECTION: PLANILHA COMPARTILHADA + EXPORTAR / IMPORTAR COMPLETO SIDE BY SIDE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Google Sheets Integration (8 cols) */}
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
                  Banco de dados online compartilhado com os líderes do setor.
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

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-[var(--ink)]">
                <input
                  type="checkbox"
                  checked={autoSync}
                  onChange={(e) => setAutoSync(e.target.checked)}
                  className="w-4 h-4 rounded text-[var(--primary)] focus:ring-0 cursor-pointer"
                />
                <span>Sincronização Automática em Segundo Plano</span>
              </label>

              <div className="flex items-center gap-2">
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
          </form>
        </div>

        {/* Export & Import Complete JSON (5 cols) */}
        <div className="lg:col-span-5 bg-[var(--paper)] border border-[var(--line)] p-5 rounded-2xl space-y-4 shadow-2xs flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[var(--primary)] font-extrabold text-sm border-b border-[var(--line)] pb-3">
              <Database className="w-4 h-4" />
              <h3 className="text-sm text-[var(--ink)] font-black">Exportar e Importar (.JSON)</h3>
            </div>
            <p className="text-xs text-[var(--muted)] leading-relaxed">
              Exporte todo o cadastro, regras de negócio e credenciais de sincronização em um único arquivo JSON portátil.
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
              <span>Importar Backup do Sistema (.JSON)</span>
              <input type="file" accept="application/json" onChange={handleImportConfig} className="hidden" />
            </label>
          </div>
        </div>
      </div>

      {/* 2. MÓDULOS OPCIONAIS E MENU LATERAL (DESMARCÁVEIS) */}
      <div className="bg-[var(--paper)] border border-[var(--line)] p-5 rounded-2xl space-y-3 shadow-2xs">
        <div className="flex items-center gap-2 text-[var(--primary)] font-extrabold text-sm border-b border-[var(--line)] pb-3">
          <SlidersHorizontal className="w-4 h-4" />
          <h3 className="text-sm font-black text-[var(--ink)]">Módulos Opcionais e Exibição do Menu Lateral</h3>
        </div>
        <p className="text-xs text-[var(--muted)]">
          Marque ou desmarque os módulos abaixo conforme a necessidade do seu setor para evitar opções desnecessárias no menu lateral.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <label className={`p-3.5 rounded-xl border-2 flex items-center justify-between cursor-pointer transition-all ${
            state.showBriefingSlide !== false
              ? 'border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--ink)]'
              : 'border-[var(--line)] bg-[var(--bg)] text-[var(--muted)]'
          }`}>
            <div className="flex items-center gap-3">
              <Presentation className={`w-5 h-5 ${state.showBriefingSlide !== false ? 'text-[var(--primary)]' : 'text-slate-400'}`} />
              <div>
                <div className="text-xs font-extrabold">Slide Briefing 16:9</div>
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

          <label className={`p-3.5 rounded-xl border-2 flex items-center justify-between cursor-pointer transition-all ${
            state.showEmployeePortal !== false
              ? 'border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--ink)]'
              : 'border-[var(--line)] bg-[var(--bg)] text-[var(--muted)]'
          }`}>
            <div className="flex items-center gap-3">
              <UserCheck className={`w-5 h-5 ${state.showEmployeePortal !== false ? 'text-[var(--primary)]' : 'text-slate-400'}`} />
              <div>
                <div className="text-xs font-extrabold">Portal do Colaborador</div>
                <div className="text-[10px] font-medium opacity-80">Consulta individual online de tarefa e horário de intervalo</div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={state.showEmployeePortal !== false}
              onChange={(e) => setModuleVisibility({ showEmployeePortal: e.target.checked })}
              className="w-4 h-4 rounded text-[var(--primary)] focus:ring-0 cursor-pointer"
            />
          </label>
        </div>
      </div>

      {/* 3. TEMAS COMPACTOS (MENOS DESTAQUE VISUAL) */}
      <div className="bg-[var(--paper)] border border-[var(--line)] p-4 rounded-2xl space-y-2.5 shadow-2xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[var(--primary)] font-bold text-xs">
            <Palette className="w-3.5 h-3.5" />
            <h3 className="text-xs font-extrabold text-[var(--ink)]">Ajuste de Tema Visual</h3>
          </div>
          <span className="text-[10px] text-[var(--muted)] font-medium">12 temas</span>
        </div>

        {/* Compact Pill Buttons */}
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

      {/* 5. BACKUP AUTOMÁTICO E PROTEÇÃO DE DADOS */}
      <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 p-5 rounded-2xl space-y-3 shadow-2xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-emerald-950 dark:text-emerald-100 font-extrabold text-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Sistema de Proteção e Backup Automático</span>
          </div>
          <span className="px-2 py-0.5 bg-emerald-200 dark:bg-emerald-900 text-emerald-950 dark:text-emerald-100 text-[9px] font-black uppercase rounded-full">
            Ativo
          </span>
        </div>

        {lastAutoBackupInfo ? (
          <div className="bg-[var(--paper)] border border-emerald-400 p-3 rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs">
            <div>
              <div className="font-extrabold text-[var(--ink)]">Último Backup: {lastAutoBackupInfo.formattedDate}</div>
              <div className="text-[10px] text-[var(--muted)]">{lastAutoBackupInfo.collaboratorCount} colaboradores registrados</div>
            </div>
            <button
              onClick={restoreFromAutoBackup}
              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restaurar Backup</span>
            </button>
          </div>
        ) : (
          <button
            onClick={() => {
              const info = createAutoBackup('Backup manual');
              if (info) showNotice('Backup gerado com sucesso!');
            }}
            className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Gerar Backup de Emergência Agora</span>
          </button>
        )}
      </div>

      {/* 6. LIMPEZA DE DADOS LOCAIS */}
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

      <AppsScriptModal
        isOpen={showAppsScriptModal}
        onClose={() => setShowAppsScriptModal(false)}
      />
    </div>
  );
};
