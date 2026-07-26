import React from 'react';
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
} from 'lucide-react';
import { EscalaProLogo } from './EscalaProLogo';

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
  const navItems = [
    { id: 'home', label: 'Visão geral', icon: Home },
    { id: 'calendar', label: 'Calendário anual', icon: Calendar },
    { id: 'team', label: 'Equipe e cadastros', icon: Users },
    { id: 'presence', label: 'Presença de hoje', icon: CheckSquare },
    { id: 'assignment', label: 'Dimensionamento', icon: Shuffle },
    { id: 'breaks', label: 'Intervalos', icon: Clock },
    { id: 'share', label: 'Compartilhar', icon: Share2 },
    { id: 'report', label: 'Relatório diário', icon: FileText },
    { id: 'settings', label: 'Configurações', icon: Settings },
    { id: 'help', label: 'Ajuda', icon: HelpCircle },
  ];

  const handleSelect = (id: string) => {
    onNavigate(id);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const navContent = (
    <>
      <nav className="flex-1 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleSelect(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer ${
                isActive
                  ? 'bg-[var(--sidebar-active)] text-white shadow-sm font-semibold'
                  : 'text-white/80 hover:bg-[var(--sidebar-hover)] hover:text-white'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-white/70'}`} />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="mt-auto pt-4 border-t border-white/10 px-2 flex items-center gap-2 text-xs text-white/60 shrink-0">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        <span className="truncate">Armazenamento Local Ativo</span>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar (visible on md and larger) */}
      <aside className="hidden md:flex w-64 bg-[var(--sidebar-bg)] text-[var(--sidebar-ink)] flex-col p-4 border-r border-[var(--line)] shrink-0 min-h-screen no-print transition-colors duration-200">
        <div className="px-2 py-3.5 mb-4 border-b border-white/10">
          <EscalaProLogo size="md" variant="dark" />
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

