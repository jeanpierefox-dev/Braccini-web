import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../hooks/useSettings';
import { LoginModal } from './LoginModal';
import { LogOut, LayoutDashboard, ShieldAlert, VolleyBall, Home, User as UserIcon } from 'lucide-react';

export function Navigation() {
  const { user, role, signOut, promoteToAdmin } = useAuth();
  const settings = useSettings();
  const [showLogin, setShowLogin] = useState(false);
  
  return (
    <nav className="bg-zinc-900 border-b border-zinc-800 text-slate-100 sticky top-0 z-50 print:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <a href="#home" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center font-black text-white text-xl shadow-lg shadow-blue-500/20 overflow-hidden">
                {settings.logoUrl ? (
                  <img src={settings.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  'V'
                )}
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-lg leading-tight tracking-tight uppercase">{settings.appName}</span>
                <span className="text-[10px] text-blue-400 uppercase tracking-[0.2em] font-medium">Plataforma</span>
              </div>
            </a>
          </div>
          
          <div className="flex items-center gap-6 text-xs font-semibold uppercase tracking-widest">
            <a href="#home" className="hidden md:flex items-center gap-1 text-zinc-400 hover:text-white transition-colors">
              <Home className="w-4 h-4" /> Inicio
            </a>
            
            {user ? (
              <>
                <a href="#dashboard" className="flex items-center gap-1 text-zinc-400 hover:text-white transition-colors">
                  <LayoutDashboard className="w-4 h-4" /> Contenido
                </a>
                <a href="#profile" className="flex items-center gap-1 text-zinc-400 hover:text-white transition-colors">
                  <UserIcon className="w-4 h-4" /> Mi Ficha
                </a>
                
                {role === 'admin' && (
                  <a href="#admin" className="flex items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors">
                    <ShieldAlert className="w-4 h-4" /> Panel Admin
                  </a>
                )}
                
                <div className="flex items-center gap-3 ml-4 pl-4 border-l border-zinc-700">
                  <div className="flex items-center gap-2 hidden md:flex">
                    {user.photoURL ? (
                      <img src={user.photoURL} alt="Avatar" className="w-8 h-8 rounded-full border border-zinc-600" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center">
                        <UserIcon className="w-4 h-4 text-zinc-300" />
                      </div>
                    )}
                    <div className="text-sm">
                      <p className="font-medium leading-tight">{user.displayName}</p>
                      <p className="text-xs text-zinc-400 capitalize">{role}</p>
                    </div>
                  </div>
                  
                  <button 
                    onClick={signOut}
                    className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                    title="Cerrar sesión"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                  
                  {role !== 'admin' && (
                     <button 
                      onClick={promoteToAdmin} 
                      className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-1 rounded hover:bg-zinc-700"
                      title="Promover a admin (Solo demo)"
                    >
                      Admin
                    </button>
                  )}
                </div>
              </>
            ) : (
              <button 
                onClick={() => setShowLogin(true)}
                className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-bold transition-all shadow-lg shadow-blue-600/20"
              >
                Acceder
              </button>
            )}
          </div>
        </div>
      </div>
      <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} />
    </nav>
  );
}
