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
} from 'lucide-react';
import { useApp } from '../context/AppContext';

interface HelpViewProps {
  onOpenTutorial?: () => void;
}

export const HelpView: React.FC<HelpViewProps> = ({ onOpenTutorial }) => {
  const { state, generateTemplateSpreadsheet, exportLocalSpreadsheet } = useApp();
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12 animate-in fade-in duration-200">
      {/* Hero Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 text-white p-6 sm:p-8 rounded-2xl shadow-lg relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="relative z-10 space-y-3 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-black uppercase tracking-wider text-blue-200 border border-white/15">
            <HelpCircle className="w-4 h-4 text-blue-300" />
            <span>Guia Oficial de Uso & Documentação</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
            Central de Ajuda & Guia Completo do EscalaPro
          </h2>
          <p className="text-sm text-blue-100 font-medium leading-relaxed">
            Aprenda a utilizar todas as ferramentas de dimensionamento por <strong>Turno (T1 a T5)</strong>, gestão de presença, portal do colaborador, matrículas por cargos (<strong>REP, PS, TL</strong>), categorias (<strong>Inventario, Qualidade, Picking, Packing, Put-Away</strong>) e skills (<strong>Expert, HV, OP.Maquina</strong>).
          </p>
        </div>

        {onOpenTutorial && (
          <div className="relative z-10 shrink-0">
            <button
              onClick={onOpenTutorial}
              className="px-5 py-3 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer border border-emerald-400"
            >
              <Sparkles className="w-4 h-4" />
              <span>Abrir Tutorial Interativo</span>
            </button>
          </div>
        )}

        <HelpCircle className="absolute -right-8 -bottom-8 w-64 h-64 text-white/5 pointer-events-none" />
      </div>

      {/* Featured Section: Google Sheets Database Integration Tutorial */}
      <div className="bg-[var(--paper)] border-2 border-emerald-500/30 dark:border-emerald-500/20 p-6 sm:p-8 rounded-2xl shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--line)] pb-5">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shrink-0">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-[var(--ink)]">
                  Como Conectar & Usar o Google Sheets como Banco de Dados
                </h3>
                <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800 rounded-md text-[10px] font-black uppercase">
                  Novo Recurso
                </span>
              </div>
              <p className="text-xs text-[var(--muted)] font-medium">
                Passo a passo simples para salvar e compartilhar o histórico de escalas da equipe entre gestores e administradores.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={generateTemplateSpreadsheet}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-xs transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Baixar Modelo (.CSV)</span>
            </button>
          </div>
        </div>

        {/* 5-Step Tutorial Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Step 1 */}
          <div className="bg-[var(--bg)] border border-[var(--line)] p-4 rounded-xl space-y-2 relative">
            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200 font-black text-xs flex items-center justify-center border border-emerald-300 dark:border-emerald-800">
              1
            </div>
            <h4 className="text-xs font-extrabold text-[var(--ink)] uppercase tracking-wider">
              Criar ou Usar uma Planilha
            </h4>
            <p className="text-xs text-[var(--muted)] leading-relaxed">
              Crie uma nova planilha no <strong>Google Sheets</strong> (ou clique no botão acima para baixar nosso modelo pronto em CSV e importar no Google Drive).
            </p>
          </div>

          {/* Step 2 */}
          <div className="bg-[var(--bg)] border border-[var(--line)] p-4 rounded-xl space-y-2 relative">
            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200 font-black text-xs flex items-center justify-center border border-emerald-300 dark:border-emerald-800">
              2
            </div>
            <h4 className="text-xs font-extrabold text-[var(--ink)] uppercase tracking-wider">
              Copiar o Link de Compartilhamento
            </h4>
            <p className="text-xs text-[var(--muted)] leading-relaxed">
              No Google Sheets, clique em <strong>Compartilhar</strong> no canto superior direito e garanta permissão de visualização ou edição para os gestores da sua equipe. Copie o link completo da URL.
            </p>
          </div>

          {/* Step 3 */}
          <div className="bg-[var(--bg)] border border-[var(--line)] p-4 rounded-xl space-y-2 relative">
            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200 font-black text-xs flex items-center justify-center border border-emerald-300 dark:border-emerald-800">
              3
            </div>
            <h4 className="text-xs font-extrabold text-[var(--ink)] uppercase tracking-wider">
              Conectar no EscalaPro
            </h4>
            <p className="text-xs text-[var(--muted)] leading-relaxed">
              Vá para a aba <strong>Compartilhar</strong> (ou <strong>Configurações</strong>), clique em <strong>"Gerar / Conectar Planilha Online"</strong>, informe o nome desejado e cole o link da planilha.
            </p>
          </div>

          {/* Step 4 */}
          <div className="bg-[var(--bg)] border border-[var(--line)] p-4 rounded-xl space-y-2 relative">
            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200 font-black text-xs flex items-center justify-center border border-emerald-300 dark:border-emerald-800">
              4
            </div>
            <h4 className="text-xs font-extrabold text-[var(--ink)] uppercase tracking-wider">
              Sincronizar Diariamente
            </h4>
            <p className="text-xs text-[var(--muted)] leading-relaxed">
              Sempre que definir a escala do dia, basta clicar no botão verde no topo: <strong>"Atualizar Dados na Planilha Online (Nome da Planilha)"</strong>.
            </p>
          </div>

          {/* Step 5 */}
          <div className="bg-[var(--bg)] border border-[var(--line)] p-4 rounded-xl space-y-2 relative md:col-span-2 lg:col-span-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200 font-black text-xs flex items-center justify-center border border-emerald-300 dark:border-emerald-800">
              5
            </div>
            <h4 className="text-xs font-extrabold text-[var(--ink)] uppercase tracking-wider">
              Automação via Google Apps Script (Opcional)
            </h4>
            <p className="text-xs text-[var(--muted)] leading-relaxed">
              Se desejar gravar os registros linha a linha na planilha de forma automatizada via HTTP, cole a URL de Webhook do seu projeto do Apps Script no campo opcional. A aplicação enviará o payload completo em JSON a cada sincronização.
            </p>
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
