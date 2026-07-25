import React from 'react';
import { useApp } from '../context/AppContext';
import {
  Users,
  CheckCircle2,
  Calendar,
  Shuffle,
  Clock,
  Share2,
  FileText,
  Settings,
  Palmtree,
  UserX,
  Award,
  BookOpen,
} from 'lucide-react';

interface HomeViewProps {
  onNavigate: (view: string) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ onNavigate }) => {
  const { state, setDate } = useApp();

  const activeDate = state.selectedDate;

  let presentCount = 0;
  let vacationCount = 0;
  let leaveCount = 0;
  let trainingCount = 0;
  let absentCount = 0;

  state.collaborators.forEach((c) => {
    const activeAbsence = (c.absences || []).find((a) => activeDate >= a.startDate && activeDate <= a.endDate);
    if (activeAbsence) {
      if (activeAbsence.type === 'ferias') vacationCount++;
      else if (activeAbsence.type === 'licenca') leaveCount++;
      else if (activeAbsence.type === 'treinamento') trainingCount++;
      return;
    }

    const manual = state.attendance[activeDate]?.[c.id];
    if (manual === false) {
      absentCount++;
    } else {
      presentCount++;
    }
  });

  const assignedCount = new Set(state.tasks.flatMap((t) => t.members)).size;

  const steps = [
    {
      step: '01',
      title: 'Confirmar Presença',
      desc: 'Valide presentes, faltas e colaboradores em férias/licenças.',
      view: 'presence',
      icon: CheckCircle2,
      btnText: 'Abrir Presença',
    },
    {
      step: '02',
      title: 'Distribuir Tarefas',
      desc: 'Dimensione a equipe respeitando cargos, categorias e skills.',
      view: 'assignment',
      icon: Shuffle,
      btnText: 'Dimensionar',
    },
    {
      step: '03',
      title: 'Gerar Intervalos',
      desc: 'Organize os horários de refeição agrupados por tarefa.',
      view: 'breaks',
      icon: Clock,
      btnText: 'Organizar Intervalos',
    },
    {
      step: '04',
      title: 'Compartilhar Resumo',
      desc: 'Envie para os colaboradores a lista unificada e limpa.',
      view: 'share',
      icon: Share2,
      btnText: 'Ver Resumo',
    },
    {
      step: '05',
      title: 'Relatório Diário',
      desc: 'Registre ocorrências, observações e pendências do turno.',
      view: 'report',
      icon: FileText,
      btnText: 'Gerar Relatório',
    },
    {
      step: '06',
      title: 'Configurações',
      desc: 'Gerencie temas, backups e redefinição de dados.',
      view: 'settings',
      icon: Settings,
      btnText: 'Configurações',
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Banner Top */}
      <div className="bg-gradient-to-r from-[var(--sidebar-bg)] to-[var(--primary)] text-white p-6 rounded-2xl shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight">
            Painel da Operação — {state.teamName || 'Equipe Principal'}
          </h2>
          <p className="text-sm text-white/90 mt-1 max-w-xl font-medium">
            Acompanhe a disponibilidade da equipe, afastamentos programados, dimensionamento e escala em tempo real.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-black/20 text-white px-4 py-2.5 rounded-xl border border-white/20 shadow-sm shrink-0">
          <Calendar className="w-4 h-4 text-white/90 shrink-0" />
          <input
            type="date"
            value={state.selectedDate}
            onChange={(e) => setDate(e.target.value)}
            className="bg-transparent text-sm font-bold text-white focus:outline-none cursor-pointer"
          />
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="bg-[var(--paper)] border-2 border-emerald-300 dark:border-emerald-800 p-4 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-emerald-800 dark:text-emerald-300 font-extrabold mb-1">
            <span className="text-xs uppercase tracking-wider">Presentes</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-3xl font-black text-[var(--ink)]">{presentCount}</div>
          <p className="text-xs text-[var(--muted)] font-semibold mt-1">Colaboradores ativos hoje</p>
        </div>

        <div className="bg-[var(--paper)] border-2 border-purple-300 dark:border-purple-800 p-4 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-purple-800 dark:text-purple-300 font-extrabold mb-1">
            <span className="text-xs uppercase tracking-wider">Férias</span>
            <Palmtree className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="text-3xl font-black text-[var(--ink)]">{vacationCount}</div>
          <p className="text-xs text-[var(--muted)] font-semibold mt-1">Afastamento programado</p>
        </div>

        <div className="bg-[var(--paper)] border-2 border-amber-300 dark:border-amber-800 p-4 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-amber-800 dark:text-amber-300 font-extrabold mb-1">
            <span className="text-xs uppercase tracking-wider">Licenças / Trein.</span>
            <div className="flex gap-1 text-amber-600 dark:text-amber-400">
              <Award className="w-4 h-4" />
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-[var(--ink)]">{leaveCount + trainingCount}</div>
          <p className="text-xs text-[var(--muted)] font-semibold mt-1">Licenças e treinamentos</p>
        </div>

        <div className="bg-[var(--paper)] border-2 border-red-300 dark:border-red-800 p-4 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-red-800 dark:text-red-300 font-extrabold mb-1">
            <span className="text-xs uppercase tracking-wider">Ausentes</span>
            <UserX className="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
          <div className="text-3xl font-black text-[var(--ink)]">{absentCount}</div>
          <p className="text-xs text-[var(--muted)] font-semibold mt-1">Faltas não justificadas</p>
        </div>

        <div className="bg-[var(--paper)] border-2 border-[var(--primary-border)] p-4 rounded-xl shadow-xs col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-[var(--primary)] font-extrabold mb-1">
            <span className="text-xs uppercase tracking-wider">Dimensionados</span>
            <Shuffle className="w-5 h-5" />
          </div>
          <div className="text-3xl font-black text-[var(--ink)]">
            {assignedCount} / {presentCount}
          </div>
          <p className="text-xs text-[var(--muted)] font-semibold mt-1">Com tarefa atribuída</p>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-[var(--ink)]">Fluxo de Trabalho Diário</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {steps.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.step}
                className="bg-[var(--paper)] border border-[var(--line)] p-5 rounded-xl shadow-xs hover:border-[var(--primary)] transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xl font-extrabold text-[var(--primary)] bg-[var(--primary-soft)] px-2.5 py-1 rounded-lg">
                      {item.step}
                    </span>
                    <Icon className="w-5 h-5 text-[var(--muted)] group-hover:text-[var(--primary)] transition-colors" />
                  </div>
                  <h4 className="font-bold text-base text-[var(--ink)] mb-1">{item.title}</h4>
                  <p className="text-xs text-[var(--muted)] leading-relaxed mb-4">{item.desc}</p>
                </div>
                <button
                  onClick={() => onNavigate(item.view)}
                  className="w-full py-2 px-3 bg-[var(--bg)] hover:bg-[var(--primary)] hover:text-white border border-[var(--line)] text-xs font-bold rounded-lg transition-colors text-[var(--ink)] flex items-center justify-center gap-2"
                >
                  <span>{item.btnText}</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
