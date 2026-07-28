import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FileSpreadsheet,
  Code2,
  Copy,
  Check,
  X,
  ExternalLink,
  ShieldAlert,
  Zap,
  Play,
  Key,
  Globe
} from 'lucide-react';
import { useApp } from '../context/AppContext';

interface AppsScriptModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const APPS_SCRIPT_CODE = `/**
 * ====================================================================
 * ESCALAPRO - GOOGLE APPS SCRIPT WEB APP INTEGRATION (v3.0)
 * Sincronização Bi-direcional + Atualização Automática de Abas
 * ====================================================================
 */

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return responseJSON({ status: 'error', message: 'Conteúdo do POST vazio' });
    }

    var contents = e.postData.contents;
    var payload = JSON.parse(contents);

    // 1. Salva o estado JSON bruto para permitir sincronização em tempo real (GET)
    PropertiesService.getScriptProperties().setProperty('APP_STATE', contents);

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    if (!ss) {
      return responseJSON({ status: 'success', message: 'Estado salvo via ScriptProperties' });
    }

    // 2. Atualiza Aba "Escala do Dia"
    if (payload.data && Array.isArray(payload.data)) {
      var sheetData = getOrCreateSheet(ss, 'Escala do Dia');
      sheetData.clear();
      var headersData = [
        ['Data', 'Matrícula', 'Nome', 'Login', 'Setor', 'Líder / Time', 'Escala', 'Cargo', 'Categoria', 'Status', 'Tarefa Alocada', 'Intervalo / Pausa']
      ];
      var rowsData = payload.data.map(function(item) {
        return [
          item.date || '',
          item.registration || '',
          item.name || '',
          item.login || '',
          item.sector || '',
          item.teamLeader || '',
          item.scale || '',
          item.role || '',
          item.category || '',
          item.status || '',
          item.task || '',
          item.interval || ''
        ];
      });
      sheetData.getRange(1, 1, 1, headersData[0].length)
        .setValues(headersData)
        .setFontWeight('bold')
        .setBackground('#10B981')
        .setFontColor('#FFFFFF');
      
      if (rowsData.length > 0) {
        sheetData.getRange(2, 1, rowsData.length, headersData[0].length).setValues(rowsData);
      }
      sheetData.autoResizeColumns(1, headersData[0].length);
    }

    // 3. Atualiza Aba "Cadastro da Equipe" (Master)
    if (payload.collaboratorsMaster && Array.isArray(payload.collaboratorsMaster)) {
      var sheetMaster = getOrCreateSheet(ss, 'Cadastro da Equipe');
      sheetMaster.clear();
      var headersMaster = [
        ['ID', 'Matrícula', 'Nome', 'Login', 'Setor', 'Gestor', 'Turno', 'Time / Líder', 'Escala', 'Cargo', 'Categoria', 'Skills / Competências', 'Status']
      ];
      var rowsMaster = payload.collaboratorsMaster.map(function(c) {
        return [
          c.id || '',
          c.registration || '',
          c.name || '',
          c.login || '',
          c.sector || '',
          c.manager || '',
          c.shift || '',
          c.teamLeader || '',
          c.scale || '',
          c.role || '',
          c.category || '',
          c.skills || '',
          c.status || ''
        ];
      });
      sheetMaster.getRange(1, 1, 1, headersMaster[0].length)
        .setValues(headersMaster)
        .setFontWeight('bold')
        .setBackground('#2563EB')
        .setFontColor('#FFFFFF');

      if (rowsMaster.length > 0) {
        sheetMaster.getRange(2, 1, rowsMaster.length, headersMaster[0].length).setValues(rowsMaster);
      }
      sheetMaster.autoResizeColumns(1, headersMaster[0].length);
    }

    // 4. Atualiza Aba "Relatórios & Absenteísmo"
    if (payload.reports) {
      var rep = payload.reports;
      var sheetRep = getOrCreateSheet(ss, 'Relatórios e Ocorrências');
      
      if (sheetRep.getLastRow() === 0) {
        var repHeaders = [['Data', 'Equipe / Setor', 'Total Equipe', 'Presentes', 'Ausentes', 'Férias', 'Licença/Treinamento', 'Folgas', 'Taxa Absenteísmo %', 'Observações', 'Atualizado Em']];
        sheetRep.getRange(1, 1, 1, repHeaders[0].length)
          .setValues(repHeaders)
          .setFontWeight('bold')
          .setBackground('#0F172A')
          .setFontColor('#FFFFFF');
      }

      var repRow = [
        rep.date || '',
        (rep.teamName || '') + ' - ' + (rep.sector || ''),
        rep.totalCollaborators || 0,
        rep.presentCount || 0,
        rep.absentCount || 0,
        rep.vacationCount || 0,
        rep.leaveTrainingCount || 0,
        rep.offCount || 0,
        rep.absenteeismRate || '0%',
        rep.generalNotes || '',
        rep.generatedAt || new Date().toLocaleString('pt-BR')
      ];
      sheetRep.appendRow(repRow);
    }

    return responseJSON({
      status: 'success',
      message: 'Dados sincronizados com sucesso na planilha!',
      updatedAt: new Date().toISOString()
    });

  } catch (err) {
    return responseJSON({ status: 'error', message: err.toString() });
  }
}

function doGet(e) {
  try {
    var rawState = PropertiesService.getScriptProperties().getProperty('APP_STATE');
    if (!rawState) {
      return responseJSON({ status: 'empty', message: 'Nenhum dado salvo ainda.' });
    }
    return ContentService.createTextOutput(rawState).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return responseJSON({ status: 'error', message: err.toString() });
  }
}

function getOrCreateSheet(ss, sheetName) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }
  return sheet;
}

function responseJSON(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
`;

