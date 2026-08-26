import { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { MediaItem } from '../types';
import { useSettings } from '../hooks/useSettings';
import { useAuth } from '../contexts/AuthContext';
import { useVisitorTrial } from '../hooks/useVisitorTrial';
import { 
  Video, 
  Image as ImageIcon, 
  Calendar, 
  Sparkles, 
  UserPlus, 
  Clock, 
  Lock, 
  Unlock, 
  ShieldCheck, 
  Zap, 
  MessageCircle, 
  Trophy, 
  Flame, 
  Layers, 
  CheckCircle2, 
  X,
  CreditCard
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';

export function Dashboard() {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const settings = useSettings();
  const { user, userProfile, role } = useAuth();
  const { isTrialActive, daysRemaining, currentDay } = useVisitorTrial();

  const [selectedPlanModal, setSelectedPlanModal] = useState<{
    months: number;
    title: string;
    price: number;
  } | null>(null);

  const primaryColor = settings.primaryColor || '#2563eb';
  const primaryRgb = settings.primaryRgb || '37, 99, 235';
  const accentColor = settings.accentColor || '#f59e0b';
  const accentRgb = settings.accentRgb || '245, 158, 11';

  const price1Month = settings.plan1MonthPrice || 80;
  const price3Months = settings.plan3MonthsPrice || 220;
  const price12Months = settings.plan12MonthsPrice || 750;
  const paymentInfo = settings.membershipPaymentInfo || 'Yape / Plin al 987-654-321 (Titanes Voley Club) o Transferencia BCP Cta: 191-8829103-0-45';
  const clubWhatsApp = settings.contactWhatsApp || settings.contactPhone || '+51 987 654 321';

  const isAdmin = role === 'admin' || user?.email === 'admin@club.com';

  // Membership status evaluation
  const membershipEnd = userProfile?.membershipEndDate ? new Date(userProfile.membershipEndDate) : null;
  const isMembershipActive = isAdmin || isTrialActive || (membershipEnd && membershipEnd >= new Date()) || (userProfile?.hasAccessToPrivatePlatform === true);
  const remainingMembershipDays = membershipEnd ? Math.max(0, differenceInDays(membershipEnd, new Date())) : 0;

  useEffect(() => {
    const q = query(collection(db, 'media'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const mediaData: MediaItem[] = [];
      snapshot.forEach((doc) => {
        mediaData.push({ id: doc.id, ...doc.data() } as MediaItem);
      });
      setMedia(mediaData);
      setLoading(false);
    }, (error) => {
      console.warn("Error fetching media:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredMedia = filter === 'all' 
    ? media 
    : media.filter(m => {
        if (filter === 'entrenos') {
          return m.type === 'training' || m.type === 'entrenos' || m.category === 'entrenos';
        }
        if (filter === 'partidos') {
          return m.type === 'partidos' || m.category === 'partidos';
        }
        if (filter === 'paseos') {
          return m.type === 'paseos' || m.category === 'paseos';
        }
        if (filter === 'general') {
          return m.type === 'general' || m.type === 'player' || m.category === 'institucional' || m.category === 'general';
        }
        return m.type === filter || m.category === filter;
      });

  const isVideo = (url: string) => {
    return url.includes('youtube.com') || url.includes('youtu.be') || url.includes('vimeo.com') || url.match(/\.(mp4|webm|ogg)$/i);
  };

  const getWhatsAppRenewLink = (planTitle: string, price: number, months: number) => {
    const cleanPhone = clubWhatsApp.replace(/[^0-9]/g, '');
    const userName = userProfile?.name || user?.displayName || 'Deportista / Socio';
    const userEmail = user?.email || '';
    const text = encodeURIComponent(
      `Hola ${settings.appName}, deseo renovar mi membresía de *${planTitle}* (${months} ${months === 1 ? 'mes' : 'meses'}) por S/ ${price} para la Plataforma Privada de Entrenamientos.\n\nNombre: ${userName}\nCorreo: ${userEmail}`
    );
    return `https://wa.me/${cleanPhone}?text=${text}`;
  };

  // IF ACCESS IS LOCKED (NO MEMBERSHIP / EXPIRED / NOT LOGGED IN WITHOUT TRIAL)
  if (!isMembershipActive) {
    return (
      <div className="min-h-screen bg-black text-slate-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-8">
          
          {/* Locked Hero Card */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-8 sm:p-12 text-center shadow-2xl relative overflow-hidden">
            <div 
              className="absolute top-0 left-0 right-0 h-1.5"
              style={{ backgroundColor: '#ef4444' }}
            />

            <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-center justify-center mx-auto mb-5 shadow-lg">
              <Lock className="w-8 h-8" />
            </div>

            <span className="text-xs font-black uppercase tracking-[0.25em] text-red-400 block mb-2">
              Acceso Restringido a Miembros
            </span>

            <h1 className="text-2xl sm:text-4xl font-black text-white uppercase tracking-tight mb-3">
              Plataforma Privada de Entrenamientos
            </h1>

            <p className="text-sm sm:text-base text-zinc-400 max-w-xl mx-auto mb-8 leading-relaxed">
              {user 
                ? 'Tu membresía ha vencido o no cuenta con acceso activo. Renueva tu suscripción por 1, 3 o 12 meses para continuar visualizando las sesiones técnicas y tácticas.'
                : 'Esta sección contiene material técnico exclusivo para atletas federados y socios del club con membresía vigente.'}
            </p>

            {/* Quick Action Plan Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left mb-8">
              
              {/* 1 Mes */}
              <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 hover:border-zinc-700 transition-all flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase text-zinc-400 block">Plan Mensual</span>
                  <h3 className="text-base font-black text-white uppercase mt-0.5">1 Mes</h3>
                  <div className="text-2xl font-black text-white mt-2">S/ {price1Month}</div>
                  <p className="text-[11px] text-zinc-400 mt-1">30 días de acceso total a entrenamientos y videos.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedPlanModal({ months: 1, title: 'Plan Mensual Deportivo', price: price1Month })}
                  className="mt-4 w-full py-2 rounded-xl text-xs font-bold text-white bg-zinc-800 hover:bg-zinc-700 text-center"
                >
                  Renovar 1 Mes
                </button>
              </div>

              {/* 3 Meses */}
              <div 
                className="bg-gradient-to-b from-zinc-900 to-zinc-950 rounded-2xl border-2 p-5 flex flex-col justify-between shadow-xl relative"
                style={{ borderColor: primaryColor }}
              >
                <div>
                  <span className="text-[10px] font-black uppercase text-amber-400 block">Más Popular</span>
                  <h3 className="text-base font-black text-white uppercase mt-0.5">3 Meses</h3>
                  <div className="text-2xl font-black text-white mt-2">S/ {price3Months}</div>
                  <p className="text-[11px] text-zinc-300 mt-1">Trimestre formativo y táctico con seguimiento.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedPlanModal({ months: 3, title: 'Plan Trimestral Formativo', price: price3Months })}
                  className="mt-4 w-full py-2 rounded-xl text-xs font-black text-white text-center shadow-lg"
                  style={{ backgroundColor: primaryColor }}
                >
                  Renovar 3 Meses
                </button>
              </div>

              {/* 12 Meses */}
              <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 hover:border-zinc-700 transition-all flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase text-amber-400 block">Temporada</span>
                  <h3 className="text-base font-black text-white uppercase mt-0.5">12 Meses</h3>
                  <div className="text-2xl font-black text-white mt-2">S/ {price12Months}</div>
                  <p className="text-[11px] text-zinc-400 mt-1">1 año completo con todos los beneficios federados.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedPlanModal({ months: 12, title: 'Plan Anual Élite', price: price12Months })}
                  className="mt-4 w-full py-2 rounded-xl text-xs font-bold text-white bg-zinc-800 hover:bg-zinc-700 text-center"
                >
                  Renovar 12 Meses
                </button>
              </div>

            </div>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <a
                href="#home"
                className="px-5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-bold text-zinc-300 hover:text-white"
              >
                Volver al Inicio
              </a>
              <a
                href={`https://wa.me/${clubWhatsApp.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white flex items-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Contactar a Dirección por WhatsApp</span>
              </a>
            </div>
          </div>

        </div>

        {/* MODAL PAGO */}
        {selectedPlanModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg p-6 sm:p-8 shadow-2xl space-y-6">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                <div className="flex items-center gap-3">
                  <CreditCard className="w-5 h-5" style={{ color: primaryColor }} />
                  <div>
                    <h3 className="text-base font-black text-white uppercase">{selectedPlanModal.title}</h3>
                    <span className="text-xs text-zinc-400">{selectedPlanModal.months} Meses de Acceso</span>
                  </div>
                </div>
                <button onClick={() => setSelectedPlanModal(null)} className="text-zinc-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 rounded-xl border flex items-center justify-between" style={{ backgroundColor: `rgba(${primaryRgb}, 0.1)`, borderColor: `rgba(${primaryRgb}, 0.3)` }}>
                <span className="text-xs font-bold uppercase text-zinc-300">Cuota a Pagar:</span>
                <span className="text-xl font-black text-white">S/ {selectedPlanModal.price}.00 PEN</span>
              </div>

              <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-2 text-xs">
                <div className="font-bold text-zinc-200 uppercase tracking-wider">Medios de Pago:</div>
                <p className="text-zinc-300 font-mono whitespace-pre-line">{paymentInfo}</p>
              </div>

              <div className="flex gap-3">
                <a
                  href={getWhatsAppRenewLink(selectedPlanModal.title, selectedPlanModal.price, selectedPlanModal.months)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-3 rounded-xl font-bold text-xs uppercase text-white bg-emerald-600 hover:bg-emerald-500 text-center flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Enviar Comprobante</span>
                </a>
                <button
                  type="button"
                  onClick={() => setSelectedPlanModal(null)}
                  className="px-4 py-3 rounded-xl font-bold text-xs text-zinc-400 bg-zinc-800 hover:bg-zinc-700"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    );
  }

  // IF ACCESS IS GRANTED
  return (
    <div className="min-h-screen bg-black text-slate-100 py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Active Membership Banner for Logged in Athletes */}
        {user && !isAdmin && (
          <div 
            className="p-4 sm:p-5 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl backdrop-blur-xl"
            style={{
              backgroundColor: `rgba(${primaryRgb}, 0.08)`,
              borderColor: `rgba(${primaryRgb}, 0.3)`
            }}
          >
            <div className="flex items-center gap-3.5">
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 font-black shadow"
                style={{ backgroundColor: primaryColor }}
              >
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-black text-white">
                    Membresía Activa de {userProfile?.name || user.displayName || 'Atleta'}
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    🟢 {remainingMembershipDays} días restantes
                  </span>
                </div>
                <p className="text-xs text-zinc-300 mt-0.5">
                  {membershipEnd ? `Tu acceso a videos y rutinas está vigente hasta el ${format(membershipEnd, "d 'de' MMMM, yyyy", { locale: es })}.` : 'Acceso habilitado por la Administración.'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedPlanModal({ months: 3, title: 'Plan Trimestral Formativo', price: price3Months })}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white uppercase tracking-wider border hover:bg-zinc-800 transition-colors shrink-0"
              style={{ borderColor: `rgba(${primaryRgb}, 0.5)` }}
            >
              Renovar / Extender Cuota
            </button>
          </div>
        )}

        {/* Visitor 7-Day Trial Banner */}
        {!user && isTrialActive && (
          <div 
            className="p-5 sm:p-6 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xl backdrop-blur-xl animate-in slide-in-from-top-3"
            style={{
              backgroundColor: `rgba(${accentRgb}, 0.1)`,
              borderColor: `rgba(${accentRgb}, 0.35)`
            }}
          >
            <div className="flex items-center gap-3.5">
              <div 
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg font-black"
                style={{ backgroundColor: accentColor }}
              >
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm sm:text-base font-black text-white">
                    Pase de Visita Gratuito Activo (Día {currentDay} de 7)
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    <Clock className="w-3 h-3" /> {daysRemaining} {daysRemaining === 1 ? 'día restante' : 'días restantes'}
                  </span>
                </div>
                <p className="text-xs text-zinc-300 mt-0.5">
                  Estás visualizando todos los contenidos y rutinas técnicas del club en modo visitante.
                </p>
              </div>
            </div>

            <a 
              href="#home"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-lg uppercase tracking-wider transition-transform hover:scale-105 shrink-0"
              style={{
                backgroundColor: primaryColor,
                boxShadow: `0 4px 14px rgba(${primaryRgb}, 0.4)`
              }}
            >
              <UserPlus className="w-4 h-4" />
              <span>Inscribirme al Club</span>
            </a>
          </div>
        )}

        {/* Header and Filter */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: primaryColor }} />
              <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">Material de Entrenamiento y Actividades</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white uppercase tracking-tight">
              Biblioteca Multimedia y Táctica
            </h1>
            <p className="text-sm text-zinc-400 mt-1">Galería de entrenamientos técnicos, partidos oficiales, paseos institucionales y jugadas.</p>
          </div>
          
          {/* Categorized Filter Tabs (Entrenos, Partidos, Paseos, General) */}
          <div className="flex flex-wrap bg-zinc-900/80 rounded-xl p-1 border border-zinc-800 backdrop-blur-md self-start sm:self-auto gap-1">
            {[
              { id: 'all', label: 'Todos' },
              { id: 'entrenos', label: '🏐 Entrenos' },
              { id: 'partidos', label: '🏆 Partidos' },
              { id: 'paseos', label: '🌴 Paseos' },
              { id: 'general', label: '🏛️ General' }
            ].map((tab) => {
              const isActive = filter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setFilter(tab.id)}
                  className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
                    isActive 
                      ? 'text-white shadow-md' 
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
                  }`}
                  style={isActive ? {
                    backgroundColor: primaryColor,
                    boxShadow: `0 4px 14px rgba(${primaryRgb}, 0.3)`
                  } : {}}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-zinc-900/50 rounded-2xl h-72 animate-pulse border border-zinc-800" />
            ))}
          </div>
        ) : filteredMedia.length === 0 ? (
          <div className="bg-zinc-900/40 backdrop-blur-xl rounded-2xl border border-zinc-800 p-12 sm:p-20 text-center">
            <div 
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 border"
              style={{ 
                backgroundColor: `rgba(${primaryRgb}, 0.1)`,
                borderColor: `rgba(${primaryRgb}, 0.2)`
              }}
            >
              <ImageIcon className="w-8 h-8" style={{ color: primaryColor }} />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">No hay contenido en esta categoría</h3>
            <p className="text-sm text-zinc-400 max-w-md mx-auto">
              El cuerpo técnico y la directiva subirán próximamente nuevos videos y fotografías para esta sección.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMedia.map((item) => {
              const categoryLabel = 
                item.category === 'entrenos' || item.type === 'training' || item.type === 'entrenos' ? 'Entreno' :
                item.category === 'partidos' || item.type === 'partidos' ? 'Partido' :
                item.category === 'paseos' || item.type === 'paseos' ? 'Paseo e Integración' :
                'Institucional';

              return (
                <div 
                  key={item.id} 
                  className="bg-zinc-900/80 rounded-2xl border border-zinc-800/80 overflow-hidden shadow-xl transition-all duration-300 hover:border-zinc-700 group flex flex-col"
                >
                  <div className="aspect-video relative bg-zinc-950 overflow-hidden">
                    {isVideo(item.url) ? (
                      item.url.includes('youtube.com') || item.url.includes('youtu.be') ? (
                        <iframe 
                          className="w-full h-full"
                          src={`https://www.youtube.com/embed/${
                            item.url.includes('youtu.be/') 
                              ? item.url.split('youtu.be/')[1].split('?')[0]
                              : item.url.split('v=')[1]?.split('&')[0]
                          }`} 
                          allowFullScreen 
                        />
                      ) : (
                        <video src={item.url} controls className="w-full h-full object-cover" />
                      )
                    ) : (
                      <img 
                        src={item.url} 
                        alt={item.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                      />
                    )}
                    
                    <div 
                      className="absolute top-3 left-3 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider text-white flex items-center gap-1.5 shadow-lg backdrop-blur-md"
                      style={{
                        backgroundColor: categoryLabel === 'Entreno' ? primaryColor : (categoryLabel === 'Partido' ? '#ef4444' : accentColor)
                      }}
                    >
                      {isVideo(item.url) ? <Video className="w-3.5 h-3.5" /> : <ImageIcon className="w-3.5 h-3.5" />}
                      <span>{categoryLabel}</span>
                    </div>
                  </div>
                  
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-white mb-1.5 leading-snug group-hover:text-zinc-200 transition-colors">
                        {item.title}
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs text-zinc-400 mb-3">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{item.createdAt ? format(item.createdAt.toDate(), "d 'de' MMMM, yyyy", { locale: es }) : 'Reciente'}</span>
                      </div>
                      <p className="text-zinc-400 text-xs sm:text-sm line-clamp-3 leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
