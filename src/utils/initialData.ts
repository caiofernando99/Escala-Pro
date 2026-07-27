import { AppState } from '../types';
import { generateId, getTodayISO } from './helpers';
import { SUGGESTED_CALENDAR_2026 } from './suggestedScale';

export const initialAppState: AppState = {
  brandId: 'escalapro',
  teamName: 'Operação Logística Unificada',
  sector: 'Recebimento, Estoque & Expedição',
  manager: 'Carlos Eduardo Santos',
  teamShift: 'Geral',
  defaultTeamLeader: 'Time do TL Bruno Silva (T1)',
  teamLeaders: [
    'Time do TL Bruno Silva (T1)',
    'Time da TL Mariana Souza (T2)',
    'Time do TL Marcos Vinicius (T3)',
    'Time do TL Lucas Andrade (T4)',
    'Time da TL Patricia Lima (T5)',
  ],
  roles: ['REP', 'PS', 'TL'],
  categories: ['Inventario', 'Qualidade', 'Picking', 'Packing', 'Put-Away'],
  skills: ['Expert', 'HV', 'OP.Maquina'],
  year: 2026,
  selectedDate: getTodayISO(),
  theme: 'slate',
  calendar: {
    ...SUGGESTED_CALENDAR_2026,
  },
  collaborators: [
    {
      id: 'col_1',
      name: 'Ana Beatris Silva',
      login: 'anabs',
      registration: 'REG-8821',
      shift: 'T1',
      scale: 'A',
      teamLeader: 'Time do TL Bruno Silva (T1)',
      role: 'REP',
      category: 'Picking',
      skills: { 'Expert': 3, 'OP.Maquina': 2 },
      notes: 'Operadora destaque no Picking T1',
      absences: []
    },
    {
      id: 'col_2',
      name: 'Bruno Henrique Oliveira',
      login: 'brunoh',
      registration: 'REG-8822',
      shift: 'T2',
      scale: 'B',
      teamLeader: 'Time da TL Mariana Souza (T2)',
      role: 'PS',
      category: 'Qualidade',
      skills: { 'HV': 3, 'Expert': 2 },
      notes: 'Suporte de Processo T2',
      absences: []
    },
    {
      id: 'col_3',
      name: 'Camila Rodrigues Lima',
      login: 'camilal',
      registration: 'REG-8823',
      shift: 'T3',
      scale: 'C',
      teamLeader: 'Time do TL Marcos Vinicius (T3)',
      role: 'REP',
      category: 'Inventario',
      skills: { 'Expert': 2 },
      notes: 'Auditora de Inventário T3',
      absences: [
        {
          id: generateId(),
          type: 'ferias',
          startDate: getTodayISO(),
          endDate: getTodayISO(),
          notes: 'Férias regulamentares'
        }
      ]
    },
    {
      id: 'col_4',
      name: 'Daniel Costa Ferreira',
      login: 'danielc',
      registration: 'REG-8824',
      shift: 'T4',
      scale: 'D',
      teamLeader: 'Time do TL Lucas Andrade (T4)',
      role: 'REP',
      category: 'Packing',
      skills: { 'OP.Maquina': 3, 'HV': 2 },
      notes: 'Especialista em Embalagens T4',
      absences: []
    },
    {
      id: 'col_5',
      name: 'Elena Maria Rocha',
      login: 'elenar',
      registration: 'REG-8825',
      shift: 'T5',
      scale: 'A',
      teamLeader: 'Time da TL Patricia Lima (T5)',
      role: 'PS',
      category: 'Put-Away',
      skills: { 'OP.Maquina': 3, 'Expert': 3 },
      notes: 'Operadora de Trator e Empilhadeira T5',
      absences: []
    },
    {
      id: 'col_6',
      name: 'Fernando Augusto Paes',
      login: 'fernandop',
      registration: 'REG-8826',
      shift: 'T1',
      scale: 'B',
      teamLeader: 'Time do TL Bruno Silva (T1)',
      role: 'TL',
      category: 'Inventario',
      skills: { 'Expert': 3, 'HV': 3 },
      notes: 'Team Leader de apoio T1',
      absences: []
    },
    {
      id: 'col_7',
      name: 'Gabriela Vasconcelos',
      login: 'gabrielav',
      registration: 'REG-8827',
      shift: 'T2',
      scale: 'C',
      teamLeader: 'Time da TL Mariana Souza (T2)',
      role: 'REP',
      category: 'Picking',
      skills: { 'Expert': 2, 'HV': 1 },
      notes: 'Atua no setor de Picking T2',
      absences: []
    },
    {
      id: 'col_8',
      name: 'Heitor Mendonça',
      login: 'heitorm',
      registration: 'REG-8828',
      shift: 'T3',
      scale: 'D',
      teamLeader: 'Time do TL Marcos Vinicius (T3)',
      role: 'PS',
      category: 'Put-Away',
      skills: { 'OP.Maquina': 3 },
      notes: 'Operador de Máquinas T3',
      absences: []
    },
    {
      id: 'col_9',
      name: 'Igor Rocha Santos',
      login: 'igors',
      registration: 'REG-8829',
      shift: 'T4',
      scale: 'A',
      teamLeader: 'Time do TL Lucas Andrade (T4)',
      role: 'REP',
      category: 'Qualidade',
      skills: { 'HV': 3 },
      notes: 'Conferente de Qualidade T4',
      absences: []
    },
    {
      id: 'col_10',
      name: 'Juliana Paiva Lima',
      login: 'julianap',
      registration: 'REG-8830',
      shift: 'T5',
      scale: 'B',
      teamLeader: 'Time da TL Patricia Lima (T5)',
      role: 'REP',
      category: 'Packing',
      skills: { 'Expert': 1 },
      notes: 'Packing e Conferência T5',
      absences: []
    }
  ],
  tasks: [
    {
      id: 'task_1',
      name: 'Contagem & Inventário',
      members: ['col_3'],
      allowedRoles: ['REP', 'PS'],
      allowedCategories: ['Inventario']
    },
    {
      id: 'task_2',
      name: 'Auditoria de Qualidade',
      members: ['col_2', 'col_9'],
      allowedRoles: ['PS', 'TL', 'REP'],
      allowedCategories: ['Qualidade']
    },
    {
      id: 'task_3',
      name: 'Coleta & Picking',
      members: ['col_1', 'col_7'],
      allowedRoles: ['REP', 'PS'],
      allowedCategories: ['Picking']
    },
    {
      id: 'task_4',
      name: 'Embalagem & Packing',
      members: ['col_4', 'col_10'],
      allowedRoles: ['REP', 'PS'],
      allowedCategories: ['Packing']
    },
    {
      id: 'task_5',
      name: 'Armazenagem Put-Away',
      members: ['col_5', 'col_8'],
      allowedRoles: ['REP', 'PS', 'TL'],
      allowedCategories: ['Put-Away']
    }
  ],
  breaks: [
    { id: 'break_1', time: '09:00', shift: 'T1' },
    { id: 'break_2', time: '15:00', shift: 'T2' },
    { id: 'break_3', time: '21:00', shift: 'T3' },
    { id: 'break_4', time: '03:00', shift: 'T4' },
    { id: 'break_5', time: '07:00', shift: 'T5' }
  ],
  attendance: {},
  intervals: {
    [getTodayISO()]: {
      'break_1': ['col_1', 'col_6'],
      'break_2': ['col_2', 'col_7'],
      'break_3': ['col_3', 'col_8'],
      'break_4': ['col_4', 'col_9'],
      'break_5': ['col_5', 'col_10']
    }
  },
  history: [],
  dailyReports: {},
  onlineSpreadsheet: null,
  processKnowledgeList: [
    {
      id: 'pk_1',
      title: 'Acurácia de Inventário e Bipagem Cega (PI)',
      category: 'Inventário & Qualidade',
      type: 'explicacao',
      description: 'A contagem cega exige a verificação física de cada item individualmente. Nunca presuma a quantidade baseando-se apenas na informação contida no rótulo da caixa fechada.',
      keyTakeaways: [
        'Abra a caixa e conte cada unidade física',
        'Bipe o código EAN de forma individual',
        'Em caso de divergência, abra chamado de recontagem com o líder de turno'
      ],
      iconName: 'CheckCircle2',
      active: true,
    },
    {
      id: 'pk_2',
      title: 'Segurança Operacional: Ergonomia na Elevação de Cargas',
      category: 'Segurança do Trabalho',
      type: 'seguranca',
      description: 'Ao erguer volumes pesados (acima de 10kg), flexione os joelhos e mantenha a coluna alinhada. Para pesos superiores a 20kg, solicite ajuda a um colega.',
      keyTakeaways: [
        'Dobre os joelhos e use a força das pernas',
        'Mantenha o volume próximo ao peito',
        'Evite torcer o tronco enquanto segura a carga'
      ],
      iconName: 'ShieldCheck',
      active: true,
    },
    {
      id: 'pk_3',
      title: 'Gargalo Operacional: DWELL Time e Liberação de Docas',
      category: 'Produtividade & Indicadores',
      type: 'curiosidade',
      description: 'Você sabia? Reduzir 1 minuto no tempo de liberação de cada palete na doca permite antecipar a saída dos caminhões de expedição em até 15 minutos no fechamento do turno.',
      keyTakeaways: [
        'Verifique a doca correta antes de mover o palete',
        'Evite obstruir corredores e áreas de trânsito',
        'Comunique imediatamente se houver avaria na doca'
      ],
      iconName: 'Lightbulb',
      active: true,
    },
    {
      id: 'pk_4',
      title: 'Procedimento de Segregação de Itens Danificados / Avarias',
      category: 'Inbound & Outbound',
      type: 'procedimento',
      description: 'Produtos com embalagem violada, vazamentos ou rasgos não podem ser bipados no fluxo normal. Devem ser encaminhados imediatamente para a gaiola de avarias.',
      keyTakeaways: [
        'Identifique o item com a etiqueta vermelha de Avaria',
        'Registre o motivo no sistema de auditoria',
        'Nunca misture avarias com produtos em perfeito estado'
      ],
      iconName: 'AlertTriangle',
      active: true,
    },
    {
      id: 'pk_5',
      title: 'Padrão de Embalagem & Selagem de Caixas (Packing)',
      category: 'Packing & Expedição',
      type: 'caracteristica',
      description: 'Garantir a aplicação correta da fita adesiva em formato "H" previne aberturas acidentais durante o transporte e protege a mercadoria até a entrega final.',
      keyTakeaways: [
        'Aplique a fita cobrindo toda a junção central',
        'Sele as bordas laterais para formar a estrutura em "H"',
        'Cole a etiqueta de envio em superfície plana sem dobras'
      ],
      iconName: 'Sparkles',
      active: true,
    },
  ],
};
