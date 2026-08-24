import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../hooks/useSettings';
import { LoginModal } from '../components/LoginModal';
import { ArrowRight, Trophy, Users, Video, Activity, Medal, Star } from 'lucide-react';

export function Home() {
  const { user } = useAuth();
  const settings = useSettings();
  const [showLogin, setShowLogin] = useState(false);
  
  return (
    <div className="min-h-screen bg-black flex flex-col font-sans">
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative bg-zinc-900 text-white overflow-hidden">
          <div className="absolute inset-0">
            <img 
              src="https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?q=80&w=2607&auto=format&fit=crop" 
              alt="Volleyball match" 
              className="w-full h-full object-cover opacity-30"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
          </div>
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 lg:py-48">
            <div className="max-w-3xl">
              <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6">
                Bienvenido a <span className="text-blue-500">{settings.appName}</span>
              </h1>
              <p className="text-xl text-zinc-300 mb-10 max-w-2xl leading-relaxed">
                Plataforma exclusiva para miembros del club. Accede a rutinas de entrenamiento, galerías de partidos, seguimiento de jugadores y contenido premium.
              </p>
              
              {!user ? (
                <button 
                  onClick={() => setShowLogin(true)}
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-xl text-lg font-bold transition-all transform hover:scale-105 shadow-lg shadow-blue-600/20"
                >
                  Acceso a Miembros <ArrowRight className="w-5 h-5" />
                </button>
              ) : (
                <a 
                  href="#dashboard"
                  className="inline-flex items-center gap-2 bg-zinc-800 text-white hover:bg-zinc-700 px-8 py-4 rounded-xl text-lg font-bold transition-all transform hover:scale-105 border border-zinc-700"
                >
                  Ir al Panel de Contenido <ArrowRight className="w-5 h-5" />
                </a>
              )}
            </div>
          </div>
        </section>

        {/* Public Stats Section */}
        <section className="py-16 bg-zinc-900 border-b border-zinc-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="bg-black p-6 rounded-2xl border border-zinc-800 text-center shadow-inner group hover:border-blue-500/50 transition-colors">
                <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <Trophy className="w-6 h-6 text-blue-400" />
                </div>
                <div className="text-3xl font-black text-white mb-1">15+</div>
                <div className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold">Campeonatos</div>
              </div>
              
              <div className="bg-black p-6 rounded-2xl border border-zinc-800 text-center shadow-inner group hover:border-red-500/50 transition-colors">
                <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <Users className="w-6 h-6 text-red-400" />
                </div>
                <div className="text-3xl font-black text-white mb-1">120</div>
                <div className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold">Atletas Activos</div>
              </div>

              <div className="bg-black p-6 rounded-2xl border border-zinc-800 text-center shadow-inner group hover:border-red-500/50 transition-colors">
                <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <Medal className="w-6 h-6 text-red-400" />
                </div>
                <div className="text-3xl font-black text-white mb-1">8</div>
                <div className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold">Categorías</div>
              </div>

              <div className="bg-black p-6 rounded-2xl border border-zinc-800 text-center shadow-inner group hover:border-purple-500/50 transition-colors">
                <div className="w-12 h-12 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <Star className="w-6 h-6 text-purple-400" />
                </div>
                <div className="text-3xl font-black text-white mb-1">2010</div>
                <div className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold">Año de Fundación</div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-20 bg-black text-slate-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-white mb-4">Plataforma Privada del Club</h2>
              <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
                Gestionamos el progreso de nuestros deportistas con herramientas de última generación.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-zinc-900/40 backdrop-blur-xl rounded-2xl p-8 border border-zinc-800 shadow-inner">
                <div className="bg-blue-500/10 border border-blue-500/20 w-14 h-14 rounded-xl flex items-center justify-center mb-6">
                  <Video className="w-7 h-7 text-blue-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Videos de Entrenamiento</h3>
                <p className="text-zinc-400 leading-relaxed">
                  Analiza tus jugadas, mejora tu técnica y repasa los ejercicios clave guiados por nuestros entrenadores profesionales.
                </p>
              </div>
              
              <div className="bg-zinc-900/40 backdrop-blur-xl rounded-2xl p-8 border border-zinc-800 shadow-inner">
                <div className="bg-red-500/10 border border-red-500/20 w-14 h-14 rounded-xl flex items-center justify-center mb-6">
                  <Users className="w-7 h-7 text-red-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Perfiles de Jugadores</h3>
                <p className="text-zinc-400 leading-relaxed">
                  Base de datos completa con galerías individuales, estadísticas y evolución deportiva de cada integrante del equipo.
                </p>
              </div>
              
              <div className="bg-zinc-900/40 backdrop-blur-xl rounded-2xl p-8 border border-zinc-800 shadow-inner">
                <div className="bg-red-500/10 border border-red-500/20 w-14 h-14 rounded-xl flex items-center justify-center mb-6">
                  <Trophy className="w-7 h-7 text-red-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Acceso Seguro (RBAC)</h3>
                <p className="text-zinc-400 leading-relaxed">
                  Protección de privacidad garantizada. Solo miembros autorizados tienen acceso al material interno mediante sistema de roles.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <footer className="h-12 bg-black border-t border-zinc-900 flex items-center justify-center text-[10px] font-mono text-zinc-600 tracking-wider uppercase">
        <p>© {new Date().getFullYear()} {settings.appName}. TODOS LOS DERECHOS RESERVADOS.</p>
      </footer>
      
      <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} />
    </div>
  );
}
