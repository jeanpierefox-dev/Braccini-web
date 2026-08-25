import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../hooks/useSettings';
import { useVisitorTrial } from '../hooks/useVisitorTrial';
import { LoginModal } from './LoginModal';
import { 
  LogOut, 
  LayoutDashboard, 
  ShieldAlert, 
  Home as HomeIcon, 
  User as UserIcon, 
  Menu, 
  X,
  Megaphone,
  Sparkles,
  MessageSquare,
  Phone
} from 'lucide-react';

export function Navigation() {
  const { user, role, signOut, promoteToAdmin } = useAuth();
  const settings = useSettings();
  const { isTrialActive, daysRemaining, currentDay } = useVisitorTrial();
  const [showLogin, setShowLogin] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const currentHash = window.location.hash || '#home';

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <>
      {/* Optional Top Announcement Bar */}
      {settings.showAnnouncement && settings.announcementText && (
        <div 
          className="py-1.5 px-4 text-xs font-semibold text-white text-center flex items-center justify-center gap-2 print:hidden relative overflow-hidden z-50"
          style={{
            background: `linear-gradient(90deg, var(--club-primary, #2563eb), var(--club-accent, #f59e0b))`
          }}
        >
          <Megaphone className="w-3.5 h-3.5 shrink-0 animate-bounce" />
          <span className="truncate max-w-4xl">{settings.announcementText}</span>
        </div>
      )}

      <nav className="bg-zinc-900/95 backdrop-blur-md border-b border-zinc-800 text-slate-100 sticky top-0 z-40 print:hidden transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Club Brand / Logo */}
            <div className="flex items-center gap-3 min-w-0">
              <a 
                href="#home" 
                onClick={closeMobileMenu}
                className="flex items-center gap-3 hover:opacity-90 transition-opacity min-w-0"
              >
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white text-xl shadow-lg overflow-hidden shrink-0 transition-transform hover:scale-105"
                  style={{
                    backgroundColor: 'var(--club-primary, #2563eb)',
                    boxShadow: '0 4px 14px rgba(var(--club-primary-rgb, 37, 99, 235), 0.35)'
                  }}
                >
                  {settings.logoUrl ? (
                    <img src={settings.logoUrl} alt="Logo" className="w-full h-full object-contain p-1" />
                  ) : (
                    <span>{settings.appName.charAt(0) || 'V'}</span>
                  )}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-black text-sm sm:text-base md:text-lg leading-tight tracking-tight uppercase truncate text-white">
                    {settings.appName}
                  </span>
                  <span 
                    className="text-[10px] uppercase tracking-[0.2em] font-bold truncate"
                    style={{ color: 'var(--club-accent, #f59e0b)' }}
                  >
                    {settings.slogan ? settings.slogan.slice(0, 28) : 'Plataforma Deportiva'}
                  </span>
                </div>
              </a>
            </div>
            
            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center gap-3 lg:gap-5 text-xs font-bold uppercase tracking-wider">
              <a 
                href="#home" 
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors ${
                  currentHash === '#home' 
                    ? 'text-white' 
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                }`}
                style={currentHash === '#home' ? { color: 'var(--club-primary, #3b82f6)' } : {}}
              >
                <HomeIcon className="w-4 h-4" /> Inicio
              </a>
              
              {(user || isTrialActive) && (
                <a 
                  href="#dashboard" 
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors ${
                    currentHash === '#dashboard' 
                      ? 'text-white' 
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                  }`}
                  style={currentHash === '#dashboard' ? { color: 'var(--club-primary, #3b82f6)' } : {}}
                >
                  <LayoutDashboard className="w-4 h-4" /> 
                  <span>Entrenamientos</span>
                  {!user && isTrialActive && (
                    <span className="ml-1 text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.5 rounded-full font-black">
                      Día {currentDay}/7
                    </span>
                  )}
                </a>
              )}

              {user ? (
                <>
                  <a 
                    href="#profile" 
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors ${
                      currentHash === '#profile' 
                        ? 'text-white' 
                        : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                    }`}
                    style={currentHash === '#profile' ? { color: 'var(--club-primary, #3b82f6)' } : {}}
                  >
                    <UserIcon className="w-4 h-4" /> Mi Ficha
                  </a>
                  
                  {role === 'admin' && (
                    <a 
                      href="#admin" 
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-colors ${
                        currentHash === '#admin' 
                          ? 'text-white bg-zinc-800' 
                          : 'text-zinc-300 hover:text-white hover:bg-zinc-800'
                      }`}
                      style={{
                        borderColor: 'rgba(var(--club-primary-rgb, 37, 99, 235), 0.4)',
                        color: currentHash === '#admin' ? '#ffffff' : 'var(--club-primary, #3b82f6)'
                      }}
                    >
                      <ShieldAlert className="w-4 h-4" /> Panel Admin
                    </a>
                  )}
                  
                  <div className="flex items-center gap-3 ml-2 pl-3 border-l border-zinc-800">
                    <div className="flex items-center gap-2">
                      {user.photoURL ? (
                        <img 
                          src={user.photoURL} 
                          alt="Avatar" 
                          className="w-8 h-8 rounded-full border-2 object-cover" 
                          style={{ borderColor: 'var(--club-primary, #2563eb)' }}
                          referrerPolicy="no-referrer" 
                        />
                      ) : (
                        <div 
                          className="w-8 h-8 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: 'rgba(var(--club-primary-rgb, 37, 99, 235), 0.2)' }}
                        >
                          <UserIcon className="w-4 h-4 text-zinc-300" />
                        </div>
                      )}
                      <div className="text-left">
                        <p className="font-bold leading-tight truncate max-w-[110px] text-white">
                          {user.displayName || user.email?.split('@')[0]}
                        </p>
                        <p className="text-[10px] text-zinc-400 capitalize">{role}</p>
                      </div>
                    </div>
                    
                    <button 
                      onClick={signOut}
                      className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                      title="Cerrar sesión"
                      aria-label="Cerrar sesión"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-3">
                  <a
                    href="#contacto"
                    className="text-zinc-400 hover:text-white transition-colors"
                  >
                    Contacto
                  </a>
                  <button 
                    onClick={() => setShowLogin(true)}
                    className="text-white px-5 py-2 rounded-xl font-bold transition-all transform hover:scale-105 shadow-md flex items-center gap-2"
                    style={{
                      backgroundColor: 'var(--club-primary, #2563eb)',
                      boxShadow: '0 4px 14px rgba(var(--club-primary-rgb, 37, 99, 235), 0.3)'
                    }}
                  >
                    Acceder
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Menu Button (Hamburger) */}
            <div className="flex md:hidden items-center gap-2">
              {!user && (
                <button 
                  onClick={() => setShowLogin(true)}
                  className="text-white px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm"
                  style={{ backgroundColor: 'var(--club-primary, #2563eb)' }}
                >
                  Acceder
                </button>
              )}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2.5 rounded-lg bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700 transition-colors focus:outline-none focus:ring-2"
                style={{ outlineColor: 'var(--club-primary, #2563eb)' }}
                aria-label="Abrir menú de navegación"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>

          </div>
        </div>

        {/* Mobile Navigation Drawer / Panel */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-zinc-900/98 border-b border-zinc-800 px-4 pt-3 pb-6 space-y-3 shadow-2xl animate-in slide-in-from-top duration-200">
            {user ? (
              <div 
                className="flex items-center gap-3 p-3 rounded-xl bg-zinc-800/80 border border-zinc-700/60 mb-4"
              >
                {user.photoURL ? (
                  <img 
                    src={user.photoURL} 
                    alt="Avatar" 
                    className="w-10 h-10 rounded-full border-2 object-cover shrink-0" 
                    style={{ borderColor: 'var(--club-primary, #2563eb)' }}
                    referrerPolicy="no-referrer" 
                  />
                ) : (
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                    style={{ backgroundColor: 'rgba(var(--club-primary-rgb, 37, 99, 235), 0.2)' }}
                  >
                    <UserIcon className="w-5 h-5 text-zinc-300" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-white text-sm truncate">{user.displayName || user.email}</p>
                  <p 
                    className="text-xs font-semibold uppercase tracking-wider"
                    style={{ color: 'var(--club-accent, #f59e0b)' }}
                  >
                    Rol: {role}
                  </p>
                </div>
              </div>
            ) : isTrialActive ? (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span className="font-bold">Pase de Visita Activo (Día {currentDay}/7)</span>
                </div>
                <span className="text-[10px] bg-amber-500/20 px-2 py-0.5 rounded-full font-black">
                  {daysRemaining}d
                </span>
              </div>
            ) : null}

            <div className="grid grid-cols-1 gap-1.5 text-sm font-semibold uppercase tracking-wider">
              <a 
                href="#home" 
                onClick={closeMobileMenu}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors min-h-[44px] ${
                  currentHash === '#home' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white hover:bg-zinc-800/40'
                }`}
                style={currentHash === '#home' ? { borderLeft: '4px solid var(--club-primary, #2563eb)' } : {}}
              >
                <HomeIcon className="w-5 h-5" style={{ color: 'var(--club-primary, #3b82f6)' }} />
                <span>Inicio</span>
              </a>

              {(user || isTrialActive) && (
                <a 
                  href="#dashboard" 
                  onClick={closeMobileMenu}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl transition-colors min-h-[44px] ${
                    currentHash === '#dashboard' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white hover:bg-zinc-800/40'
                  }`}
                  style={currentHash === '#dashboard' ? { borderLeft: '4px solid var(--club-primary, #2563eb)' } : {}}
                >
                  <div className="flex items-center gap-3">
                    <LayoutDashboard className="w-5 h-5" style={{ color: 'var(--club-primary, #3b82f6)' }} />
                    <span>Entrenamientos</span>
                  </div>
                  {!user && isTrialActive && (
                    <span className="text-[10px] font-black uppercase bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full">
                      Pase {currentDay}/7
                    </span>
                  )}
                </a>
              )}

              {user && (
                <>
                  <a 
                    href="#profile" 
                    onClick={closeMobileMenu}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors min-h-[44px] ${
                      currentHash === '#profile' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white hover:bg-zinc-800/40'
                    }`}
                    style={currentHash === '#profile' ? { borderLeft: '4px solid var(--club-primary, #2563eb)' } : {}}
                  >
                    <UserIcon className="w-5 h-5" style={{ color: 'var(--club-primary, #3b82f6)' }} />
                    <span>Mi Ficha Deportiva</span>
                  </a>

                  {role === 'admin' && (
                    <a 
                      href="#admin" 
                      onClick={closeMobileMenu}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors min-h-[44px] ${
                        currentHash === '#admin' ? 'bg-zinc-800 text-white' : 'text-zinc-300 hover:text-white hover:bg-zinc-800/40'
                      }`}
                      style={{ 
                        borderLeft: '4px solid var(--club-accent, #f59e0b)',
                        backgroundColor: currentHash === '#admin' ? 'rgba(var(--club-primary-rgb, 37, 99, 235), 0.15)' : undefined
                      }}
                    >
                      <ShieldAlert className="w-5 h-5 text-amber-400" />
                      <span>Panel Administrador</span>
                    </a>
                  )}
                </>
              )}

              <a 
                href="#comentarios" 
                onClick={closeMobileMenu}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800/40 transition-colors min-h-[44px]"
              >
                <MessageSquare className="w-5 h-5 text-zinc-400" />
                <span>Muro de Comentarios</span>
              </a>

              <a 
                href="#contacto" 
                onClick={closeMobileMenu}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800/40 transition-colors min-h-[44px]"
              >
                <Phone className="w-5 h-5 text-zinc-400" />
                <span>Contacto y Canales</span>
              </a>
            </div>

            {user && (
              <div className="pt-3 border-t border-zinc-800 flex items-center justify-between">
                {role !== 'admin' && (
                  <button 
                    onClick={() => { promoteToAdmin(); closeMobileMenu(); }} 
                    className="text-xs bg-zinc-800 text-zinc-300 px-3 py-2 rounded-lg font-medium"
                  >
                    Activar Modo Admin
                  </button>
                )}
                <button 
                  onClick={() => { signOut(); closeMobileMenu(); }}
                  className="flex items-center gap-2 text-red-400 hover:text-red-300 px-4 py-2 rounded-lg hover:bg-red-500/10 transition-colors text-xs font-bold uppercase ml-auto"
                >
                  <LogOut className="w-4 h-4" /> Cerrar Sesión
                </button>
              </div>
            )}
          </div>
        )}
      </nav>

      <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} />
    </>
  );
}

