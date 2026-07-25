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
} from 'lucide-react';
import { EscalaProLogo } from './EscalaProLogo';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate }) => {
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

  return (
    <aside className="w-64 bg-[var(--sidebar-bg)] text-[var(--sidebar-ink)] flex flex-col p-4 border-r border-[var(--line)] shrink-0 min-h-screen no-print transition-colors duration-200">
      {/* Brand Header */}
      <div className="px-2 py-3.5 mb-4 border-b border-white/10">
        <EscalaProLogo size="md" variant="dark" />
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-[var(--sidebar-active)] text-white shadow-sm font-semibold'
                  : 'text-white/80 hover:bg-[var(--sidebar-hover)] hover:text-white'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-white/70'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer status */}
      <div className="mt-auto pt-4 border-t border-white/10 px-2 flex items-center gap-2 text-xs text-white/60">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        <span className="truncate">Armazenamento Local Ativo</span>
      </div>
    </aside>
  );
};
