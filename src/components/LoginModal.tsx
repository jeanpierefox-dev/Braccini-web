import { useState, type FormEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../hooks/useSettings';
import { useVisitorTrial } from '../hooks/useVisitorTrial';
import { X, Lock, User, AlertCircle, Sparkles, ArrowRight } from 'lucide-react';

export function LoginModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { loginWithCredentials } = useAuth();
  const { isTrialActive, startTrial } = useVisitorTrial();
  const settings = useSettings();

  if (!isOpen) return null;

  const primaryColor = settings.primaryColor || '#2563eb';
  const primaryRgb = settings.primaryRgb || '37, 99, 235';
  const accentColor = settings.accentColor || '#f59e0b';
  const accentRgb = settings.accentRgb || '245, 158, 11';

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;
    setIsLoading(true);
    setError('');
    try {
      await loginWithCredentials(username, password);
      onClose();
    } catch (err: any) {
      setError('Credenciales incorrectas. Verifique su usuario y contraseña.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartTrial = () => {
    startTrial();
    onClose();
    window.location.hash = '#dashboard';
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl w-full max-w-sm p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition-colors"
          aria-label="Cerrar modal"
        >
          <X className="w-5 h-5" />
        </button>
        
        <div className="text-center mb-6">
          <div 
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg overflow-hidden border"
            style={{
              backgroundColor: `rgba(${primaryRgb}, 0.15)`,
              borderColor: `rgba(${primaryRgb}, 0.3)`
            }}
          >
            {settings.logoUrl ? (
               <img src={settings.logoUrl} alt="Logo" className="w-12 h-12 object-contain" />
            ) : (
               <div className="font-black text-2xl" style={{ color: primaryColor }}>
                 {settings.appName.charAt(0) || 'V'}
               </div>
            )}
          </div>
          <h2 className="text-xl font-black text-white uppercase tracking-tight">{settings.appName}</h2>
          <p className="text-zinc-400 text-xs mt-1 uppercase tracking-widest font-semibold">Acceso a Miembros</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" style={{ color: primaryColor }} />
              <span>Usuario</span>
            </label>
            <input 
              type="text" 
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 transition-all"
              style={{ ['--tw-ring-color' as any]: primaryColor }}
              placeholder="Ej. adm o nombre_usuario"
              autoFocus
              required
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" style={{ color: primaryColor }} />
              <span>Contraseña</span>
            </label>
            <input 
              type="password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 transition-all"
              style={{ ['--tw-ring-color' as any]: primaryColor }}
              placeholder="••••••••"
              required
            />
          </div>
          
          <button 
            type="submit"
            disabled={isLoading}
            className="w-full mt-6 text-white font-bold py-3.5 rounded-xl shadow-lg transition-all transform hover:scale-105 uppercase tracking-wider text-xs min-h-[44px] disabled:opacity-60"
            style={{
              backgroundColor: primaryColor,
              boxShadow: `0 4px 14px rgba(${primaryRgb}, 0.4)`
            }}
          >
            {isLoading ? 'Accediendo...' : 'Iniciar Sesión'}
          </button>
        </form>

        {/* 7-Day Free Trial Quick Access for Visitors */}
        <div className="mt-6 pt-6 border-t border-zinc-900 text-center">
          <div 
            className="p-4 rounded-2xl border text-left"
            style={{
              backgroundColor: `rgba(${accentRgb}, 0.08)`,
              borderColor: `rgba(${accentRgb}, 0.25)`
            }}
          >
            <div className="flex items-center gap-2 mb-1.5">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="text-xs font-bold text-white">¿Eres nuevo o visitante?</span>
            </div>
            <p className="text-[11px] text-zinc-400 mb-3 leading-relaxed">
              Disfruta de 7 días de acceso gratuito de visita para explorar nuestras rutinas y entrenamientos.
            </p>
            <button
              type="button"
              onClick={handleStartTrial}
              className="w-full py-2.5 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-amber-300 hover:text-white border border-amber-500/40 text-xs font-bold transition-all flex items-center justify-center gap-2 min-h-[40px]"
            >
              <span>{isTrialActive ? 'Continuar con Pase de Visita' : 'Activar Pase Gratis (7 Días)'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

