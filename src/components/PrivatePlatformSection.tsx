import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../hooks/useSettings';
import { useVisitorTrial } from '../hooks/useVisitorTrial';
import { 
  Lock, 
  Unlock, 
  Video, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  ShieldCheck, 
  ArrowRight, 
  Smartphone, 
  Play, 
  Trophy, 
  Award, 
  ExternalLink,
  CreditCard,
  X,
  MessageCircle,
  Zap,
  Check
} from 'lucide-react';
import { format, parseISO, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';

export function PrivatePlatformSection() {
  const { user, userProfile, role } = useAuth();
  const settings = useSettings();
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

  // Check user active membership
  const hasMembershipEndDate = !!userProfile?.membershipEndDate;
  const membershipEnd = hasMembershipEndDate ? new Date(userProfile.membershipEndDate!) : null;
  const isMembershipActive = isAdmin || (membershipEnd && membershipEnd >= new Date()) || (userProfile?.hasAccessToPrivatePlatform === true);
  const remainingDays = membershipEnd ? Math.max(0, differenceInDays(membershipEnd, new Date())) : 0;

  const handleOpenPlan = (months: number, title: string, price: number) => {
    setSelectedPlanModal({ months, title, price });
  };

  const getWhatsAppRenewLink = (planTitle: string, price: number, months: number) => {
    const cleanPhone = clubWhatsApp.replace(/[^0-9]/g, '');
    const userName = userProfile?.name || user?.displayName || 'Deportista / Socio';
    const userEmail = user?.email || '';
    const text = encodeURIComponent(
      `Hola ${settings.appName}, deseo solicitar la activación / renovación del *${planTitle}* (${months} ${months === 1 ? 'mes' : 'meses'}) por S/ ${price} para la Plataforma Privada de Entrenamientos.\n\nNombre: ${userName}\nCorreo: ${userEmail}`
    );
    return `https://wa.me/${cleanPhone}?text=${text}`;
  };

  return (
    <section id="plataforma-privada" className="relative py-16 sm:py-24 bg-gradient-to-b from-zinc-950 via-black to-zinc-950 border-t border-b border-zinc-900 overflow-hidden">
      
      {/* Background Decorative Radial Glows */}
      <div 
        className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[400px] opacity-15 blur-[140px] pointer-events-none rounded-full"
        style={{ backgroundColor: primaryColor }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-900/90 border border-zinc-800 text-xs font-bold uppercase tracking-widest text-zinc-300 mb-4 shadow-lg">
            <Lock className="w-3.5 h-3.5" style={{ color: primaryColor }} />
            <span>Zona Exclusiva para Atletas y Socios</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black text-white uppercase tracking-tight">
            Plataforma Privada del Club
          </h2>
          <p className="text-sm sm:text-base text-zinc-400 mt-3 leading-relaxed">
            Acceso a entrenamientos tácticos en video HD, rutinas de preparación física de alto rendimiento, análisis de partidos y biblioteca técnica exclusiva por tiempo limitado (1, 3 y 12 meses).
          </p>
        </div>

        {/* LOGGED IN USER MEMBERSHIP STATUS BAR */}
        {user && (
          <div 
            className="mb-12 p-5 sm:p-6 rounded-2xl border backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-5 shadow-2xl"
            style={{
              backgroundColor: isMembershipActive ? `rgba(${primaryRgb}, 0.08)` : 'rgba(239, 68, 68, 0.08)',
              borderColor: isMembershipActive ? `rgba(${primaryRgb}, 0.3)` : 'rgba(239, 68, 68, 0.3)'
            }}
          >
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <div 
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shrink-0 font-black shadow-lg"
                style={{ backgroundColor: isMembershipActive ? primaryColor : '#ef4444' }}
              >
                {isMembershipActive ? <Unlock className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-base font-black text-white">
                    {userProfile?.name || user.displayName || user.email}
                  </span>
                  <span 
                    className={`inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                      isMembershipActive 
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                        : 'bg-red-500/20 text-red-300 border-red-500/40'
                    }`}
                  >
                    {isAdmin ? '👑 Administrador Ilimitado' : (isMembershipActive ? `🟢 Membresía Activa (${remainingDays} días)` : '🔴 Acceso Vencido')}
                  </span>
                </div>
                <p className="text-xs text-zinc-300 mt-0.5">
                  {isAdmin 
                    ? 'Tienes acceso total irrestricto a la gestión de entrenamientos y contenidos.'
                    : isMembershipActive && membershipEnd
                      ? `Vigente hasta el ${format(membershipEnd, "d 'de' MMMM, yyyy", { locale: es })}.`
                      : 'Tu plan ha expirado o requiere activación para visualizar los videos y rutinas privadas.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto shrink-0">
              {isMembershipActive ? (
                <a
                  href="#dashboard"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-white px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg transition-transform hover:scale-105"
                  style={{
                    backgroundColor: primaryColor,
                    boxShadow: `0 4px 14px rgba(${primaryRgb}, 0.4)`
                  }}
                >
                  <Play className="w-4 h-4" />
                  <span>Ingresar a Entrenamientos</span>
                </a>
              ) : (
                <button
                  type="button"
                  onClick={() => handleOpenPlan(1, 'Plan Mensual Deportivo', price1Month)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-white px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg transition-transform hover:scale-105 bg-red-600 hover:bg-red-500"
                >
                  <Zap className="w-4 h-4" />
                  <span>Renovar Acceso Ahora</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* 3 SUBSCRIPTION TIERS (1, 3, 12 Meses) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mb-12">
          
          {/* PLAN 1: 1 MES */}
          <div className="bg-zinc-900/80 rounded-2xl border border-zinc-800 p-6 sm:p-8 flex flex-col justify-between hover:border-zinc-700 transition-all shadow-xl relative group">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-black uppercase tracking-wider text-zinc-400">
                  Acceso Corto
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-zinc-800 text-[10px] font-bold text-zinc-300 border border-zinc-700">
                  1 Mes (30 días)
                </span>
              </div>

              <h3 className="text-xl font-black text-white uppercase mb-2">Plan Mensual</h3>
              <p className="text-xs text-zinc-400 mb-6">
                Ideal para evaluar la metodología formativa y seguir los entrenamientos del mes.
              </p>

              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-sm font-bold text-zinc-400">S/</span>
                <span className="text-4xl font-black text-white">{price1Month}</span>
                <span className="text-xs text-zinc-500">/ 30 días</span>
              </div>

              <ul className="space-y-3 text-xs text-zinc-300 mb-8 border-t border-zinc-800 pt-6">
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Acceso a videos HD de entrenamientos</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Rutinas técnicas y drills de posición</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Carnet deportivo oficial digital</span>
                </li>
                <li className="flex items-center gap-2.5 text-zinc-500">
                  <X className="w-4 h-4 shrink-0" />
                  <span>Descuento en uniformes oficiales</span>
                </li>
              </ul>
            </div>

            <button
              type="button"
              onClick={() => handleOpenPlan(1, 'Plan Mensual Deportivo', price1Month)}
              className="w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider text-white bg-zinc-800 hover:bg-zinc-700 transition-all text-center flex items-center justify-center gap-2"
            >
              <span>Solicitar Plan 1 Mes</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* PLAN 2: 3 MESES (DESTACADO / RECOMENDADO) */}
          <div 
            className="bg-gradient-to-b from-zinc-900 to-zinc-950 rounded-2xl border-2 p-6 sm:p-8 flex flex-col justify-between shadow-2xl relative group transform md:-translate-y-2"
            style={{
              borderColor: primaryColor,
              boxShadow: `0 10px 30px rgba(${primaryRgb}, 0.2)`
            }}
          >
            {/* Recommended Tag */}
            <div 
              className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-white shadow-lg flex items-center gap-1.5"
              style={{ backgroundColor: primaryColor }}
            >
              <Sparkles className="w-3 h-3" />
              <span>Más Popular • Trimestre</span>
            </div>

            <div>
              <div className="flex items-center justify-between mb-4 mt-2">
                <span className="text-xs font-black uppercase tracking-wider" style={{ color: accentColor }}>
                  Ciclo Formativo
                </span>
                <span 
                  className="px-2.5 py-0.5 rounded-full text-[10px] font-bold border"
                  style={{
                    backgroundColor: `rgba(${primaryRgb}, 0.15)`,
                    color: primaryColor,
                    borderColor: `rgba(${primaryRgb}, 0.3)`
                  }}
                >
                  3 Meses (90 días)
                </span>
              </div>

              <h3 className="text-xl font-black text-white uppercase mb-2">Plan Trimestral</h3>
              <p className="text-xs text-zinc-400 mb-6">
                Estructura recomendada para consolidar el desarrollo táctico y el rendimiento en cancha.
              </p>

              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-sm font-bold text-zinc-400">S/</span>
                <span className="text-4xl font-black text-white">{price3Months}</span>
                <span className="text-xs text-zinc-500">/ 90 días</span>
              </div>

              <ul className="space-y-3 text-xs text-zinc-200 mb-8 border-t border-zinc-800 pt-6">
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Acceso total a biblioteca de videos tácticos</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Seguimiento de cuotas y estado de pagos</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Pizarra de jugadas y drills avanzados</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Prioridad en convocatorias de partidos</span>
                </li>
              </ul>
            </div>

            <button
              type="button"
              onClick={() => handleOpenPlan(3, 'Plan Trimestral Formativo', price3Months)}
              className="w-full py-3 rounded-xl font-black text-xs uppercase tracking-wider text-white shadow-xl transition-all flex items-center justify-center gap-2 hover:opacity-95"
              style={{
                backgroundColor: primaryColor,
                boxShadow: `0 4px 15px rgba(${primaryRgb}, 0.4)`
              }}
            >
              <span>Solicitar Plan 3 Meses</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* PLAN 3: 12 MESES (ANUAL ÉLITE) */}
          <div className="bg-zinc-900/80 rounded-2xl border border-zinc-800 p-6 sm:p-8 flex flex-col justify-between hover:border-zinc-700 transition-all shadow-xl relative group">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-black uppercase tracking-wider text-amber-400">
                  Temporada Completa
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 text-[10px] font-bold border border-amber-500/30">
                  12 Meses (1 Año)
                </span>
              </div>

              <h3 className="text-xl font-black text-white uppercase mb-2">Plan Anual Élite</h3>
              <p className="text-xs text-zinc-400 mb-6">
                Membresía completa para toda la temporada con máximo ahorro y beneficios federados.
              </p>

              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-sm font-bold text-zinc-400">S/</span>
                <span className="text-4xl font-black text-white">{price12Months}</span>
                <span className="text-xs text-zinc-500">/ 365 días</span>
              </div>

              <ul className="space-y-3 text-xs text-zinc-300 mb-8 border-t border-zinc-800 pt-6">
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Acceso ilimitado por 12 meses continuos</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Ficha médica y carnet deportivo A4 oficial</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Descuento exclusivo en lote de uniformes</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Certificado oficial de temporada</span>
                </li>
              </ul>
            </div>

            <button
              type="button"
              onClick={() => handleOpenPlan(12, 'Plan Anual Élite', price12Months)}
              className="w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider text-white bg-zinc-800 hover:bg-zinc-700 transition-all text-center flex items-center justify-center gap-2"
            >
              <span>Solicitar Plan 12 Meses</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>

        {/* Feature Highlights Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 bg-zinc-950 p-6 sm:p-8 rounded-2xl border border-zinc-900">
          <div className="flex items-start gap-4">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow"
              style={{ backgroundColor: primaryColor }}
            >
              <Video className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-black text-white uppercase">Videos HD de Entrenamiento</h4>
              <p className="text-xs text-zinc-400 mt-1">Grabaciones de drills, remates, bloqueos y correcciones técnicas subidas semanalmente.</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow"
              style={{ backgroundColor: accentColor }}
            >
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-black text-white uppercase">Seguimiento de Rendimiento</h4>
              <p className="text-xs text-zinc-400 mt-1">Fichas técnicas individuales con alcance de salto, posición y estadísticas oficiales.</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center text-emerald-400 bg-emerald-500/20 border border-emerald-500/30 shrink-0"
            >
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-black text-white uppercase">Control de Pagos y Uniformes</h4>
              <p className="text-xs text-zinc-400 mt-1">Gestión transparente de cuotas mensuales, tallas y pedidos de indumentaria textil.</p>
            </div>
          </div>
        </div>

      </div>

      {/* PLAN PAYMENT / RENEWAL MODAL */}
      {selectedPlanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow"
                  style={{ backgroundColor: primaryColor }}
                >
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white uppercase">
                    Solicitud de Membresía
                  </h3>
                  <span className="text-xs text-zinc-400">
                    {selectedPlanModal.title} ({selectedPlanModal.months} {selectedPlanModal.months === 1 ? 'Mes' : 'Meses'})
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPlanModal(null)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Price Banner */}
            <div 
              className="p-4 rounded-xl border flex items-center justify-between"
              style={{
                backgroundColor: `rgba(${primaryRgb}, 0.1)`,
                borderColor: `rgba(${primaryRgb}, 0.3)`
              }}
            >
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">Cuota a Pagar:</span>
              <div className="text-xl font-black text-white">
                S/ {selectedPlanModal.price}.00 PEN
              </div>
            </div>

            {/* Payment instructions */}
            <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-2 text-xs">
              <div className="font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" style={{ color: accentColor }} />
                <span>Medios de Pago Oficiales del Club</span>
              </div>
              <p className="text-zinc-300 whitespace-pre-line leading-relaxed font-mono">
                {paymentInfo}
              </p>
              <p className="text-zinc-400 text-[11px] pt-1">
                * Realiza el abono y envía el comprobante por WhatsApp para que la Administración active tu cuenta inmediatamente por el periodo solicitado.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <a
                href={getWhatsAppRenewLink(selectedPlanModal.title, selectedPlanModal.price, selectedPlanModal.months)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider text-white bg-emerald-600 hover:bg-emerald-500 transition-all text-center flex items-center justify-center gap-2 shadow-lg"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Enviar Comprobante por WhatsApp</span>
              </a>
              <button
                type="button"
                onClick={() => setSelectedPlanModal(null)}
                className="py-3 px-4 rounded-xl font-bold text-xs text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 transition-all text-center"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

    </section>
  );
}
