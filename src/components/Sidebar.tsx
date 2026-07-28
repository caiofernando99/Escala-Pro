import React from 'react';
import { motion } from 'motion/react';
import {
  Home,
  Calendar,
  Users,
  CheckSquare,
  Shuffle,
  Clock,
  Share2,
  FileText,
  Settings,
  HelpCircle,
  X,
  ChevronLeft,
  ChevronRight,
  Cloud,
  CheckCircle2,
  Presentation,
  UserCheck,
} from 'lucide-react';
import { EscalaProLogo } from './EscalaProLogo';
import { useApp } from '../context/AppContext';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  isMobileOpen = false,
  onCloseMobile,
}) => {
  const { state, toggleSidebarCollapsed } = useApp();
  const isCollapsed = Boolean(state.isSidebarCollapsed);

  const rawNavItems = [
    { id: 'home', label: 'Visão geral', icon: Home },
    { id: 'calendar', label: 'Calendário anual', icon: Calendar },
    { id: 'team', label: 'Equipe e cadastros', icon: Users },
    { id: 'presence', label: 'Presença de hoje', icon: CheckSquare },
    { id: 'assignment', label: 'Dimensionamento', icon: Shuffle },
    { id: 'breaks', label: 'Intervalos', icon: Clock },
    { id: 'briefing', label: 'Montagem de slide', icon: Presentation },
    { id: 'portal', label: 'Portal do Colaborador', icon: UserCheck },
    { id: 'share', label: 'Compartilhar', icon: Share2 },
    { id: 'report', label: 'Relatório diário', icon: FileText },
    { id: 'settings', label: 'Configurações', icon: Settings },
    { id: 'help', label: 'Ajuda', icon: HelpCircle },
  ];

  const navItems = rawNavItems.filter((item) => {
    if (item.id === 'briefing' && state.showBriefingSlide === false) return false;
    if (item.id === 'portal' && state.showEmployeePortal === false) return false;
    return true;
  });

  const handleSelect = (id: string) => {
    onNavigate(id);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const navContent = (
    <>
      <nav className="flex-1 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <motion.button
              key={item.id}
              whileHover={{ scale: 1.02, x: isCollapsed ? 0 : 2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleSelect(item.id)}
              title={isCollapsed ? item.label : undefined}
              className={`w-full flex items-center gap-3 rounded-xl transition-all duration-150 cursor-pointer ${
                isCollapsed
                  ? 'justify-center p-2.5'
                  : 'px-3.5 py-2.5 text-sm font-medium'
              } ${
                isActive
                  ? 'bg-[var(--sidebar-active)] text-white shadow-sm font-semibold'
                  : 'text-white/80 hover:bg-[var(--sidebar-hover)] hover:text-white'
              }`}
            >
              <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : 'text-white/70'}`} />
              {!isCollapsed && <span className="truncate">{item.label}</span>}
            </motion.button>
          );
        })}
      </nav>

      {state.onlineSpreadsheet?.lastSyncedAt && state.onlineSpreadsheet?.syncStatus !== 'error' ? (
        <div
          className={`mt-auto pt-3 border-t border-white/10 flex items-center text-xs text-white/80 shrink-0 ${
            isCollapsed ? 'justify-center px-1' : 'px-2 gap-2.5'
          }`}
          title={`Armazenamento na Nuvem Atualizado (${state.onlineSpreadsheet.lastSyncedAt}) • ${state.onlineSpreadsheet.name}`}
        >
          <div className="relative shrink-0 flex items-center justify-center">
            <Cloud className="w-5 h-5 text-emerald-400" />
            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-300 absolute -bottom-0.5 -right-0.5 bg-slate-900 rounded-full" />
          </div>
          {!isCollapsed && (
            <div className="min-w-0 truncate">
              <div className="font-black text-[11px] text-emerald-300 leading-tight truncate">Nuvem Atualizada</div>
              <div className="text-[9.5px] text-white/70 font-mono truncate">{state.onlineSpreadsheet.lastSyncedAt}</div>
            </div>
          )}
        </div>
      ) : (
        <div
          className={`mt-auto pt-3 border-t border-white/10 flex items-center text-xs text-white/60 shrink-0 ${
            isCollapsed ? 'justify-center px-1' : 'px-2 gap-2'
          }`}
          title={state.onlineSpreadsheet?.syncStatus === 'error' ? "Armazenamento Local Ativo (Falha de comunicação com a planilha)" : "Armazenamento Local Ativo"}
        >
          <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${state.onlineSpreadsheet?.syncStatus === 'error' ? 'bg-amber-400 animate-ping' : 'bg-emerald-400 animate-pulse'}`}></span>
          {!isCollapsed && <span className="truncate font-semibold">Armazenamento Local Ativo</span>}
        </div>
      )}

      {/* Discreet Version Tag at bottom of sidebar */}
      <div className={`pt-2 text-[10px] text-white/40 font-mono font-medium tracking-wide border-t border-white/5 shrink-0 ${isCollapsed ? 'text-center' : 'px-2'}`}>
        EscalaPro v3.2
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar (visible on md and larger) */}
      <aside
        className={`hidden md:flex bg-[var(--sidebar-bg)] text-[var(--sidebar-ink)] flex-col border-r border-[var(--line)] shrink-0 min-h-screen no-print transition-all duration-300 ${
          isCollapsed ? 'w-18 p-2.5' : 'w-64 p-4'
        }`}
      >
        {/* Top logo & collapse toggle */}
        <div
          className={`pb-3 mb-3 border-b border-white/10 flex items-center shrink-0 ${
            isCollapsed ? 'justify-center flex-col gap-2' : 'justify-between px-2'
          }`}
        >
          {isCollapsed ? (
            <div
              className="w-9 h-9 rounded-xl bg-blue-600 text-white font-black flex items-center justify-center text-sm shadow-xs cursor-pointer"
              title="EscalaPro — Clique para expandir"
              onClick={toggleSidebarCollapsed}
            >
              EP
            </div>
          ) : (
            <EscalaProLogo size="md" variant="dark" />
          )}

          <button
            onClick={toggleSidebarCollapsed}
            className="p-1.5 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-lg transition-colors cursor-pointer"
            title={isCollapsed ? 'Expandir menu lateral' : 'Recolher menu lateral (apenas ícones)'}
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4 text-white" />
            ) : (
              <ChevronLeft className="w-4 h-4 text-white" />
            )}
          </button>
        </div>

        {navContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex no-print">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
            aria-hidden="true"
          />

          {/* Slide-in drawer */}
          <div className="relative z-10 w-72 max-w-[85vw] bg-[var(--sidebar-bg)] text-[var(--sidebar-ink)] flex flex-col p-4 shadow-2xl border-r border-white/10 h-full">
            <div className="flex items-center justify-between px-2 py-3 mb-4 border-b border-white/10 shrink-0">
              <EscalaProLogo size="md" variant="dark" />
              <button
                onClick={onCloseMobile}
                className="p-1.5 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-lg transition-colors cursor-pointer"
                aria-label="Fechar menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {navContent}
          </div>
        </div>
      )}
    </>
  );
};