export const AppsScriptModal: React.FC<AppsScriptModalProps> = ({ isOpen, onClose }) => {
  const { showNotice } = useApp();
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(APPS_SCRIPT_CODE);
    setCopied(true);
    showNotice('Código do Google Apps Script copiado para a área de transferência!');
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="bg-[var(--paper)] border border-[var(--line)] w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden my-6"
          >
            {/* Header */}
            <div className="bg-emerald-950 text-white p-5 flex items-center justify-between border-b border-emerald-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-black shadow-md">
                  <Code2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                    <span>Passo a Passo: Sincronização com Google Sheets</span>
                    <span className="px-2 py-0.5 bg-emerald-800 text-emerald-200 text-[10px] uppercase font-black rounded-md">
                      v3.0 Bi-Direcional
                    </span>
                  </h3>
                  <p className="text-xs text-emerald-200 font-medium">
                    Configure em menos de 2 minutos para conectar sua planilha como banco de dados em nuvem.
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 text-emerald-300 hover:text-white hover:bg-emerald-800/50 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              {/* Copy Script CTA Box */}
              <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
                <div>
                  <div className="text-xs font-black text-emerald-950 dark:text-emerald-100 flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Código Oficial do Integrador Apps Script</span>
                  </div>
                  <p className="text-[11px] text-emerald-800 dark:text-emerald-300 mt-0.5">
                    Copie o código completo e cole no editor do Google Sheets para criar as abas automáticas.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl flex items-center gap-2 cursor-pointer transition-all active:scale-95 shadow-sm shrink-0"
                >
                  {copied ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Código Copiado!' : 'Copiar Código do Script'}</span>
                </button>
              </div>

              {/* Step-by-step Guide */}
              <div className="space-y-4">
                <h4 className="text-xs font-extrabold text-[var(--ink)] uppercase tracking-wider border-b border-[var(--line)] pb-2">
                  Guia Ilustrado de Configuração (5 Passos Simples)
                </h4>

                <div className="space-y-3.5 text-xs text-[var(--ink)]">
                  {/* Step 1 */}
                  <div className="flex items-start gap-3 p-3.5 bg-[var(--bg)] border border-[var(--line)] rounded-xl">
                    <div className="w-6 h-6 rounded-full bg-[var(--primary)] text-white text-xs font-black flex items-center justify-center shrink-0">
                      1
                    </div>
                    <div className="space-y-1">
                      <div className="font-bold flex items-center gap-2">
                        <span>Abra sua Planilha no Google Sheets</span>
                        <a
                          href="https://sheets.new"
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-[var(--primary)] font-extrabold underline hover:no-underline"
                        >
                          <span>Criar nova no Google Sheets</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                      <p className="text-[11px] text-[var(--muted)]">
                        Crie uma planilha em branco ou abra uma planilha já existente do seu setor no Google Drive.
                      </p>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="flex items-start gap-3 p-3.5 bg-[var(--bg)] border border-[var(--line)] rounded-xl">
                    <div className="w-6 h-6 rounded-full bg-[var(--primary)] text-white text-xs font-black flex items-center justify-center shrink-0">
                      2
                    </div>
                    <div className="space-y-1">
                      <div className="font-bold">Abra o Editor do Google Apps Script</div>
                      <p className="text-[11px] text-[var(--muted)]">
                        No menu superior da sua planilha, clique em <strong className="text-[var(--ink)]">Extensões</strong> → <strong className="text-[var(--ink)]">Apps Script</strong>. Uma nova guia do navegador será aberta.
                      </p>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="flex items-start gap-3 p-3.5 bg-[var(--bg)] border border-[var(--line)] rounded-xl">
                    <div className="w-6 h-6 rounded-full bg-[var(--primary)] text-white text-xs font-black flex items-center justify-center shrink-0">
                      3
                    </div>
                    <div className="space-y-1.5 w-full">
                      <div className="font-bold flex items-center justify-between">
                        <span>Substitua o código padrão no arquivo `Código.gs`</span>
                        <button
                          onClick={handleCopyCode}
                          className="text-[11px] text-[var(--primary)] font-extrabold hover:underline cursor-pointer flex items-center gap-1"
                        >
                          <Copy className="w-3 h-3" />
                          <span>Copiar novamente</span>
                        </button>
                      </div>
                      <p className="text-[11px] text-[var(--muted)]">
                        Apague todo o texto que está no editor e cole o código copiado acima. Clique no ícone de <strong className="text-[var(--ink)]">Salvar (Ctrl + S / Cmd + S)</strong>.
                      </p>
                    </div>
                  </div>

                  {/* Step 4 - Crucial Step */}
                  <div className="flex items-start gap-3 p-3.5 bg-amber-50 dark:bg-amber-950/30 border-2 border-amber-400 dark:border-amber-800 rounded-xl">
                    <div className="w-6 h-6 rounded-full bg-amber-600 text-white text-xs font-black flex items-center justify-center shrink-0">
                      4
                    </div>
                    <div className="space-y-1.5">
                      <div className="font-black text-amber-950 dark:text-amber-100 flex items-center gap-1.5">
                        <ShieldAlert className="w-4 h-4 text-amber-600" />
                        <span>Implantar como App da Web (Atenção às permissões)</span>
                      </div>
                      <ol className="list-disc list-inside text-[11px] text-amber-900 dark:text-amber-200 space-y-1 font-medium">
                        <li>Clique em <strong className="font-black">Implantar</strong> (canto sup. direito) → <strong className="font-black">Nova implantação</strong>.</li>
                        <li>No ícone de engrenagem ⚙️ (Tipo), selecione <strong className="font-black">App da Web</strong>.</li>
                        <li>Em <strong className="font-black">Executar como</strong>: Escolha <strong className="font-black">"Eu (seu email)"</strong>.</li>
                        <li>
                          Em <strong className="font-black">Quem tem acesso</strong>: Escolha obrigatoriamente{' '}
                          <strong className="font-black bg-amber-200 dark:bg-amber-900 px-1 rounded text-amber-950 dark:text-amber-100">"Qualquer pessoa" (Anyone)</strong>.
                        </li>
                      </ol>
                    </div>
                  </div>

                  {/* Step 5 */}
                  <div className="flex items-start gap-3 p-3.5 bg-[var(--bg)] border border-[var(--line)] rounded-xl">
                    <div className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-black flex items-center justify-center shrink-0">
                      5
                    </div>
                    <div className="space-y-1">
                      <div className="font-bold">Copiar a URL do Webhook e Conectar</div>
                      <p className="text-[11px] text-[var(--muted)]">
                        Clique em <strong className="text-[var(--ink)]">Implantar</strong>, autorize o acesso à sua conta Google e copie a <strong className="text-emerald-600 dark:text-emerald-400 font-bold">URL do App da Web</strong> (começa com <code className="bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded text-[10px]">https://script.google.com/macros/s/.../exec</code>). Cole essa URL no sistema e clique em <strong>"Testar Conexão"</strong>!
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Code Viewer Box */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-[var(--ink)]">Visualização do Código Fonte (.gs)</span>
                  <button
                    onClick={handleCopyCode}
                    className="text-xs font-bold text-[var(--primary)] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar código completo</span>
                  </button>
                </div>
                <div className="relative">
                  <pre className="bg-slate-950 text-emerald-400 p-4 rounded-xl text-[11px] font-mono overflow-x-auto max-h-56 leading-relaxed border border-slate-800 select-all">
                    <code>{APPS_SCRIPT_CODE}</code>
                  </pre>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-[var(--bg)] border-t border-[var(--line)] flex items-center justify-between">
              <span className="text-xs text-[var(--muted)] font-semibold">
                Dúvidas? Verifique se a opção "Quem tem acesso" foi configurada como "Qualquer pessoa".
              </span>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 bg-[var(--primary)] text-white text-xs font-black rounded-xl hover:bg-[var(--primary-hover)] cursor-pointer shadow-xs"
              >
                Entendi / Fechar Guia
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
