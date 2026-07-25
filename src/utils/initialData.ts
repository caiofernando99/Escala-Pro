import { AppState } from '../types';
import { generateId, getTodayISO } from './helpers';

export const initialAppState: AppState = {
  brandId: 'escalapro',
  teamName: 'Operação Logística T2',
  sector: 'Recebimento & Expedição',
  manager: 'Carlos Eduardo Santos',
  teamShift: 'T2',
  roles: ['Operador de Processo', 'Analista de Qualidade', 'Líder de Operações', 'Auxiliar de Logística', 'Suporte Técnico'],
  categories: ['Inbound', 'Outbound', 'ICQA', 'Inventory', 'Packing'],
  skills: ['Empilhadeira', 'Coletor RF', 'Auditoria ICQA', 'Conferência', 'Paletização'],
  year: new Date().getFullYear(),
  selectedDate: getTodayISO(),
  theme: 'slate',
  calendar: {
    // Populate sample 6x2 pattern for the current month
    [getTodayISO()]: 'A',
  },
  collaborators: [
    {
      id: 'col_1',
      name: 'Ana Beatris Silva',
      login: 'anabs',
      registration: 'REG-8821',
      shift: 'T2',
      scale: 'A',
      role: 'Operador de Processo',
      category: 'Inbound',
      skills: { 'Coletor RF': 3, 'Conferência': 2 },
      notes: 'Turno fixo T2',
      absences: []
    },
    {
      id: 'col_2',
      name: 'Bruno Henrique Oliveira',
      login: 'brunoh',
      registration: 'REG-8822',
      shift: 'T2',
      scale: 'B',
      role: 'Analista de Qualidade',
      category: 'ICQA',
      skills: { 'Auditoria ICQA': 3, 'Conferência': 3 },
      notes: 'Certificado ICQA',
      absences: []
    },
    {
      id: 'col_3',
      name: 'Camila Rodrigues Lima',
      login: 'camilal',
      registration: 'REG-8823',
      shift: 'T2',
      scale: 'C',
      role: 'Auxiliar de Logística',
      category: 'Outbound',
      skills: { 'Paletização': 2 },
      notes: 'Férias agendadas em breve',
      absences: [
        {
          id: generateId(),
          type: 'ferias',
          startDate: getTodayISO(),
          endDate: getTodayISO(),
          notes: 'Férias regulamentares de 15 dias'
        }
      ]
    },
    {
      id: 'col_4',
      name: 'Daniel Costa Ferreira',
      login: 'danielc',
      registration: 'REG-8824',
      shift: 'T2',
      scale: 'D',
      role: 'Líder de Operações',
      category: 'Inbound',
      skills: { 'Empilhadeira': 3, 'Coletor RF': 3 },
      notes: 'Treinamento de Liderança',
      absences: []
    },
    {
      id: 'col_5',
      name: 'Elena Maria Rocha',
      login: 'elenar',
      registration: 'REG-8825',
      shift: 'T2',
      scale: 'A',
      role: 'Operador de Processo',
      category: 'Packing',
      skills: { 'Coletor RF': 2 },
      absences: []
    },
    {
      id: 'col_6',
      name: 'Fernando Augusto Paes',
      login: 'fernandop',
      registration: 'REG-8826',
      shift: 'T2',
      scale: 'B',
      role: 'Auxiliar de Logística',
      category: 'Outbound',
      skills: { 'Paletização': 3 },
      absences: []
    },
    {
      id: 'col_7',
      name: 'Gabriela Vasconcelos',
      login: 'gabrielav',
      registration: 'REG-8827',
      shift: 'T2',
      scale: 'C',
      role: 'Suporte Técnico',
      category: 'ICQA',
      skills: { 'Auditoria ICQA': 2 },
      absences: []
    },
    {
      id: 'col_8',
      name: 'Heitor Mendonça',
      login: 'heitorm',
      registration: 'REG-8828',
      shift: 'T2',
      scale: 'D',
      role: 'Operador de Processo',
      category: 'Inbound',
      skills: { 'Empilhadeira': 2 },
      absences: []
    }
  ],
  tasks: [
    {
      id: 'task_1',
      name: 'Recebimento & Conferência',
      members: ['col_1', 'col_8'],
      allowedRoles: ['Operador de Processo', 'Auxiliar de Logística'],
      allowedCategories: ['Inbound']
    },
    {
      id: 'task_2',
      name: 'Qualidade ICQA & Auditoria',
      members: ['col_2', 'col_7'],
      allowedRoles: ['Analista de Qualidade', 'Suporte Técnico'],
      allowedCategories: ['ICQA']
    },
    {
      id: 'task_3',
      name: 'Embalagem & Packing',
      members: ['col_5'],
      allowedRoles: ['Operador de Processo'],
      allowedCategories: ['Packing']
    },
    {
      id: 'task_4',
      name: 'Expedição & Paletização',
      members: ['col_6'],
      allowedRoles: ['Auxiliar de Logística', 'Líder de Operações'],
      allowedCategories: ['Outbound']
    }
  ],
  breaks: [
    { id: 'break_1', time: '19:30', shift: 'T2', capacity: 3 },
    { id: 'break_2', time: '20:00', shift: 'T2', capacity: 4 },
    { id: 'break_3', time: '20:30', shift: 'T2', capacity: 4 },
    { id: 'break_4', time: '21:00', shift: 'T2', capacity: 3 }
  ],
  attendance: {},
  intervals: {
    [getTodayISO()]: {
      'break_1': ['col_1', 'col_2'],
      'break_2': ['col_5', 'col_6'],
      'break_3': ['col_7', 'col_8']
    }
  },
  history: [],
  dailyReports: {}
};
