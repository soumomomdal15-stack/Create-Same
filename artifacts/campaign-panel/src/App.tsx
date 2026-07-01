import React, { useState, useEffect } from 'react';
import DeviceSimulator from './components/DeviceSimulator';
import UserPanel from './components/UserPanel';
import AdminPanel from './components/AdminPanel';
import LoginPage from './components/LoginPage';
import { CampaignStore } from './utils/store';

export default function App() {
  const [activePanel, setActivePanel] = useState<'login' | 'user' | 'admin'>(() => {
    CampaignStore.initialize();
    const params = new URLSearchParams(window.location.search);
    const panel = params.get('panel');
    if (panel === 'admin') return 'admin';
    if (panel === 'user') return 'user';
    if (CampaignStore.isAdminAuthenticated) return 'admin';
    if (CampaignStore.currentUser) return 'user';
    return 'login';
  });

  const [themeMode, setThemeMode] = useState<'dark' | 'light'>('dark');
  const [dbStateTrigger, setDbStateTrigger] = useState<number>(0);

  useEffect(() => {
    CampaignStore.initialize();
  }, [dbStateTrigger]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (CampaignStore.currentUser) {
        if (CampaignStore.checkAndResetTodayEarnings(CampaignStore.currentUser)) {
          CampaignStore.saveSession();
          handleRefreshWorkspace();
        }
      }
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const toggleTheme = () => setThemeMode(t => t === 'light' ? 'dark' : 'light');

  const handleRefreshWorkspace = () => setDbStateTrigger(t => t + 1);

  const handleSwitchPanel = (panel: 'login' | 'user' | 'admin') => {
    setActivePanel(panel);
    const url = new URL(window.location.href);
    if (panel === 'login') {
      url.searchParams.delete('panel');
    } else {
      url.searchParams.set('panel', panel);
    }
    window.history.replaceState({}, '', url.toString());
  };

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 relative overflow-x-hidden ${
      themeMode === 'dark' ? 'dark bg-zinc-950 text-slate-100' : 'bg-slate-50 text-zinc-900'
    }`}>

      {activePanel === 'login' && (
        <LoginPage
          theme={themeMode}
          toggleTheme={toggleTheme}
          onLoginSuccess={(panel) => handleSwitchPanel(panel)}
        />
      )}

      {activePanel === 'user' && (
        <div className="flex-1 flex flex-col h-dvh sm:h-auto sm:min-h-screen relative bg-slate-100 dark:bg-zinc-950 overflow-hidden">
          <main className="flex-1 flex items-center justify-center w-full h-full relative overflow-hidden">
            <DeviceSimulator theme={themeMode}>
              <UserPanel
                theme={themeMode}
                refreshAdminDb={handleRefreshWorkspace}
                onLogout={() => handleSwitchPanel('login')}
              />
            </DeviceSimulator>
          </main>
        </div>
      )}

      {activePanel === 'admin' && (
        <div className="flex-1 flex flex-col min-h-screen">
          <main className="flex-1 flex flex-col animate-fade-in relative">
            <AdminPanel
              theme={themeMode}
              triggerRefresh={handleRefreshWorkspace}
              onLogout={() => handleSwitchPanel('login')}
            />
          </main>
        </div>
      )}

    </div>
  );
}
