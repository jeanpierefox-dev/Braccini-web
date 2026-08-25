import { useSettings } from '../hooks/useSettings';
import { 
  Phone, 
  Mail, 
  MapPin, 
  Instagram, 
  Facebook, 
  MessageCircle, 
  Send,
  ExternalLink,
  Share2
} from 'lucide-react';

export function ContactSection() {
  const settings = useSettings();

  const primaryColor = settings.primaryColor || '#2563eb';
  const primaryRgb = settings.primaryRgb || '37, 99, 235';
  const accentColor = settings.accentColor || '#f59e0b';

  // Format WhatsApp number to link
  const rawWhatsApp = settings.contactWhatsApp || settings.contactPhone || '';
  const cleanPhoneDigits = rawWhatsApp.replace(/\D/g, '');
  const whatsAppLink = cleanPhoneDigits 
    ? `https://wa.me/${cleanPhoneDigits.startsWith('51') ? cleanPhoneDigits : '51' + cleanPhoneDigits}?text=${encodeURIComponent(`Hola ${settings.appName}, deseo información sobre los entrenamientos e inscripciones.`)}`
    : null;

  return (
    <section id="contacto" className="py-16 sm:py-24 bg-black text-slate-100 border-t border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-12 sm:mb-16">
          <div 
            className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-3 border"
            style={{
              backgroundColor: `rgba(${primaryRgb}, 0.12)`,
              borderColor: `rgba(${primaryRgb}, 0.25)`,
              color: primaryColor
            }}
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Canales Oficiales</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-white mb-3">
            Contáctate con el Club
          </h2>
          <p className="text-sm sm:text-base text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            Estamos a tu disposición para informes, matrículas, partidos amistosos y consultas de entrenamientos.
          </p>
        </div>

        {/* Contact Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 mb-12">
          
          {/* WhatsApp Card */}
          <div className="bg-zinc-900/80 backdrop-blur-xl rounded-2xl p-6 border border-zinc-800/80 shadow-xl hover:border-emerald-500/50 transition-all group flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mb-4 text-emerald-400">
                <MessageCircle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-1">WhatsApp Directo</h3>
              <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
                Chatea directamente con la coordinación del club para inscripciones y dudas inmediatas.
              </p>
            </div>
            {whatsAppLink ? (
              <a 
                href={whatsAppLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-between w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all shadow-md"
              >
                <span>Escribir por WhatsApp</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            ) : (
              <div className="text-xs text-zinc-500 italic">No configurado</div>
            )}
          </div>

          {/* Email Card */}
          <div className="bg-zinc-900/80 backdrop-blur-xl rounded-2xl p-6 border border-zinc-800/80 shadow-xl hover:border-zinc-700 transition-all group flex flex-col justify-between">
            <div>
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 border"
                style={{
                  backgroundColor: `rgba(${primaryRgb}, 0.15)`,
                  borderColor: `rgba(${primaryRgb}, 0.3)`,
                  color: primaryColor
                }}
              >
                <Mail className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-1">Correo Electrónico</h3>
              <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
                Envíanos solicitudes formales, invitaciones a campeonatos o consultas institucionales.
              </p>
            </div>
            {settings.contactEmail ? (
              <a 
                href={`mailto:${settings.contactEmail}`}
                className="inline-flex items-center justify-between w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white font-bold px-4 py-2.5 rounded-xl text-xs transition-all border border-zinc-700 truncate"
              >
                <span className="truncate">{settings.contactEmail}</span>
                <Send className="w-4 h-4 shrink-0 ml-2" />
              </a>
            ) : (
              <div className="text-xs text-zinc-500 italic">No configurado</div>
            )}
          </div>

          {/* Location / Sede Card */}
          <div className="bg-zinc-900/80 backdrop-blur-xl rounded-2xl p-6 border border-zinc-800/80 shadow-xl hover:border-zinc-700 transition-all group flex flex-col justify-between">
            <div>
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 border"
                style={{
                  backgroundColor: `rgba(${primaryRgb}, 0.15)`,
                  borderColor: `rgba(${primaryRgb}, 0.3)`,
                  color: primaryColor
                }}
              >
                <MapPin className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-1">Sede de Entrenamientos</h3>
              <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
                {settings.contactLocation || 'Canchas principales del club deportivo.'}
              </p>
            </div>
            <div className="text-xs text-zinc-400 font-semibold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Horarios y sede deportiva activa</span>
            </div>
          </div>

        </div>

        {/* Social Networks Row: Facebook, TikTok, Instagram */}
        <div className="bg-zinc-900/50 backdrop-blur-md rounded-2xl p-6 border border-zinc-800 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h4 className="font-bold text-white text-base mb-1">Síguenos en Redes Sociales</h4>
            <p className="text-xs text-zinc-400">Publicamos resúmenes de partidos, momentos destacados y galerías de fotos.</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* WhatsApp Button */}
            {whatsAppLink && (
              <a
                href={whatsAppLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-zinc-800 hover:bg-emerald-600/90 text-zinc-200 hover:text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all border border-zinc-700 hover:border-emerald-500"
              >
                <MessageCircle className="w-4 h-4 text-emerald-400" />
                <span>WhatsApp</span>
              </a>
            )}

            {/* Facebook Button */}
            <a
              href={settings.socialFacebook || "https://facebook.com"}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-zinc-800 hover:bg-blue-600/90 text-zinc-200 hover:text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all border border-zinc-700 hover:border-blue-500"
            >
              <Facebook className="w-4 h-4 text-blue-400" />
              <span>Facebook</span>
            </a>

            {/* Instagram Button */}
            <a
              href={settings.socialInstagram || "https://instagram.com"}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-zinc-800 hover:bg-pink-600/90 text-zinc-200 hover:text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all border border-zinc-700 hover:border-pink-500"
            >
              <Instagram className="w-4 h-4 text-pink-400" />
              <span>Instagram</span>
            </a>

            {/* TikTok Button */}
            <a
              href={settings.socialTikTok || "https://tiktok.com"}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all border border-zinc-700"
            >
              <svg className="w-4 h-4 fill-current text-teal-400" viewBox="0 0 24 24">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.89 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.32 0 .62.06.9.16V9.45a6.37 6.37 0 0 0-.9-.07A6.34 6.34 0 0 0 3.15 15.7a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.75a8.28 8.28 0 0 0 3.76 1.45V6.69z" />
              </svg>
              <span>TikTok</span>
            </a>
          </div>
        </div>

      </div>
    </section>
  );
}
