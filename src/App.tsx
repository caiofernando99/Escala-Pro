import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { InteractiveEmployeePortal } from './components/InteractiveEmployeePortal';

import { HomeView } from './views/HomeView';
import { CalendarView } from './views/CalendarView';
import { TeamView } from './views/TeamView';
import { PresenceView } from './views/PresenceView';
import { AssignmentView } from './views/AssignmentView';
import { BreaksView } from './views/BreaksView';
import { ShareView } from './views/ShareView';
import { ReportView } from './views/ReportView';
import { SettingsView } from './views/SettingsView';

const MainLayout: React.FC = () => {
  const [currentView, setCurrentView] = useState('home');
  const [isStandalonePortal, setIsStandalonePortal] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('view') === 'employee_portal') {
      setIsStandalonePortal(true);
    }
  }, []);

  if (isStandalonePortal) {
    return (
      <InteractiveEmployeePortal
        onClose={() => {
          setIsStandalonePortal(false);
          window.history.replaceState({}, '', window.location.pathname);
        }}
      />
    );
  }

  const getPageTitle = (view: string) => {
    switch (view) {
      case 'home':
        return 'Visão Geral da Operação';
      case 'calendar':
        return 'Calendário Anual da Escala 6x2';
      case 'team':
        return 'Equipe & Cadastros';
      case 'presence':
        return 'Presença de Hoje';
      case 'assignment':
        return 'Dimensionamento de Tarefas';
      case 'breaks':
        return 'Horários de Intervalo';
      case 'share':
        return 'Resumo para Compartilhar';
      case 'report':
        return 'Relatório Diário Operacional';
      case 'settings':
        return 'Configurações & Temas';
      default:
        return 'Visão Geral';
    }
  };

  const renderView = () => {
    switch (currentView) {
      case 'home':
        return <HomeView onNavigate={setCurrentView} />;
      case 'calendar':
        return <CalendarView />;
      case 'team':
        return <TeamView />;
      case 'presence':
        return <PresenceView />;
      case 'assignment':
        return <AssignmentView />;
      case 'breaks':
        return <BreaksView />;
      case 'share':
        return <ShareView />;
      case 'report':
        return <ReportView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <HomeView onNavigate={setCurrentView} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-[var(--bg)] text-[var(--ink)] transition-colors duration-200">
      <Sidebar currentView={currentView} onNavigate={setCurrentView} />
      <main className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        <Header pageTitle={getPageTitle(currentView)} />
        <div className="p-6 flex-1">
          {renderView()}
        </div>
      </main>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
