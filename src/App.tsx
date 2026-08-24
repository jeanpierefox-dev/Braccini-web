/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { useSettings } from './hooks/useSettings';
import { Navigation } from './components/Navigation';
import { Home } from './pages/Home';
import { Dashboard } from './pages/Dashboard';
import { AdminPanel } from './pages/AdminPanel';
import { Profile } from './pages/Profile';

function AppRouter() {
  const [hash, setHash] = useState(window.location.hash || '#home');
  const { user, role, loading } = useAuth();
  useSettings(); // Initialize global settings listeners (title, favicon)

  useEffect(() => {
    const onHashChange = () => setHash(window.location.hash || '#home');
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-black"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div></div>;
  }

  const renderContent = () => {
    if (hash === '#dashboard') {
      return user ? <Dashboard /> : <Home />;
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
    <div className="font-sans min-h-screen bg-black print:bg-white">
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
