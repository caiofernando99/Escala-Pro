import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { InteractiveEmployeePortal } from './components/InteractiveEmployeePortal';
import { FloatingToast } from './components/FloatingToast';
import { OnboardingTutorial } from './components/OnboardingTutorial';
import { IncomingConnectionModal } from './components/IncomingConnectionModal';

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
import { BriefingView } from './views/BriefingView';

const TUTORIAL_SEEN_KEY = 'escalapro_tutorial_seen_v1';

const MainLayout: React.FC = () => {
  const { clearSampleData, setOnlineSpreadsheetConfig, syncToOnlineSpreadsheet, showNotice } = useApp();
  const [currentView, setCurrentView] = useState('home');
  const [isStandalonePortal, setIsStandalonePortal] = useState(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Cloud connection modal state
  const [isCloudConnectOpen, setIsCloudConnectOpen] = useState(false);
  const [urlParamsConnection, setUrlParamsConnection] = useState<{
    sheetUrl?: string;
    webhookUrl?: string;
    sheetName?: string;
    teamName?: string;
  } | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('view') === 'employee_portal') {
      setIsStandalonePortal(true);
    }

    // Check for share connection parameters in URL
    const connectSheet = params.get('connectSheet');
    const connectWebhook = params.get('connectWebhook');
    const sheetName = params.get('sheetName');
    const teamName = params.get('teamName');

    if (connectSheet || connectWebhook) {
      setUrlParamsConnection({
        sheetUrl: connectSheet || undefined,
        webhookUrl: connectWebhook || undefined,
        sheetName: sheetName || undefined,
        teamName: teamName || undefined,
      });
      setIsCloudConnectOpen(true);
    }

    // Auto-open tutorial on first visit
    try {
      const seen = localStorage.getItem(TUTORIAL_SEEN_KEY);
      if (!seen && !connectSheet && !connectWebhook) {
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

  const handleConnectCloudDataFromModal = (sheetUrl: string, webhookUrl: string, sheetName: string) => {
    setOnlineSpreadsheetConfig({
      name: sheetName || 'Planilha Compartilhada em Nuvem',
      url: sheetUrl,
      webhookUrl: webhookUrl || undefined,
      autoSyncEnabled: true,
    });
    setIsCloudConnectOpen(false);
    // Clear URL params cleanly
    window.history.replaceState({}, '', window.location.pathname);
    showNotice('Conexão em nuvem estabelecida com sucesso! Testando sincronização...');
    setTimeout(() => {
      syncToOnlineSpreadsheet();
    }, 500);
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
      case 'briefing':
        return 'Montagem de Slide';
      case 'portal':
        return 'Portal de Consulta do Colaborador';
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
      case 'briefing':
        return <BriefingView />;
      case 'portal':
        return <InteractiveEmployeePortal onClose={() => setCurrentView('home')} />;
      case 'share':
        return <ShareView onNavigate={setCurrentView} />;
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
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {renderView()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Onboarding Tutorial Modal */}
      <OnboardingTutorial
        isOpen={isTutorialOpen}
        onClose={handleCloseTutorial}
        onClearSampleData={clearSampleData}
        onConnectCloudData={() => setIsCloudConnectOpen(true)}
      />

      {/* Cloud Connection Modal (URL or First Run) */}
      <IncomingConnectionModal
        isOpen={isCloudConnectOpen}
        onClose={() => setIsCloudConnectOpen(false)}
        initialSheetUrl={urlParamsConnection?.sheetUrl}
        initialWebhookUrl={urlParamsConnection?.webhookUrl}
        initialSheetName={urlParamsConnection?.sheetName}
        teamName={urlParamsConnection?.teamName}
        onConfirmConnect={handleConnectCloudDataFromModal}
      />

      {/* Floating Action Notice Toast at Bottom */}
      <FloatingToast />
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
