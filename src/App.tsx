/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { useSettings } from './hooks/useSettings';
import { useVisitorTrial } from './hooks/useVisitorTrial';
import { Navigation } from './components/Navigation';
import { InitialLoader } from './components/InitialLoader';
import { Home } from './pages/Home';
import { Dashboard } from './pages/Dashboard';
import { AdminPanel } from './pages/AdminPanel';
import { Profile } from './pages/Profile';

function AppRouter() {
  const [hash, setHash] = useState(window.location.hash || '#home');
  const { user, role, loading } = useAuth();
  const { isTrialActive } = useVisitorTrial();
  useSettings(); // Initialize global settings and dynamic CSS variables

  useEffect(() => {
    const onHashChange = () => setHash(window.location.hash || '#home');
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  if (loading) {
    return <InitialLoader />;
  }

  const renderContent = () => {
    if (hash === '#dashboard') {
      return (user || isTrialActive) ? <Dashboard /> : <Home />;
    }
    if (hash === '#profile') {
      return user ? <Profile /> : <Home />;
    }
    if (hash === '#admin') {
      return role === 'admin' ? <AdminPanel /> : <Home />;
    }
    return <Home />;
  };

  return (
    <div className="font-sans min-h-screen bg-black text-slate-100 print:bg-white selection:bg-blue-600 selection:text-white">
      <Navigation />
      {renderContent()}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}
