import React, { useState } from 'react';
import { motion } from 'motion/react';
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
  Stethoscope,
  BookOpen,
  Filter,
  SlidersHorizontal,
} from 'lucide-react';

interface HomeViewProps {
  onNavigate: (view: string) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ onNavigate }) => {
  const { state, setDate, setSelectedGlobalFilters } = useApp();

  const activeDate = state.selectedDate;

  const selectedShift = state.selectedShiftFilter || 'ALL';
  const selectedTL = state.selectedTLFilter || 'ALL';

  // Available unique shifts
  const defaultShifts = ['Geral', 'T1', 'T2', 'T3', 'T4', 'T5'];
  const colShifts = state.collaborators.map((c) => c.shift || 'Geral');
  const availableShifts = Array.from(new Set([...defaultShifts, ...colShifts]));

  // Filter collaborators based on shift and TL
  const filteredCollaborators = state.collaborators.filter((c) => {
    const colShift = c.shift || 'Geral';
    const colTL = c.teamLeader || state.defaultTeamLeader || 'Sem Time';

    const matchesShift = selectedShift === 'ALL' || selectedShift === 'todos' || colShift === selectedShift;
    const matchesTL = selectedTL === 'ALL' || selectedTL === 'todos' || colTL === selectedTL;

    return matchesShift && matchesTL;
  });

  // TLs available for the selected shift
  const availableTLsForShift = Array.from(
    new Set(
      state.collaborators
        .filter((c) => selectedShift === 'ALL' || selectedShift === 'todos' || (c.shift || 'Geral') === selectedShift)
        .map((c) => c.teamLeader || state.defaultTeamLeader || 'Sem Time')
    )
  );

  const handleShiftChange = (newShift: string) => {
    setSelectedGlobalFilters({ shift: newShift, teamLeader: selectedTL });
  };

  const handleTLChange = (newTL: string) => {
    setSelectedGlobalFilters({ shift: selectedShift, teamLeader: newTL });
  };

  let presentCount = 0;
  let vacationCount = 0;
  let leaveCount = 0;
  let trainingCount = 0;
  let absentCount = 0;

  filteredCollaborators.forEach((c) => {
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

  const filteredIds = new Set(filteredCollaborators.map((c) => c.id));
  const assignedCount = new Set(state.tasks.flatMap((t) => t.members.filter((m) => filteredIds.has(m)))).size;

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
    <div className="space-y-3.5 animate-in fade-in duration-200">
      {/* Banner Top */}
      <div className="bg-gradient-to-r from-[var(--sidebar-bg)] to-[var(--primary)] text-white p-4 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-extrabold tracking-tight">
            Painel da Operação — {state.teamName || 'Equipe Principal'}
          </h2>
          <p className="text-xs text-white/90 mt-0.5 max-w-xl font-medium">
            Acompanhe a disponibilidade da equipe, afastamentos programados, dimensionamento e escala em tempo real.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-black/20 text-white px-3 py-2 rounded-xl border border-white/20 shadow-xs shrink-0">
          <Calendar className="w-3.5 h-3.5 text-white/90 shrink-0" />
          <input
            type="date"
            value={state.selectedDate}
            onChange={(e) => setDate(e.target.value)}
            className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer"
          />
        </div>
      </div>

      {/* SELETOR DE IDENTIFICAÇÃO DA EQUIPE E TURNO */}
      <div className="bg-[var(--paper)] border border-[var(--primary-border)] p-3 rounded-2xl shadow-2xs space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--line)] pb-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-[var(--primary-soft)] text-[var(--primary)] rounded-lg font-bold shrink-0">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-extrabold text-[var(--ink)] flex items-center gap-2">
                <span>Identificação do Usuário (TL / Turno)</span>
                {selectedShift !== 'ALL' && selectedShift !== 'todos' && (
                  <span className="px-1.5 py-0.2 bg-[var(--primary)] text-white rounded text-[9px] uppercase font-black">
                    Turno {selectedShift}
                  </span>
                )}
                {selectedTL !== 'ALL' && selectedTL !== 'todos' && (
                  <span className="px-1.5 py-0.2 bg-emerald-600 text-white rounded text-[9px] font-black">
                    {selectedTL}
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-[var(--muted)]">
                Configuração ativa para as demais telas da aplicação (Presença, Dimensionamento, Intervalos).
              </p>
            </div>
          </div>

          {(selectedShift !== 'ALL' && selectedShift !== 'todos' || selectedTL !== 'ALL' && selectedTL !== 'todos') && (
            <button
              onClick={() => setSelectedGlobalFilters({ shift: 'ALL', teamLeader: 'ALL' })}
              className="px-2.5 py-1 bg-amber-500/10 text-amber-900 dark:text-amber-200 hover:bg-amber-500/20 text-[11px] font-extrabold rounded-lg transition-colors border border-amber-500/30 self-start sm:self-center cursor-pointer shrink-0"
            >
              Limpar Filtros
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
            {/* Seletor de Turno */}
            <div className="flex items-center gap-1.5 bg-[var(--bg)] border border-[var(--line)] p-1 rounded-lg">
              <span className="text-[var(--muted)] font-bold text-[11px] px-1">Turno:</span>
              <select
                value={selectedShift}
                onChange={(e) => handleShiftChange(e.target.value)}
                className="bg-[var(--paper)] border border-[var(--line)] rounded-md px-2 py-0.5 text-[var(--ink)] font-black text-xs cursor-pointer focus:ring-1 focus:ring-[var(--primary)]"
              >
                <option value="ALL">Todos os Turnos</option>
                {availableShifts.map((s) => (
                  <option key={s} value={s}>
                    Turno {s}
                  </option>
                ))}
              </select>
            </div>

            {/* Seletor de Time / TL */}
            <div className="flex items-center gap-1.5 bg-[var(--bg)] border border-[var(--line)] p-1 rounded-lg">
              <span className="text-[var(--muted)] font-bold text-[11px] px-1">Time / TL:</span>
              <select
                value={selectedTL}
                onChange={(e) => handleTLChange(e.target.value)}
                className="bg-[var(--paper)] border border-[var(--line)] rounded-md px-2 py-0.5 text-[var(--ink)] font-black text-xs cursor-pointer focus:ring-1 focus:ring-[var(--primary)]"
              >
                <option value="ALL">
                  {selectedShift !== 'ALL' && selectedShift !== 'todos' ? `Todos do Turno ${selectedShift}` : 'Todos os Times'}
                </option>
                {availableTLsForShift.map((tl) => (
                  <option key={tl} value={tl}>
                    {tl}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Live badge summary */}
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--primary)] bg-[var(--primary-soft)] px-2.5 py-1 rounded-lg border border-[var(--primary-border)] shrink-0">
            <SlidersHorizontal className="w-3 h-3" />
            <span>
              Mostrando {filteredCollaborators.length} de {state.collaborators.length}
            </span>
          </div>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
        <motion.div whileHover={{ y: -2, scale: 1.01 }} className="bg-[var(--paper)] border border-emerald-300 dark:border-emerald-800 p-3 rounded-xl shadow-2xs">
          <div className="flex items-center justify-between text-emerald-800 dark:text-emerald-300 font-extrabold mb-0.5">
            <span className="text-[10px] uppercase tracking-wider">Presentes</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-[var(--ink)]">{presentCount}</div>
          <p className="text-[10px] text-[var(--muted)] font-medium mt-0.5">Ativos hoje</p>
        </motion.div>

        <motion.div whileHover={{ y: -2, scale: 1.01 }} className="bg-[var(--paper)] border border-purple-300 dark:border-purple-800 p-3 rounded-xl shadow-2xs">
          <div className="flex items-center justify-between text-purple-800 dark:text-purple-300 font-extrabold mb-0.5">
            <span className="text-[10px] uppercase tracking-wider">Férias</span>
            <Palmtree className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="text-2xl font-black text-[var(--ink)]">{vacationCount}</div>
          <p className="text-[10px] text-[var(--muted)] font-medium mt-0.5">Programadas</p>
        </motion.div>

        <motion.div whileHover={{ y: -2, scale: 1.01 }} className="bg-[var(--paper)] border border-amber-300 dark:border-amber-800 p-3 rounded-xl shadow-2xs">
          <div className="flex items-center justify-between text-amber-800 dark:text-amber-300 font-extrabold mb-0.5">
            <span className="text-[10px] uppercase tracking-wider">Licen. / Trein.</span>
            <div className="flex gap-1 text-amber-600 dark:text-amber-400">
              <Stethoscope className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-[var(--ink)]">{leaveCount + trainingCount}</div>
          <p className="text-[10px] text-[var(--muted)] font-medium mt-0.5">Médico / Treino</p>
        </motion.div>

        <motion.div whileHover={{ y: -2, scale: 1.01 }} className="bg-[var(--paper)] border border-red-300 dark:border-red-800 p-3 rounded-xl shadow-2xs">
          <div className="flex items-center justify-between text-red-800 dark:text-red-300 font-extrabold mb-0.5">
            <span className="text-[10px] uppercase tracking-wider">Ausentes</span>
            <UserX className="w-4 h-4 text-red-600 dark:text-red-400" />
          </div>
          <div className="text-2xl font-black text-[var(--ink)]">{absentCount}</div>
          <p className="text-[10px] text-[var(--muted)] font-medium mt-0.5">Faltas no dia</p>
        </motion.div>

        <div className="bg-[var(--paper)] border border-[var(--primary-border)] p-3 rounded-xl shadow-2xs col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-[var(--primary)] font-extrabold mb-0.5">
            <span className="text-[10px] uppercase tracking-wider">Dimensionados</span>
            <Shuffle className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-[var(--ink)]">
            {assignedCount} / {presentCount}
          </div>
          <p className="text-[10px] text-[var(--muted)] font-medium mt-0.5">Com tarefa</p>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div className="space-y-2.5">
        <h3 className="text-sm font-extrabold text-[var(--ink)]">Fluxo de Trabalho Diário</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {steps.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.step}
                className="bg-[var(--paper)] border border-[var(--line)] p-3 rounded-xl shadow-2xs hover:border-[var(--primary)] transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-black text-[var(--primary)] bg-[var(--primary-soft)] px-2 py-0.5 rounded-md">
                      {item.step}
                    </span>
                    <Icon className="w-4 h-4 text-[var(--muted)] group-hover:text-[var(--primary)] transition-colors" />
                  </div>
                  <h4 className="font-extrabold text-xs text-[var(--ink)] mb-0.5 truncate">{item.title}</h4>
                  <p className="text-[10px] text-[var(--muted)] leading-tight line-clamp-2 mb-2">{item.desc}</p>
                </div>
                <button
                  onClick={() => onNavigate(item.view)}
                  className="w-full py-1.5 px-2 bg-[var(--bg)] hover:bg-[var(--primary)] hover:text-white border border-[var(--line)] text-[11px] font-bold rounded-lg transition-colors text-[var(--ink)] flex items-center justify-center gap-1 cursor-pointer"
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
