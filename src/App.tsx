import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { InteractiveEmployeePortal } from './components/InteractiveEmployeePortal';
import { OnboardingTutorial } from './components/OnboardingTutorial';

import { HomeView } from './views/HomeView';
import { CalendarView } from './views/CalendarView';
import { TeamView } from './views/TeamView';
import { PresenceView } from './views/PresenceView';
import { AssignmentView } from './views/AssignmentView';
import { BreaksView } from './views/BreaksView';
import { ShareView } from './views/ShareView';
import { ReportView } from './views/ReportView';
import { SettingsView } from './views/SettingsView';
import { HelpView } from './views/HelpView';

const TUTORIAL_SEEN_KEY = 'escalapro_tutorial_seen_v1';

const MainLayout: React.FC = () => {
  const { clearSampleData } = useApp();
  const [currentView, setCurrentView] = useState('home');
  const [isStandalonePortal, setIsStandalonePortal] = useState(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('view') === 'employee_portal') {
      setIsStandalonePortal(true);
    }

    // Auto-open tutorial on first visit
    try {
      const seen = localStorage.getItem(TUTORIAL_SEEN_KEY);
      if (!seen) {
        setIsTutorialOpen(true);
      }
    } catch {
      // Fallback
    }
  }, []);

  const handleCloseTutorial = () => {
    setIsTutorialOpen(false);
    try {
      localStorage.setItem(TUTORIAL_SEEN_KEY, 'true');
    } catch {
      // Fallback
    }
  };

  if (isStandalonePortal) {
    return (
      <InteractiveEmployeePortal
        isStandalonePortal={true}
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
      case 'help':
        return 'Ajuda & Guia de Uso';
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
      case 'help':
        return <HelpView onOpenTutorial={() => setIsTutorialOpen(true)} />;
      default:
        return <HomeView onNavigate={setCurrentView} />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg)] text-[var(--ink)] transition-colors duration-200">
      <Sidebar
        currentView={currentView}
        onNavigate={setCurrentView}
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        <Header
          pageTitle={getPageTitle(currentView)}
          onOpenTutorial={() => setIsTutorialOpen(true)}
          onToggleMobileMenu={() => setIsMobileMenuOpen(true)}
        />
        <div className="p-2.5 sm:p-3.5 md:p-4 flex-1">
          {renderView()}
        </div>
      </main>

      {/* Onboarding Tutorial Modal */}
      <OnboardingTutorial
        isOpen={isTutorialOpen}
        onClose={handleCloseTutorial}
        onClearSampleData={clearSampleData}
      />
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
