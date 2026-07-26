import React, { useState } from 'react';
import {
  HelpCircle,
  FileSpreadsheet,
  Users,
  CheckSquare,
  Shuffle,
  Clock,
  Share2,
  FileText,
  Settings,
  Calendar,
  CheckCircle2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Download,
  Database,
  Link as LinkIcon,
  Sparkles,
  ShieldAlert,
  Smartphone,
  Copy,
  Code,
  Check,
  ArrowRight,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

interface HelpViewProps {
  onOpenTutorial?: () => void;
}

export const HelpView: React.FC<HelpViewProps> = ({ onOpenTutorial }) => {
  const { state, generateTemplateSpreadsheet, exportLocalSpreadsheet, exportTeamRosterSpreadsheet, showNotice } = useApp();
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [copiedScript, setCopiedScript] = useState(false);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const appsScriptCode = `function doPost(e) {
  try {
    var contents = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var timestamp = new Date().toLocaleString("pt-BR");
    
    // -------------------------------------------------------------
    // 1. ABA DE ESCALA DIÁRIA (Colaboradores, Presença, Tarefa e Refeição)
    // -------------------------------------------------------------
    var sheetEscala = ss.getSheetByName("Escala Diária") || ss.insertSheet("Escala Diária");
    
    // Cria os cabeçalhos se a aba estiver vazia
    if (sheetEscala.getLastRow() === 0) {
      sheetEscala.appendRow([
        "Data da Escala", 
        "RE (Matrícula)", 
        "Nome do Colaborador", 
        "LDAP / Login", 
        "Setor", 
        "Gestor", 
        "Turno", 
        "Team Leader", 
        "Escala", 
        "Cargo", 
        "Categoria", 
        "Status no Dia", 
        "Tarefa Alocada", 
        "Horário de Intervalo",
        "Última Atualização"
      ]);
      sheetEscala.getRange(1, 1, 1, 15).setFontWeight("bold").setBackground("#dbeafe");
    }
    
    // Adiciona os registros dos colaboradores no dia
    if (contents.data && contents.data.length > 0) {
      contents.data.forEach(function(item) {
        sheetEscala.appendRow([
          item.date || contents.date || "",
          item.registration || "",
          item.name || "",
          item.login || "",
          item.sector || contents.sector || "",
          item.manager || contents.manager || "",
          item.shift || contents.shift || "",
          item.teamLeader || "",
          item.scale || "",
          item.role || "",
          item.category || "",
          item.status || "",
          item.task || "",
          item.interval || "",
          timestamp
        ]);
      });
    }
    
    // -------------------------------------------------------------
    // 2. ABA SEPARADA: RELATÓRIO DE ABSENTEÍSMO E FALTAS
    // -------------------------------------------------------------
    if (contents.reports) {
      var sheetReport = ss.getSheetByName("Relatório de Absenteísmo") || ss.insertSheet("Relatório de Absenteísmo");
      
      // Cabeçalhos de resumo
      if (sheetReport.getLastRow() === 0) {
        sheetReport.appendRow(["RELATÓRIO DIÁRIO DE ABSENTEÍSMO E OCORRÊNCIAS"]);
        sheetReport.getRange("A1").setFontWeight("bold").setFontSize(13);
        sheetReport.appendRow([
          "Data", "Total Equipe", "Presentes", "Faltas/Ausentes", "Férias", 
          "Licença/Treinamento", "Folgas", "Taxa de Absenteísmo", "Observações Gerais", "Gerado Em"
        ]);
        sheetReport.getRange(2, 1, 1, 10).setFontWeight("bold").setBackground("#fef3c7");
      }
      
      // Linha de resumo do relatório
      var r = contents.reports;
      sheetReport.appendRow([
        r.date || "",
        r.totalCollaborators || 0,
        r.presentCount || 0,
        r.absentCount || 0,
        r.vacationCount || 0,
        r.leaveTrainingCount || 0,
        r.offCount || 0,
        r.absenteeismRate || "0%",
        r.generalNotes || "",
        r.generatedAt || timestamp
      ]);
      
      // Adiciona detalhamento de ausências/ocorrências se houver
      if (r.absencesAndOccurrences && r.absencesAndOccurrences.length > 0) {
        sheetReport.appendRow([]);
        sheetReport.appendRow(["DETALHAMENTO DAS AUSÊNCIAS E OCORRÊNCIAS (" + (r.date || "") + ")"]);
        sheetReport.getRange(sheetReport.getLastRow(), 1).setFontWeight("bold");
        
        sheetReport.appendRow([
          "Data", "RE", "Nome", "LDAP", "Cargo", "Categoria", "Team Leader", 
          "Status", "Justificativa / Motivo da Ausência", "Ocorrência Registrada"
        ]);
        sheetReport.getRange(sheetReport.getLastRow(), 1, 1, 10).setFontWeight("bold").setBackground("#e5e7eb");
        
        r.absencesAndOccurrences.forEach(function(item) {
          sheetReport.appendRow([
            item.date || "",
            item.registration || "",
            item.name || "",
            item.login || "",
            item.role || "",
            item.category || "",
            item.teamLeader || "",
            item.status || "",
            item.absenceReason || "",
            item.occurrence || ""
          ]);
        });
        sheetReport.appendRow([]); // Linha separadora
      }
    }
    
    // -------------------------------------------------------------
    // 3. ABA DE CONFIGURAÇÕES DO SISTEMA (Parâmetros, Cargos e Estrutura)
    // -------------------------------------------------------------
    if (contents.settings) {
      var sheetConfig = ss.getSheetByName("Configurações do Sistema") || ss.insertSheet("Configurações do Sistema");
      sheetConfig.clear(); // Atualiza com os valores mais recentes
      
      sheetConfig.appendRow(["CONFIGURAÇÕES E ESTRUTURA DO SISTEMA - ESCALAPRO"]);
      sheetConfig.getRange("A1").setFontWeight("bold").setFontSize(13);
      
      sheetConfig.appendRow(["Parâmetro", "Valor Configurado"]);
      sheetConfig.getRange(2, 1, 1, 2).setFontWeight("bold").setBackground("#f3f4f6");
      
      sheetConfig.appendRow(["Nome da Equipe", contents.settings.teamName || ""]);
      sheetConfig.appendRow(["Setor / Operação", contents.settings.sector || ""]);
      sheetConfig.appendRow(["Gestor Responsável", contents.settings.manager || ""]);
      sheetConfig.appendRow(["Turno Geral", contents.settings.teamShift || ""]);
      sheetConfig.appendRow(["Líder de Equipe Padrão", contents.settings.defaultTeamLeader || ""]);
      sheetConfig.appendRow(["Planilha Conectada", contents.settings.onlineSpreadsheetName || "Não informada"]);
      sheetConfig.appendRow(["URL do Google Sheets", contents.settings.onlineSpreadsheetUrl || "Não informada"]);
      sheetConfig.appendRow(["Endpoint Webhook (Apps Script)", contents.settings.onlineWebhookUrl || "Não informado"]);
      sheetConfig.appendRow(["Auto-Sync em Tempo Real", contents.settings.autoSyncEnabled || "Sim"]);
      sheetConfig.appendRow(["Total de Colaboradores", contents.settings.totalCollaborators || 0]);
      sheetConfig.appendRow(["Última Sincronização", timestamp]);
      
      sheetConfig.appendRow([]);
      sheetConfig.appendRow(["Estrutura de Cadastro", "Itens Cadastrados"]);
      sheetConfig.getRange(10, 1, 1, 2).setFontWeight("bold").setBackground("#f3f4f6");
      sheetConfig.appendRow(["Cargos", (contents.settings.roles || []).join(", ")]);
      sheetConfig.appendRow(["Categorias", (contents.settings.categories || []).join(", ")]);
      sheetConfig.appendRow(["Escalas / Turmas", (contents.settings.scales || []).join(", ")]);
      sheetConfig.appendRow(["Líderes de Equipe", (contents.settings.teamLeaders || []).join(", ")]);
      sheetConfig.appendRow(["Motivos de Ausência", (contents.settings.reasons || []).join(", ")]);
      
      sheetConfig.appendRow([]);
      sheetConfig.appendRow(["Tarefas Operacionais Cadastradas"]);
      sheetConfig.getRange(17, 1).setFontWeight("bold");
      sheetConfig.appendRow(["ID da Tarefa", "Nome da Tarefa", "Membros Alocados"]);
      if (contents.settings.tasks && contents.settings.tasks.length > 0) {
        contents.settings.tasks.forEach(function(t) {
          sheetConfig.appendRow([t.id, t.name, t.membersCount || 0]);
        });
      }
      
      sheetConfig.appendRow([]);
      sheetConfig.appendRow(["Horários de Refeição e Intervalo"]);
      sheetConfig.appendRow(["ID do Slot", "Horário de Intervalo", "Turno"]);
      if (contents.settings.breaks && contents.settings.breaks.length > 0) {
        contents.settings.breaks.forEach(function(b) {
          sheetConfig.appendRow([b.id, b.time, b.shift || "Geral"]);
        });
      }
    }
    
    return ContentService.createTextOutput(
      JSON.stringify({ status: "success", message: "Escala e Configurações sincronizadas no Google Sheets!" })
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(
      JSON.stringify({ status: "error", error: err.toString() })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}`;

  const handleCopyScript = () => {
    navigator.clipboard.writeText(appsScriptCode);
    setCopiedScript(true);
    showNotice('Código do Google Apps Script copiado para a área de transferência!');
    setTimeout(() => setCopiedScript(false), 2500);
  };

  return (
    <div className="space-y-3 max-w-6xl mx-auto animate-in fade-in duration-200">
      {/* Hero Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 text-white p-4 rounded-xl shadow-2xs relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative z-10 space-y-1 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-white/10 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-wider text-blue-200 border border-white/15">
            <HelpCircle className="w-3.5 h-3.5 text-blue-300" />
            <span>Guia Oficial de Uso & Documentação</span>
          </div>
          <h2 className="text-lg font-black tracking-tight leading-tight">
            Central de Ajuda & Guia Completo
          </h2>
          <p className="text-xs text-blue-100 font-medium">
            Ferramentas de dimensionamento por Turno (T1 a T5), gestão de presença, portal do colaborador, cargos e skills.
          </p>
        </div>

        {onOpenTutorial && (
          <div className="relative z-10 shrink-0">
            <button
              onClick={onOpenTutorial}
              className="px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black rounded-lg shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer border border-emerald-400"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Tutorial Interativo</span>
            </button>
          </div>
        )}
      </div>

      {/* Featured Section: Complete Step-by-Step Google Sheets & Webhook Guide */}
      <div className="bg-[var(--paper)] border-2 border-emerald-500/40 dark:border-emerald-500/30 p-6 sm:p-8 rounded-2xl shadow-sm space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--line)] pb-5">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shrink-0">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-black text-[var(--ink)]">
                  Guia de Integração: Google Sheets & Webhook Automático
                </h3>
                <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800 rounded-md text-[10px] font-black uppercase">
                  Passo a Passo Oficial
                </span>
              </div>
              <p className="text-xs text-[var(--muted)] font-medium mt-0.5">
                Aprenda a baixar o modelo, converter no Google Sheets, preencher os dados, compartilhar o link correto e integrar via Webhook.
              </p>
            </div>
          </div>

          {state.collaborators.length > 0 ? (
            <button
              onClick={exportTeamRosterSpreadsheet}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl flex items-center gap-2 shadow-xs transition-colors shrink-0 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Gerar Planilha da Equipe ({state.collaborators.length} .CSV)</span>
            </button>
          ) : (
            <button
              onClick={generateTemplateSpreadsheet}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl flex items-center gap-2 shadow-xs transition-colors shrink-0 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>1. Baixar Modelo (.CSV)</span>
            </button>
          )}
        </div>

        {/* Step-by-Step Vertical List */}
        <div className="space-y-6">
          {/* STEP 1 */}
          <div className="bg-[var(--bg)] border border-[var(--line)] p-5 rounded-2xl space-y-3 relative overflow-hidden">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-xl bg-emerald-600 text-white font-black text-xs flex items-center justify-center shadow-xs shrink-0">
                1
              </span>
              <h4 className="text-sm font-black text-[var(--ink)] uppercase tracking-wide">
                Baixar ou Exportar a Planilha de Dados (.CSV)
              </h4>
            </div>
            <p className="text-xs text-[var(--muted)] leading-relaxed pl-11">
              {state.collaborators.length > 0
                ? `Como você já possui ${state.collaborators.length} colaborador(es) cadastrado(s) na aplicação, clique no botão abaixo para exportar o arquivo pré-preenchido com a sua equipe real!`
                : 'O EscalaPro disponibiliza um arquivo modelo pré-formatado em formato .CSV contendo todas as colunas necessárias para o dimensionamento perfeito da equipe.'}
            </p>
            <div className="pl-11 pt-1 flex flex-wrap items-center gap-2.5">
              {state.collaborators.length > 0 && (
                <button
                  onClick={exportTeamRosterSpreadsheet}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-xl flex items-center gap-2 shadow-2xs transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Exportar Minha Equipe Cadastrada ({state.collaborators.length} Colaboradores .CSV)</span>
                </button>
              )}
              <button
                onClick={generateTemplateSpreadsheet}
                className={`px-3.5 py-2 text-xs font-bold rounded-xl flex items-center gap-2 shadow-2xs transition-colors cursor-pointer ${
                  state.collaborators.length > 0
                    ? 'border border-[var(--line)] bg-[var(--paper)] text-[var(--ink)] hover:bg-[var(--bg)]'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}
              >
                <Download className="w-3.5 h-3.5" />
                <span>Baixar Modelo Em Branco (.CSV)</span>
              </button>
            </div>
            <div className="pl-11 pt-1 text-[11px] text-[var(--muted)] bg-[var(--paper)] p-3 rounded-xl border border-[var(--line)] font-mono">
              <strong>Estrutura de Colunas:</strong> RE (Matrícula), Nome, LDAP, Setor, Gestor, Turno, Team Leader, Escala, Cargo, Categoria, Observações
            </div>
          </div>

          {/* STEP 2 */}
          <div className="bg-[var(--bg)] border border-[var(--line)] p-5 rounded-2xl space-y-3 relative overflow-hidden">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-xl bg-emerald-600 text-white font-black text-xs flex items-center justify-center shadow-xs shrink-0">
                2
              </span>
              <h4 className="text-sm font-black text-[var(--ink)] uppercase tracking-wide">
                Converter o Arquivo CSV para Planilha do Google Sheets
              </h4>
            </div>
            <div className="pl-11 space-y-2 text-xs text-[var(--muted)] leading-relaxed">
              <ol className="list-decimal pl-4 space-y-1.5">
                <li>
                  Acesse o <strong>Google Drive</strong> (<a href="https://drive.google.com" target="_blank" rel="noopener noreferrer" className="text-[var(--primary)] underline font-bold">drive.google.com</a>) ou abra uma nova planilha no <strong>Google Sheets</strong> (<a href="https://sheets.new" target="_blank" rel="noopener noreferrer" className="text-[var(--primary)] underline font-bold">sheets.new</a>).
                </li>
                <li>
                  No menu superior da planilha, clique em <strong>Arquivo (File)</strong> ➔ <strong>Importar (Import)</strong>.
                </li>
                <li>
                  Vá até a aba <strong>Fazer upload (Upload)</strong> e selecione o arquivo <code className="bg-[var(--paper)] px-1.5 py-0.5 rounded border border-[var(--line)] font-mono text-[11px]">.csv</code> baixado no Passo 1.
                </li>
                <li>
                  Em <i>"Local de importação"</i>, escolha <strong>Substituir planilha</strong> ou <strong>Criar nova planilha</strong>. Em <i>"Tipo de separador"</i>, selecione <strong>Detectar automaticamente</strong>.
                </li>
                <li>
                  Clique em <strong>Importar dados</strong>. Pronto! O CSV será convertido em uma planilha Google Sheets nativa.
                </li>
              </ol>
            </div>
          </div>

          {/* STEP 3 */}
          <div className="bg-[var(--bg)] border border-[var(--line)] p-5 rounded-2xl space-y-3 relative overflow-hidden">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-xl bg-emerald-600 text-white font-black text-xs flex items-center justify-center shadow-xs shrink-0">
                3
              </span>
              <h4 className="text-sm font-black text-[var(--ink)] uppercase tracking-wide">
                Como Preencher os Dados da Sua Equipe Corretamente
              </h4>
            </div>
            <div className="pl-11 space-y-2 text-xs text-[var(--muted)] leading-relaxed">
              <p>Siga as boas práticas de preenchimento para garantir que o sistema leia a planilha sem erros:</p>
              <ul className="list-disc pl-4 space-y-1">
                <li><strong>RE (Matrícula):</strong> Código do crachá/registro interno (ex: <i>RE-8821</i> ou <i>100293</i>).</li>
                <li><strong>Nome:</strong> Nome completo do colaborador (ex: <i>Ana Beatris Silva</i>).</li>
                <li><strong>LDAP:</strong> Identificador único sem espaços (ex: <i>anabs</i>). Usado para consulta no Portal do Colaborador.</li>
                <li><strong>Turno:</strong> Escolha entre <code className="bg-[var(--paper)] px-1 py-0.5 rounded font-bold">T1</code>, <code className="bg-[var(--paper)] px-1 py-0.5 rounded font-bold">T2</code>, <code className="bg-[var(--paper)] px-1 py-0.5 rounded font-bold">T3</code>, <code className="bg-[var(--paper)] px-1 py-0.5 rounded font-bold">T4</code> ou <code className="bg-[var(--paper)] px-1 py-0.5 rounded font-bold">T5</code>.</li>
                <li><strong>Turma da Escala (scale):</strong> Código do grupo do ciclo 6x2 (ex: <code className="bg-[var(--paper)] px-1 py-0.5 rounded font-bold">A</code>, <code className="bg-[var(--paper)] px-1 py-0.5 rounded font-bold">B</code>, <code className="bg-[var(--paper)] px-1 py-0.5 rounded font-bold">C</code>, <code className="bg-[var(--paper)] px-1 py-0.5 rounded font-bold">D</code>).</li>
                <li><strong>Cargo (role):</strong> Sigla ou nome da função (ex: <code className="bg-[var(--paper)] px-1 py-0.5 rounded font-bold">REP</code>, <code className="bg-[var(--paper)] px-1 py-0.5 rounded font-bold">PS</code>, <code className="bg-[var(--paper)] px-1 py-0.5 rounded font-bold">TL</code>, <code className="bg-[var(--paper)] px-1 py-0.5 rounded font-bold">Operador de Processo</code>).</li>
                <li><strong>Categoria (category):</strong> Setor operacional (ex: <i>Picking, Packing, Qualidade, Inventario, Put-Away</i>).</li>
                <li><strong>Team Leader / Time:</strong> Nome do time ou supervisor responsável (ex: <i>Time do TL Bruno Silva (T1)</i>).</li>
              </ul>
            </div>
          </div>

          {/* STEP 4 */}
          <div className="bg-[var(--bg)] border border-[var(--line)] p-5 rounded-2xl space-y-3 relative overflow-hidden">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-xl bg-emerald-600 text-white font-black text-xs flex items-center justify-center shadow-xs shrink-0">
                4
              </span>
              <h4 className="text-sm font-black text-[var(--ink)] uppercase tracking-wide">
                Compartilhar da Forma Correta para o Link Funcionar na Aplicação
              </h4>
            </div>
            <div className="pl-11 space-y-2 text-xs text-[var(--muted)] leading-relaxed">
              <p>Para que o EscalaPro consiga se conectar à planilha, configure as permissões no Google Sheets da seguinte forma:</p>
              <ol className="list-decimal pl-4 space-y-1.5">
                <li>
                  No canto superior direito da planilha no Google Sheets, clique no botão verde <strong>Compartilhar (Share)</strong>.
                </li>
                <li>
                  Em <i>"Acesso geral" (General Access)</i>, altere de <strong>"Restrito"</strong> para <strong>"Qualquer pessoa com o link"</strong> (<i>Anyone with the link</i>).
                </li>
                <li>
                  Mantenha a permissão como <strong>"Editor"</strong> (se desejar sincronização total) ou <strong>"Leitor"</strong>.
                </li>
                <li>
                  Clique em <strong>Copiar link</strong> (o link terá o formato <code className="bg-[var(--paper)] px-1.5 py-0.5 rounded border border-[var(--line)] font-mono text-[11px]">https://docs.google.com/spreadsheets/d/ID_DA_PLANILHA/edit</code>).
                </li>
                <li>
                  No EscalaPro, acesse o menu <strong>Compartilhar</strong> (ou <strong>Configurações</strong>), clique no botão <strong>"Gerar / Conectar Planilha Online"</strong>, cole o link e clique em **Salvar & Conectar**.
                </li>
              </ol>
            </div>
          </div>

          {/* STEP 5 */}
          <div className="bg-[var(--bg)] border border-[var(--line)] p-5 rounded-2xl space-y-4 relative overflow-hidden">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-xl bg-emerald-600 text-white font-black text-xs flex items-center justify-center shadow-xs shrink-0">
                5
              </span>
              <h4 className="text-sm font-black text-[var(--ink)] uppercase tracking-wide">
                Etapas de Integração Webhook via Google Apps Script (Gravação Automática em Tempo Real)
              </h4>
            </div>

            <div className="pl-11 space-y-3 text-xs text-[var(--muted)] leading-relaxed">
              <p>
                Se você deseja que cada sincronização diária da escala seja registrada automaticamente como um novo histórico linha a linha no Google Sheets, siga este tutorial de Webhook:
              </p>

              <ol className="list-decimal pl-4 space-y-2">
                <li>
                  Com a planilha aberta no Google Sheets, acesse o menu superior <strong>Extensões (Extensions)</strong> ➔ <strong>Apps Script</strong>.
                </li>
                <li>
                  Apague todo o código padrão existente na tela do editor e cole o código oficial abaixo:
                </li>
              </ol>

              {/* Code Box */}
              <div className="my-2 bg-slate-900 text-slate-100 p-4 rounded-xl border border-slate-800 space-y-3 font-mono text-xs overflow-x-auto relative shadow-inner">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-[11px] text-slate-400">
                  <span className="flex items-center gap-1.5 font-bold">
                    <Code className="w-3.5 h-3.5 text-emerald-400" />
                    Google Apps Script (Code.gs)
                  </span>
                  <button
                    onClick={handleCopyScript}
                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-sans text-[10px] font-bold rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    {copiedScript ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedScript ? 'Copiado!' : 'Copiar Código'}</span>
                  </button>
                </div>
                <pre className="text-[11px] leading-relaxed text-emerald-300 whitespace-pre font-mono">
                  {appsScriptCode}
                </pre>
              </div>

              <ol className="list-decimal pl-4 space-y-2 pt-1" start={3}>
                <li>
                  No canto superior direito da página do Apps Script, clique no botão azul <strong>Implantar (Deploy)</strong> ➔ <strong>Nova implantação (New deployment)</strong>.
                </li>
                <li>
                  No painel que se abre, clique no ícone de engrenagem ao lado de <i>"Selecionar tipo"</i> e selecione <strong>App da Web (Web App)</strong>.
                </li>
                <li>
                  Preencha as configurações de implantação exatamente assim:
                  <ul className="list-disc pl-5 my-1 space-y-0.5 text-[11px]">
                    <li><strong>Descrição:</strong> Webhook EscalaPro</li>
                    <li><strong>Executar como (Execute as):</strong> <code className="bg-[var(--paper)] px-1 py-0.5 rounded font-bold">Eu (seu e-mail)</code></li>
                    <li><strong>Quem tem acesso (Who has access):</strong> <strong className="text-emerald-700 dark:text-emerald-300">Qualquer pessoa (Anyone)</strong> *(Essencial! Se mantido como restrito, a sincronização será bloqueada pelo Google)*</li>
                  </ul>
                </li>
                <li>
                  Clique em <strong>Implantar</strong>. O Google pedirá autorização para acessar a planilha. Clique em <i>"Autorizar acesso"</i> e conclua a ativação.
                </li>
                <li>
                  Copie a <strong>URL do App da Web</strong> gerada (o link termina com <code className="bg-[var(--paper)] px-1.5 py-0.5 rounded font-mono text-[11px]">/exec</code>).
                </li>
                <li>
                  No EscalaPro, abra a janela de <strong>Conectar Planilha Online</strong>, cole a URL copiada no campo <strong>"URL do Webhook (Google Apps Script)"</strong> e clique em <strong>Salvar & Conectar</strong>.
                </li>
              </ol>

              <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 p-3.5 rounded-xl text-emerald-900 dark:text-emerald-200 text-xs font-medium flex items-start gap-2 mt-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Pronto! Integração Concluída!</strong> Agora, sempre que você clicar no botão verde <i>"Atualizar Dados na Planilha Online"</i> na tela de Compartilhar ou no topo do aplicativo, os dados serão gravados em tempo real na sua planilha no Google Sheets!
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* App Tools Guide Overview Grid */}
      <div className="space-y-4">
        <h3 className="text-lg font-black text-[var(--ink)] flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[var(--primary)]" />
          <span>Guia Completo dos Módulos do Sistema</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Tool 1 */}
          <div className="bg-[var(--paper)] border border-[var(--line)] p-5 rounded-2xl space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-bold">
                <CheckSquare className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-[var(--ink)]">Presença de Hoje</h4>
                <p className="text-xs text-[var(--muted)] font-medium">Controle diário da equipe</p>
              </div>
            </div>
            <p className="text-xs text-[var(--muted)] leading-relaxed">
              Marque presenças, ausências e faltas não justificadas. O sistema identifica e separa automaticamente colaboradores que estão em <strong>Férias</strong>, <strong>Licença Médica</strong>, <strong>Treinamento</strong> ou em dia de <strong>Folga do Ciclo 6x2</strong>.
            </p>
          </div>

          {/* Tool 2 */}
          <div className="bg-[var(--paper)] border border-[var(--line)] p-5 rounded-2xl space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 font-bold">
                <Shuffle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-[var(--ink)]">Dimensionamento de Tarefas</h4>
                <p className="text-xs text-[var(--muted)] font-medium">Distribuição operacional por postos</p>
              </div>
            </div>
            <p className="text-xs text-[var(--muted)] leading-relaxed">
              Crie postos de trabalho (ex: Recebimento, Separação, ICQA, Paletização) e atribua os colaboradores presentes. O aplicativo exige justificativa obrigatoria para qualquer colaborador que fique não alocado.
            </p>
          </div>

          {/* Tool 3 */}
          <div className="bg-[var(--paper)] border border-[var(--line)] p-5 rounded-2xl space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 font-bold">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-[var(--ink)]">Gestão de Intervalos & Refeição</h4>
                <p className="text-xs text-[var(--muted)] font-medium">Escalonamento de refeições sem gargalos</p>
              </div>
            </div>
            <p className="text-xs text-[var(--muted)] leading-relaxed">
              Defina os horários de refeição e pausas (ex: 11:30, 12:00, 12:30). Arraste ou selecione os colaboradores para cada horário e evite que múltiplos membros de uma mesma tarefa chave saiam juntos.
            </p>
          </div>

          {/* Tool 4 */}
          <div className="bg-[var(--paper)] border border-[var(--line)] p-5 rounded-2xl space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 font-bold">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-[var(--ink)]">Portal do Colaborador (Link Público)</h4>
                <p className="text-xs text-[var(--muted)] font-medium">Consulta autônoma pelos operadores</p>
              </div>
            </div>
            <p className="text-xs text-[var(--muted)] leading-relaxed">
              Compartilhe o <strong>Link Interativo</strong> da sua equipe. Os funcionários entram pelo celular, digitam seu nome ou login e consultam na hora sua tarefa do dia e horário exato do seu almoço.
            </p>
          </div>

          {/* Tool 5 */}
          <div className="bg-[var(--paper)] border border-[var(--line)] p-5 rounded-2xl space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 font-bold">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-[var(--ink)]">Calendário Anual da Escala 6x2</h4>
                <p className="text-xs text-[var(--muted)] font-medium">Projeção do ciclo anual de folgas</p>
              </div>
            </div>
            <p className="text-xs text-[var(--muted)] leading-relaxed">
              Gere o ciclo automático de folgas 6x2 para as Turmas A, B, C, D, E, F, G, H para 365 dias do ano. Permite ajustes manuais dia a dia e exportação/importação do calendário em JSON.
            </p>
          </div>

          {/* Tool 7 - Lixeira & Exclusão Segura */}
          <div className="bg-[var(--paper)] border border-[var(--line)] p-5 rounded-2xl space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-bold">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-[var(--ink)]">Lixeira de Segurança (Retenção por 60 Dias)</h4>
                <p className="text-xs text-[var(--muted)] font-medium">Exclusão protegida e restauração instantânea</p>
              </div>
            </div>
            <p className="text-xs text-[var(--muted)] leading-relaxed">
              Ao remover um colaborador, o sistema exibe um aviso flutuante com ação imediata de <strong>Desfazer Exclusão</strong>. O cadastro é movido para a aba <strong>Lixeira</strong>, onde permanece protegido por <strong>60 dias</strong>. Nesse período, ele pode ser restaurado com 1 clique ou excluído definitivamente.
            </p>
          </div>
        </div>
      </div>

      {/* Frequently Asked Questions (FAQ) Accordion */}
      <div className="bg-[var(--paper)] border border-[var(--line)] p-6 sm:p-8 rounded-2xl space-y-5">
        <h3 className="text-lg font-black text-[var(--ink)] flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-[var(--primary)]" />
          <span>Perguntas Frequentes & Resolução de Dúvidas</span>
        </h3>

        <div className="space-y-3">
          {/* FAQ list */}
          {[
            {
              q: 'Como funciona a opção de limpar dados? Os dados da minha planilha no Google Sheets serão apagados?',
              a: 'Não! Existe uma distinção clara entre os dados locais do navegador e a planilha online do Google Sheets. Ao clicar em "Limpar Dados Locais", a aplicação apaga apenas os cadastros salvos neste navegador local. A planilha no Google Sheets permanece 100% intacta no seu Google Drive, preservando as informações para outros administradores e turnos. Caso queira desvincular a planilha, você pode usar o botão "Desconectar Planilha Online" em Configurações.',
            },
            {
              q: 'O que acontece antes de uma limpeza de dados? É possível recuperar os dados apagados por engano?',
              a: 'Por precaução e segurança extrema, o EscalaPro grava AUTOMATICAMENTE um backup de emergência em memória/localStorage no instante exato antes de executar qualquer limpeza de dados. Além disso, a notificação de confirmação possui o botão "Restaurar Backup" e, na tela de Configurações, há a opção "Restaurar do Último Backup Automático" com o horário exato e total de colaboradores do registro.',
            },
            {
              q: 'Existe limite máximo de capacidade de pessoas para os horários de intervalo de refeição?',
              a: 'Não. A capacidade máxima de horários de intervalo para refeição foi totalmente descontinuada. Agora qualquer quantidade de colaboradores pode ser alocada livremente em qualquer horário de almoço cadastrado sem bloqueios ou limites numéricos.',
            },
            {
              q: 'O que acontece ao excluir um colaborador? É possível desfazer a ação?',
              a: 'Ao clicar no ícone de exclusão (lixeira), o sistema exibe um alerta de notificação no topo com o botão "Desfazer Exclusão". Além disso, por precaução, o colaborador é movido para a aba "Lixeira / Excluídos" em "Equipe e Cadastros", onde seus dados são mantidos em segurança por 60 dias. Durante esse período de 60 dias, você pode restaurar o colaborador com 1 clique ou optar por excluí-lo definitivamente.',
            },
            {
              q: 'Como funciona a divisão por Times / Team Leaders (TL) e a planilha compartilhada?',
              a: 'Se no mesmo turno houver múltiplos times (ex: 3 Team Leaders no Turno 2), cadastre o nome dos TLs em "Equipe e Cadastros". Ao atribuir cada colaborador ao seu respetivo TL, a planilha online salva o campo "teamLeader". Assim, todos os times do setor podem compartilhar a mesma planilha do Google Sheets sem misturar os dados nem causar bagunça.',
            },
            {
              q: 'Onde ficam armazenados os dados se eu não conectar a planilha do Google Sheets?',
              a: 'Todos os cadastros, históricos, marcações de presença e tarefas são salvos de forma segura no navegador local (via LocalStorage). Eles não são perdidos ao fechar a página.',
            },
            {
              q: 'Como compartilho a escala da minha equipe com outros supervisores?',
              a: 'Você pode conectar a Planilha Compartilhada no Google Sheets. Desta forma, qualquer gestor que tenha acesso à planilha conseguirá visualizar os dados atualizados em tempo real.',
            },
            {
              q: 'Como alterar o padrão de data no aplicativo?',
              a: 'O EscalaPro utiliza por padrão o formato oficial brasileiro DD/MM/AAAA em todas as telas, relatórios e arquivos exportados.',
            },
            {
              q: 'Como faço para cadastrar um novo colaborador ou cadastrar ausências programadas (férias)?',
              a: 'Acesse o menu "Equipe e Cadastros". Lá você pode adicionar novos membros, definir a turma da escala (A, B, C, D, etc.), matricular login/registro e agendar períodos de férias ou licenças médicas.',
            },
            {
              q: 'Posso fazer backup dos dados da minha equipe?',
              a: 'Sim! Em "Configurações", na seção de Exportar & Importar Backup, você pode baixar um arquivo .JSON completo com todas as informações e restaurá-lo em qualquer dispositivo.',
            },
          ].map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="border border-[var(--line)] rounded-xl overflow-hidden transition-colors"
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full p-4 text-left font-bold text-xs sm:text-sm text-[var(--ink)] bg-[var(--bg)] hover:bg-slate-100 dark:hover:bg-slate-800/60 flex items-center justify-between gap-3"
                >
                  <span>{faq.q}</span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 shrink-0 text-[var(--primary)]" />
                  ) : (
                    <ChevronDown className="w-4 h-4 shrink-0 text-[var(--muted)]" />
                  )}
                </button>
                {isOpen && (
                  <div className="p-4 pt-2 text-xs text-[var(--muted)] leading-relaxed bg-[var(--paper)] border-t border-[var(--line)]">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
