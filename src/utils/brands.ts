import { Clock, ShieldCheck, Activity, Layers, Workflow, LucideIcon } from 'lucide-react';

export interface BrandOption {
  id: string;
  name: string;
  shortName: string;
  badge: string;
  tagline: string;
  slogan: string;
  description: string;
  icon: LucideIcon;
  primaryColor: string;
  logoBg: string;
  logoImageUrl?: string;
}

export const BRAND_OPTIONS: BrandOption[] = [
  {
    id: 'escalapro',
    name: 'EscalaPro',
    shortName: 'EscalaPro',
    badge: 'EP',
    tagline: 'Gestão Inteligente de Escalas & Turnos',
    slogan: 'Precisão e controle operacional em tempo real',
    description: 'Marca moderna e executiva, ideal para operações de alto rendimento e logística.',
    icon: ShieldCheck,
    primaryColor: '#1d4ed8',
    logoBg: 'bg-blue-600 text-white',
  },
  {
    id: 'shiftpulse',
    name: 'ShiftPulse 360',
    shortName: 'ShiftPulse',
    badge: 'SP',
    tagline: 'Ritmo e Sincronia para Equipes Operacionais',
    slogan: 'A inteligência do seu chão de fábrica',
    description: 'Enfatiza a dinamismo, ritmo de produção e pulso contínuo das escalas.',
    icon: Activity,
    primaryColor: '#0284c7',
    logoBg: 'bg-sky-600 text-white',
  },
  {
    id: 'operativa',
    name: 'Operativa Scale',
    shortName: 'Operativa',
    badge: 'OP',
    tagline: 'Dimensionamento & Logística de Pessoas',
    slogan: 'Dimensionamento perfeito sem gargalos',
    description: 'Identidade robusta focada em operação industrial, logística e centros de distribuição.',
    icon: Layers,
    primaryColor: '#059669',
    logoBg: 'bg-emerald-600 text-white',
  },
  {
    id: 'kronowork',
    name: 'KronoWork 6x2',
    shortName: 'KronoWork',
    badge: 'KW',
    tagline: 'Escalas, Dimensionamento e Intervalos',
    slogan: 'O tempo a favor da sua produtividade',
    description: 'Foco na gestão precisa do tempo, ciclos 6x2 e rotação equilibrada de equipes.',
    icon: Clock,
    primaryColor: '#4338ca',
    logoBg: 'bg-indigo-600 text-white',
  },
  {
    id: 'equipeflow',
    name: 'EquipeFlow',
    shortName: 'EquipeFlow',
    badge: 'EF',
    tagline: 'Gestão Unificada de Turnos e Refeições',
    slogan: 'Trabalho em fluxo, equipe em sintonia',
    description: 'Visual fluido focado na harmonia e integração entre colaboradores e tarefas.',
    icon: Workflow,
    primaryColor: '#7c3aed',
    logoBg: 'bg-purple-600 text-white',
  },
];

export const DEFAULT_BRAND = BRAND_OPTIONS[0];
