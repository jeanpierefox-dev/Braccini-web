import { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../hooks/useSettings';
import { useVisitorTrial } from '../hooks/useVisitorTrial';
import { LoginModal } from '../components/LoginModal';
import { ClubCommentsSection } from '../components/ClubCommentsSection';
import { ContactSection } from '../components/ContactSection';
import { 
  ArrowRight, 
  Trophy, 
  Users, 
  Video, 
  ShieldCheck, 
  Medal, 
  Star,
  Sparkles,
  Play,
  Calendar,
  CheckCircle2
} from 'lucide-react';

export function Home() {
  const { user, role } = useAuth();
  const settings = useSettings();
  const { isTrialActive, startTrial, daysRemaining, currentDay } = useVisitorTrial();
  const [showLogin, setShowLogin] = useState(false);
  const [registeredPlayersCount, setRegisteredPlayersCount] = useState<number | null>(null);

  const primaryColor = settings.primaryColor || '#2563eb';
  const primaryRgb = settings.primaryRgb || '37, 99, 235';
  const accentColor = settings.accentColor || '#f59e0b';
  const accentRgb = settings.accentRgb || '245, 158, 11';

  // Listen to users count in real-time (Strictly excluding Admin directors)
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
      // Exclude Admin role from athletes count
      const athleteCount = snapshot.docs.filter(d => {
        const data = d.data();
        return data.role !== 'admin' && data.clubRole !== 'entrenador';
      }).length;
      setRegisteredPlayersCount(athleteCount);
    }, (err) => {
      console.warn("Could not count registered players:", err);
    });
    return () => unsubscribe();
  }, []);

  const handleActivateTrial = () => {
    startTrial();
    window.location.hash = '#dashboard';
  };

  const displayedAthletesCount = settings.statsAutoCountPlayers !== false && registeredPlayersCount !== null
    ? `${registeredPlayersCount} Atletas`
    : (settings.statsAthletes || '120+');
  
  return (
    <div className="min-h-screen bg-black flex flex-col font-sans text-slate-100">
      <main className="flex-1">
        
        {/* Hero Section */}
        <section className="relative bg-zinc-950 text-white overflow-hidden">
          <div className="absolute inset-0">
            <img 
              src={settings.heroBgUrl || "https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?q=80&w=2607&auto=format&fit=crop"} 
              alt="Club Background" 
              className="w-full h-full object-cover opacity-25"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
            <div 
              className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-20 blur-3xl"
              style={{ backgroundColor: primaryColor }}
            />
          </div>
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-32">
            <div className="max-w-3xl">
              
              {/* Slogan Badge */}
              <div 
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border mb-6 text-xs font-bold uppercase tracking-wider backdrop-blur-sm"
                style={{
                  backgroundColor: `rgba(${primaryRgb}, 0.12)`,
                  borderColor: `rgba(${primaryRgb}, 0.3)`,
                  color: '#ffffff'
                }}
              >
                <span className="w-2 h-2 rounded-full animate-ping" style={{ backgroundColor: accentColor }} />
                <span>{settings.slogan || 'Plataforma Oficial Deportiva'}</span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight mb-6 leading-tight">
                {settings.heroTitle ? (
                  <span>{settings.heroTitle}</span>
                ) : (
                  <>
                    Pasión, Disciplina y <span style={{ color: primaryColor }}>Victoria</span>
                  </>
                )}
              </h1>

              <p className="text-base sm:text-lg text-zinc-300 mb-8 max-w-2xl leading-relaxed">
                {settings.heroSubtitle || settings.description || 'Plataforma exclusiva para miembros del club. Accede a rutinas de entrenamiento, galerías de partidos, seguimiento de jugadores y contenido premium.'}
              </p>
              
              <div className="flex flex-wrap items-center gap-4">
                {!user ? (
                  <>
                    <button 
                      onClick={() => setShowLogin(true)}
                      className="inline-flex items-center gap-2.5 text-white px-7 py-3.5 rounded-xl text-sm sm:text-base font-bold transition-all transform hover:scale-105 shadow-xl min-h-[48px]"
                      style={{
                        backgroundColor: primaryColor,
                        boxShadow: `0 10px 25px -5px rgba(${primaryRgb}, 0.4)`
                      }}
                    >
                      <span>{settings.ctaButtonText || 'Acceso a Miembros'}</span>
                      <ArrowRight className="w-5 h-5" />
                    </button>

                    <button 
                      onClick={handleActivateTrial}
                      className="inline-flex items-center gap-2 bg-zinc-900/90 text-amber-300 hover:text-white px-6 py-3.5 rounded-xl text-sm font-bold transition-all border border-amber-500/40 hover:border-amber-400 min-h-[48px] shadow-lg"
                    >
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span>{isTrialActive ? `Pase Activo (Día ${currentDay}/7)` : 'Pase Gratis 7 Días'}</span>
                    </button>
                  </>
                ) : (
                  <>
                    <a 
                      href="#dashboard"
                      className="inline-flex items-center gap-2.5 text-white px-7 py-3.5 rounded-xl text-base font-bold transition-all transform hover:scale-105 border min-h-[48px]"
                      style={{
                        backgroundColor: primaryColor,
                        borderColor: `rgba(${primaryRgb}, 0.4)`,
                        boxShadow: `0 10px 25px -5px rgba(${primaryRgb}, 0.4)`
                      }}
                    >
                      <span>Ir a Entrenamientos</span>
                      <ArrowRight className="w-5 h-5" />
                    </a>

                    <a 
                      href="#profile"
                      className="inline-flex items-center gap-2 bg-zinc-900/90 text-zinc-300 hover:text-white px-6 py-3.5 rounded-xl text-sm font-semibold transition-colors border border-zinc-800 hover:border-zinc-700 min-h-[48px]"
                    >
                      {role === 'admin' ? 'Ficha de Dirección del Club' : 'Mi Ficha Deportiva'}
                    </a>
                  </>
                )}
              </div>

            </div>
          </div>
        </section>

        {/* Public Stats Section with Dynamic Counts */}
        <section className="py-12 bg-zinc-950 border-b border-zinc-800/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              
              {/* Tournaments Participated / Campeonatos */}
              <div className="bg-zinc-900/70 p-5 sm:p-6 rounded-2xl border border-zinc-800 text-center transition-all hover:border-zinc-700 shadow-md">
                <div 
                  className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
                  style={{ backgroundColor: `rgba(${primaryRgb}, 0.15)` }}
                >
                  <Trophy className="w-6 h-6" style={{ color: primaryColor }} />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-white mb-0.5">
                  {settings.statsChampionships || '18'}
                </div>
                <div className="text-[10px] sm:text-xs text-zinc-400 uppercase tracking-wider font-bold">
                  Torneos y Campeonatos
                </div>
              </div>
              
              {/* Registered Players / Athletes Count */}
              <div className="bg-zinc-900/70 p-5 sm:p-6 rounded-2xl border border-zinc-800 text-center transition-all hover:border-zinc-700 shadow-md">
                <div 
                  className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
                  style={{ backgroundColor: `rgba(${accentRgb}, 0.15)` }}
                >
                  <Users className="w-6 h-6" style={{ color: accentColor }} />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-white mb-0.5">
                  {displayedAthletesCount}
                </div>
                <div className="text-[10px] sm:text-xs text-zinc-400 uppercase tracking-wider font-bold">
                  Jugadores Registrados
                </div>
              </div>

              {/* Categories */}
              <div className="bg-zinc-900/70 p-5 sm:p-6 rounded-2xl border border-zinc-800 text-center transition-all hover:border-zinc-700 shadow-md">
                <div 
                  className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
                  style={{ backgroundColor: `rgba(${primaryRgb}, 0.15)` }}
                >
                  <Medal className="w-6 h-6" style={{ color: primaryColor }} />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-white mb-0.5">
                  {settings.statsCategories || 'Sub-13, Sub-15, Sub-17, Mayores'}
                </div>
                <div className="text-[10px] sm:text-xs text-zinc-400 uppercase tracking-wider font-bold">
                  Categorías del Club
                </div>
              </div>

              {/* Founded Year */}
              <div className="bg-zinc-900/70 p-5 sm:p-6 rounded-2xl border border-zinc-800 text-center transition-all hover:border-zinc-700 shadow-md">
                <div 
                  className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
                  style={{ backgroundColor: `rgba(${accentRgb}, 0.15)` }}
                >
                  <Star className="w-6 h-6" style={{ color: accentColor }} />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-white mb-0.5">
                  {settings.statsFoundedYear || '2015'}
                </div>
                <div className="text-[10px] sm:text-xs text-zinc-400 uppercase tracking-wider font-bold">
                  Fundado en
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* 7-Day Free Trial Banner for Visitors */}
        <section className="py-12 bg-gradient-to-b from-zinc-950 to-zinc-900/90 border-b border-zinc-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div 
              className="rounded-3xl p-8 sm:p-10 border relative overflow-hidden flex flex-col lg:flex-row items-center justify-between gap-8 shadow-2xl"
              style={{
                backgroundColor: `rgba(${primaryRgb}, 0.07)`,
                borderColor: `rgba(${primaryRgb}, 0.25)`
              }}
            >
              <div className="max-w-2xl">
                <div 
                  className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider mb-4 border"
                  style={{
                    backgroundColor: `rgba(${accentRgb}, 0.15)`,
                    borderColor: `rgba(${accentRgb}, 0.3)`,
                    color: accentColor
                  }}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Acceso de Visita Gratuito</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-white mb-3">
                  Prueba 7 Días Gratis de Entrenamientos y Tácticas
                </h2>
                <p className="text-zinc-300 text-sm sm:text-base leading-relaxed mb-6">
                  Conoce nuestra metodología deportiva sin costo. Explora videos de jugadas, tácticas de bloqueo y rutinas de preparación física guiadas por nuestros entrenadores certificados.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-zinc-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Sin necesidad de tarjeta ni registro</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Acceso completo por 7 días continuos</span>
                  </div>
                </div>
              </div>

              <div className="shrink-0 w-full lg:w-auto">
                <button
                  onClick={handleActivateTrial}
                  className="w-full lg:w-auto inline-flex items-center justify-center gap-3 text-white px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-wider shadow-2xl transition-transform hover:scale-105 min-h-[52px]"
                  style={{
                    backgroundColor: primaryColor,
                    boxShadow: `0 8px 25px rgba(${primaryRgb}, 0.45)`
                  }}
                >
                  <Play className="w-5 h-5 fill-current" />
                  <span>{isTrialActive ? `Continuar Visita (Día ${currentDay}/7)` : 'Activar Pase Gratis de 7 Días'}</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-16 sm:py-24 bg-black text-slate-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12 sm:mb-16">
              <span 
                className="text-xs font-bold uppercase tracking-[0.2em] mb-2 block"
                style={{ color: primaryColor }}
              >
                Módulos Integrados
              </span>
              <h2 className="text-2xl sm:text-4xl font-black text-white mb-4">
                Plataforma Privada y de Rendimiento
              </h2>
              <p className="text-sm sm:text-base text-zinc-400 max-w-2xl mx-auto leading-relaxed">
                Gestionamos el progreso de nuestros deportistas con herramientas de alto nivel organizativo.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
              {/* Feature 1 */}
              <div className="bg-zinc-900/60 backdrop-blur-xl rounded-2xl p-6 sm:p-8 border border-zinc-800/80 shadow-lg hover:border-zinc-700 transition-colors">
                <div 
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6"
                  style={{ backgroundColor: `rgba(${primaryRgb}, 0.15)` }}
                >
                  <Video className="w-7 h-7" style={{ color: primaryColor }} />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white mb-2">
                  {settings.feature1Title || 'Videos de Entrenamiento'}
                </h3>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  {settings.feature1Desc || 'Analiza jugadas, perfecciona técnicas de saque, remate y bloqueo con material grabado por el cuerpo técnico.'}
                </p>
              </div>
              
              {/* Feature 2 */}
              <div className="bg-zinc-900/60 backdrop-blur-xl rounded-2xl p-6 sm:p-8 border border-zinc-800/80 shadow-lg hover:border-zinc-700 transition-colors">
                <div 
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6"
                  style={{ backgroundColor: `rgba(${accentRgb}, 0.15)` }}
                >
                  <Users className="w-7 h-7" style={{ color: accentColor }} />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white mb-2">
                  {settings.feature2Title || 'Fichas Deportivas y Médicas'}
                </h3>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  {settings.feature2Desc || 'Registro completo de cada integrante con su foto deportiva formal, número de camiseta, posición y contactos de emergencia.'}
                </p>
              </div>
              
              {/* Feature 3 */}
              <div className="bg-zinc-900/60 backdrop-blur-xl rounded-2xl p-6 sm:p-8 border border-zinc-800/80 shadow-lg hover:border-zinc-700 transition-colors">
                <div 
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6"
                  style={{ backgroundColor: `rgba(${primaryRgb}, 0.15)` }}
                >
                  <ShieldCheck className="w-7 h-7" style={{ color: primaryColor }} />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white mb-2">
                  {settings.feature3Title || 'Control de Tesorería'}
                </h3>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  {settings.feature3Desc || 'Seguimiento transparente de mensualidades, cuotas de uniformes y generación de comprobantes para miembros y familias.'}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Athlete & Public Comments Section */}
        <ClubCommentsSection />

        {/* Contact & Social Section */}
        <ContactSection />

      </main>
      
      <footer className="py-6 bg-black border-t border-zinc-900 flex flex-col sm:flex-row items-center justify-between px-4 sm:px-8 text-xs text-zinc-500 gap-3">
        <div className="flex items-center gap-2">
          {settings.logoUrl && <img src={settings.logoUrl} alt="Logo" className="w-5 h-5 object-contain" />}
          <span className="font-bold uppercase tracking-wider text-zinc-400">{settings.appName}</span>
        </div>
        <p className="text-[11px] font-mono tracking-wider uppercase">
          © {new Date().getFullYear()} {settings.appName}. Todos los derechos reservados.
        </p>
        <div className="flex items-center gap-4 text-xs">
          <span>{settings.statsFoundedYear ? `Fundado en ${settings.statsFoundedYear}` : 'Vóley Club'}</span>
        </div>
      </footer>
      
      <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} />
    </div>
  );
}

