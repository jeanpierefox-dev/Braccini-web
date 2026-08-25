import { useSettings } from '../hooks/useSettings';

export function InitialLoader() {
  const settings = useSettings();

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 text-center">
      <div className="relative mb-6">
        <div 
          className="w-20 h-20 rounded-2xl flex items-center justify-center p-3 shadow-2xl animate-pulse"
          style={{
            backgroundColor: 'rgba(var(--club-primary-rgb, 37, 99, 235), 0.15)',
            border: '2px solid var(--club-primary, #2563eb)'
          }}
        >
          {settings.logoUrl ? (
            <img src={settings.logoUrl} alt="Logo" className="w-full h-full object-contain" />
          ) : (
            <span className="text-3xl font-black text-white" style={{ color: 'var(--club-primary, #2563eb)' }}>
              {settings.appName.charAt(0) || 'V'}
            </span>
          )}
        </div>
        <div 
          className="absolute -inset-2 rounded-3xl opacity-30 blur-lg -z-10 animate-pulse"
          style={{ backgroundColor: 'var(--club-primary, #2563eb)' }}
        />
      </div>
      
      <h2 className="text-xl font-black text-white uppercase tracking-wider mb-1">
        {settings.appName}
      </h2>
      <p className="text-xs text-zinc-400 font-medium uppercase tracking-[0.2em] mb-6">
        {settings.slogan || 'Plataforma Oficial de Voleibol'}
      </p>

      <div className="w-48 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div 
          className="h-full rounded-full animate-[progress_1.5s_ease-in-out_infinite]"
          style={{ 
            backgroundColor: 'var(--club-primary, #2563eb)',
            width: '60%' 
          }}
        />
      </div>
      <span className="text-[11px] text-zinc-400 mt-3 font-mono">Cargando plataforma...</span>
    </div>
  );
}
