import { useState } from 'react';
import { ClubSettings, MediaItem, UserProfile } from '../types';
import { 
  Smartphone, 
  Tablet, 
  Monitor, 
  X, 
  Eye, 
  Trophy, 
  Users, 
  Medal, 
  Star, 
  Video, 
  Image as ImageIcon, 
  User as UserIcon,
  Phone,
  Calendar,
  HeartPulse,
  Hash,
  Target,
  Megaphone,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';

interface DevicePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  draftSettings: ClubSettings;
  sampleMedia?: MediaItem[];
  sampleUsers?: UserProfile[];
}

export function DevicePreviewModal({ 
  isOpen, 
  onClose, 
  draftSettings,
  sampleMedia = [],
  sampleUsers = []
}: DevicePreviewModalProps) {
  const [device, setDevice] = useState<'mobile' | 'tablet' | 'pc'>('pc');
  const [page, setPage] = useState<'home' | 'dashboard' | 'profile'>('home');

  if (!isOpen) return null;

  const primaryColor = draftSettings.primaryColor || '#2563eb';
  const primaryRgb = draftSettings.primaryRgb || '37, 99, 235';
  const accentColor = draftSettings.accentColor || '#f59e0b';
  const accentRgb = draftSettings.accentRgb || '245, 158, 11';

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex flex-col p-2 sm:p-4 animate-in fade-in duration-200">
      
      {/* Top Controller Bar */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3 sm:px-6 mb-3 flex flex-wrap items-center justify-between gap-3 shadow-xl">
        
        {/* Device Switcher */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 hidden sm:inline mr-1">
            Simulador:
          </span>
          <div className="flex bg-black p-1 rounded-xl border border-zinc-800">
            <button
              onClick={() => setDevice('mobile')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                device === 'mobile' 
                  ? 'bg-zinc-800 text-white shadow' 
                  : 'text-zinc-400 hover:text-white'
              }`}
              style={device === 'mobile' ? { color: primaryColor } : {}}
            >
              <Smartphone className="w-4 h-4" />
              <span className="hidden sm:inline">Celular (375px)</span>
            </button>
            <button
              onClick={() => setDevice('tablet')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                device === 'tablet' 
                  ? 'bg-zinc-800 text-white shadow' 
                  : 'text-zinc-400 hover:text-white'
              }`}
              style={device === 'tablet' ? { color: primaryColor } : {}}
            >
              <Tablet className="w-4 h-4" />
              <span className="hidden sm:inline">Tablet (768px)</span>
            </button>
            <button
              onClick={() => setDevice('pc')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                device === 'pc' 
                  ? 'bg-zinc-800 text-white shadow' 
                  : 'text-zinc-400 hover:text-white'
              }`}
              style={device === 'pc' ? { color: primaryColor } : {}}
            >
              <Monitor className="w-4 h-4" />
              <span className="hidden sm:inline">PC / Pantalla Completa</span>
            </button>
          </div>
        </div>

        {/* Page Switcher */}
        <div className="flex items-center gap-1 bg-black p-1 rounded-xl border border-zinc-800">
          <button
            onClick={() => setPage('home')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              page === 'home' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'
            }`}
            style={page === 'home' ? { borderBottom: `2px solid ${primaryColor}` } : {}}
          >
            Inicio
          </button>
          <button
            onClick={() => setPage('dashboard')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              page === 'dashboard' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'
            }`}
            style={page === 'dashboard' ? { borderBottom: `2px solid ${primaryColor}` } : {}}
          >
            Contenido
          </button>
          <button
            onClick={() => setPage('profile')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              page === 'profile' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'
            }`}
            style={page === 'profile' ? { borderBottom: `2px solid ${primaryColor}` } : {}}
          >
            Ficha Deportiva
          </button>
        </div>

        {/* Close Button */}
        <div className="flex items-center gap-2">
          <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-zinc-800/80 rounded-lg text-xs text-zinc-300">
            <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: primaryColor }} />
            <span>Tema aplicado en vivo</span>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition-colors"
            title="Cerrar vista previa"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

      </div>

      {/* Simulator Viewport Area */}
      <div className="flex-1 overflow-auto flex items-center justify-center p-2">
        <div 
          className={`bg-black text-slate-100 flex flex-col transition-all duration-300 relative ${
            device === 'mobile' 
              ? 'device-frame-mobile' 
              : device === 'tablet' 
              ? 'device-frame-tablet' 
              : 'device-frame-pc w-full'
          }`}
          style={{
            // Scope theme variables to the preview container
            ['--club-primary' as any]: primaryColor,
            ['--club-primary-rgb' as any]: primaryRgb,
            ['--club-accent' as any]: accentColor,
            ['--club-accent-rgb' as any]: accentRgb
          }}
        >

          {/* Top Announcement Bar in Preview */}
          {draftSettings.showAnnouncement && draftSettings.announcementText && (
            <div 
              className="py-1 px-3 text-[11px] font-semibold text-white text-center flex items-center justify-center gap-1.5 sticky top-0 z-20"
              style={{
                background: `linear-gradient(90deg, ${primaryColor}, ${accentColor})`
              }}
            >
              <Megaphone className="w-3 h-3 shrink-0 animate-bounce" />
              <span className="truncate">{draftSettings.announcementText}</span>
            </div>
          )}

          {/* Simulated Navbar */}
          <header className="bg-zinc-900 border-b border-zinc-800 px-4 py-3 sticky top-0 z-10 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-white text-sm shadow-md overflow-hidden shrink-0"
                style={{ backgroundColor: primaryColor }}
              >
                {draftSettings.logoUrl ? (
                  <img src={draftSettings.logoUrl} alt="Logo" className="w-full h-full object-contain p-0.5" />
                ) : (
                  <span>{draftSettings.appName.charAt(0) || 'V'}</span>
                )}
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-sm uppercase tracking-tight text-white leading-tight">
                  {draftSettings.appName}
                </span>
                <span className="text-[9px] uppercase tracking-wider font-bold" style={{ color: accentColor }}>
                  {draftSettings.slogan ? draftSettings.slogan.slice(0, 24) : 'Club Oficial'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span 
                className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg text-white"
                style={{ backgroundColor: primaryColor }}
              >
                Acceso
              </span>
            </div>
          </header>

          {/* PAGE: HOME */}
          {page === 'home' && (
            <div className="flex-1">
              {/* Hero */}
              <div className="relative bg-zinc-900 text-white overflow-hidden py-12 px-6">
                <div className="absolute inset-0">
                  <img 
                    src={draftSettings.heroBgUrl || "https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?q=80&w=2607&auto=format&fit=crop"} 
                    alt="Hero" 
                    className="w-full h-full object-cover opacity-25"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                </div>
                <div className="relative max-w-2xl mx-auto text-center">
                  <h1 className="text-2xl sm:text-4xl font-black tracking-tight mb-3">
                    {draftSettings.heroTitle || 'Bienvenido a'} <span style={{ color: primaryColor }}>{draftSettings.appName}</span>
                  </h1>
                  <p className="text-xs sm:text-sm text-zinc-300 mb-6 leading-relaxed">
                    {draftSettings.heroSubtitle || draftSettings.description}
                  </p>
                  <button 
                    className="text-white px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-lg transition-transform inline-flex items-center gap-2"
                    style={{
                      backgroundColor: primaryColor,
                      boxShadow: `0 8px 20px -4px rgba(${primaryRgb}, 0.5)`
                    }}
                  >
                    {draftSettings.ctaButtonText || 'Acceso a Miembros'} <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Stats Section */}
              <div className="py-8 px-4 bg-zinc-950 border-b border-zinc-800/80">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-4xl mx-auto">
                  <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 text-center">
                    <Trophy className="w-5 h-5 mx-auto mb-2" style={{ color: primaryColor }} />
                    <div className="text-xl font-black text-white">{draftSettings.statsChampionships || '15+'}</div>
                    <div className="text-[9px] text-zinc-400 uppercase tracking-wider font-bold">Campeonatos</div>
                  </div>
                  <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 text-center">
                    <Users className="w-5 h-5 mx-auto mb-2" style={{ color: accentColor }} />
                    <div className="text-xl font-black text-white">{draftSettings.statsAthletes || '120'}</div>
                    <div className="text-[9px] text-zinc-400 uppercase tracking-wider font-bold">Atletas</div>
                  </div>
                  <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 text-center">
                    <Medal className="w-5 h-5 mx-auto mb-2" style={{ color: primaryColor }} />
                    <div className="text-xl font-black text-white">{draftSettings.statsCategories || '8'}</div>
                    <div className="text-[9px] text-zinc-400 uppercase tracking-wider font-bold">Categorías</div>
                  </div>
                  <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 text-center">
                    <Star className="w-5 h-5 mx-auto mb-2" style={{ color: accentColor }} />
                    <div className="text-xl font-black text-white">{draftSettings.statsFoundedYear || '2010'}</div>
                    <div className="text-[9px] text-zinc-400 uppercase tracking-wider font-bold">Fundación</div>
                  </div>
                </div>
              </div>

              {/* Features */}
              <div className="p-6 max-w-4xl mx-auto">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-zinc-900/60 p-5 rounded-xl border border-zinc-800">
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center mb-3"
                      style={{ backgroundColor: `rgba(${primaryRgb}, 0.15)` }}
                    >
                      <Video className="w-5 h-5" style={{ color: primaryColor }} />
                    </div>
                    <h4 className="font-bold text-white text-sm mb-1">Videos de Entrenamiento</h4>
                    <p className="text-xs text-zinc-400">Técnicas y tácticas preparadas por el cuerpo técnico.</p>
                  </div>
                  <div className="bg-zinc-900/60 p-5 rounded-xl border border-zinc-800">
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center mb-3"
                      style={{ backgroundColor: `rgba(${accentRgb}, 0.15)` }}
                    >
                      <Users className="w-5 h-5" style={{ color: accentColor }} />
                    </div>
                    <h4 className="font-bold text-white text-sm mb-1">Fichas de Jugadores</h4>
                    <p className="text-xs text-zinc-400">Datos deportivos, fotos formales y seguimiento médico.</p>
                  </div>
                  <div className="bg-zinc-900/60 p-5 rounded-xl border border-zinc-800">
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center mb-3"
                      style={{ backgroundColor: `rgba(${primaryRgb}, 0.15)` }}
                    >
                      <ShieldAlert className="w-5 h-5" style={{ color: primaryColor }} />
                    </div>
                    <h4 className="font-bold text-white text-sm mb-1">Control Administrativo</h4>
                    <p className="text-xs text-zinc-400">Tesorería, uniformes y cuotas mensuales al día.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PAGE: DASHBOARD */}
          {page === 'dashboard' && (
            <div className="p-6 max-w-4xl mx-auto flex-1 w-full">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-xl font-bold text-white">Contenido Exclusivo</h2>
                  <p className="text-xs text-zinc-400">Galería de entrenamientos y jugadores para miembros.</p>
                </div>
                <div className="flex bg-zinc-900 p-1 rounded-lg border border-zinc-800 text-xs">
                  <span 
                    className="px-3 py-1 rounded-md text-white font-bold"
                    style={{ backgroundColor: primaryColor }}
                  >
                    Todos
                  </span>
                  <span className="px-3 py-1 rounded-md text-zinc-400">Entrenamientos</span>
                  <span className="px-3 py-1 rounded-md text-zinc-400">Jugadores</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden shadow-lg">
                  <div className="aspect-video bg-zinc-800 relative flex items-center justify-center">
                    <Video className="w-10 h-10" style={{ color: primaryColor }} />
                    <span 
                      className="absolute top-2 left-2 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded text-white"
                      style={{ backgroundColor: primaryColor }}
                    >
                      Entrenamiento
                    </span>
                  </div>
                  <div className="p-4">
                    <h4 className="font-bold text-white text-sm">Rutina de Remate y Bloqueo 1</h4>
                    <p className="text-xs text-zinc-400 mt-1">Ejercicios de potencia para rematadores y centrales.</p>
                  </div>
                </div>

                <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden shadow-lg">
                  <div className="aspect-video bg-zinc-800 relative flex items-center justify-center">
                    <ImageIcon className="w-10 h-10" style={{ color: accentColor }} />
                    <span 
                      className="absolute top-2 left-2 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded text-white"
                      style={{ backgroundColor: accentColor }}
                    >
                      Jugador
                    </span>
                  </div>
                  <div className="p-4">
                    <h4 className="font-bold text-white text-sm">Plantel Oficial Primera División</h4>
                    <p className="text-xs text-zinc-400 mt-1">Sesión fotográfica deportiva de la temporada.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PAGE: PROFILE */}
          {page === 'profile' && (
            <div className="p-6 max-w-xl mx-auto flex-1 w-full">
              <div className="flex items-center gap-4 mb-6 border-b border-zinc-800 pb-4">
                <div 
                  className="w-16 h-16 rounded-full flex items-center justify-center text-white border-2"
                  style={{ 
                    backgroundColor: `rgba(${primaryRgb}, 0.2)`,
                    borderColor: primaryColor
                  }}
                >
                  <UserIcon className="w-8 h-8" style={{ color: primaryColor }} />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white">Juan Pérez (Demostración)</h3>
                  <p className="text-xs" style={{ color: accentColor }}>Jugador Titular - Armador</p>
                </div>
              </div>

              <div className="bg-zinc-900/80 rounded-xl border border-zinc-800 p-4 space-y-3 text-xs">
                <div className="flex justify-between border-b border-zinc-800/80 pb-2">
                  <span className="text-zinc-400 flex items-center gap-1.5"><Hash className="w-3.5 h-3.5"/> Camiseta:</span>
                  <span className="font-bold text-white">#10</span>
                </div>
                <div className="flex justify-between border-b border-zinc-800/80 pb-2">
                  <span className="text-zinc-400 flex items-center gap-1.5"><Target className="w-3.5 h-3.5"/> Posición:</span>
                  <span className="font-bold text-white">Armador / Capitán</span>
                </div>
                <div className="flex justify-between border-b border-zinc-800/80 pb-2">
                  <span className="text-zinc-400 flex items-center gap-1.5"><HeartPulse className="w-3.5 h-3.5"/> Grupo Sanguíneo:</span>
                  <span className="font-bold text-white">O+</span>
                </div>
                <div className="flex justify-between pb-1">
                  <span className="text-zinc-400 flex items-center gap-1.5"><Phone className="w-3.5 h-3.5"/> Teléfono:</span>
                  <span className="font-bold text-white">+51 987 654 321</span>
                </div>
              </div>

              <div className="mt-4">
                <button 
                  className="w-full py-2.5 rounded-xl font-bold text-white text-xs shadow-md"
                  style={{ backgroundColor: primaryColor }}
                >
                  Guardar Ficha Deportiva
                </button>
              </div>
            </div>
          )}

          {/* Footer in Preview */}
          <footer className="bg-zinc-950 border-t border-zinc-900 py-3 text-center text-[9px] text-zinc-500 uppercase tracking-widest mt-auto">
            © {new Date().getFullYear()} {draftSettings.appName}. Todos los derechos reservados.
          </footer>

        </div>
      </div>

    </div>
  );
}
