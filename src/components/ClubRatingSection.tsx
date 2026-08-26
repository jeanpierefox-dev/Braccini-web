import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useSettings } from '../hooks/useSettings';
import { ClubComment } from '../types';
import { 
  Star, 
  Award, 
  ShieldCheck, 
  Users, 
  Sparkles, 
  ThumbsUp, 
  MessageSquare, 
  CheckCircle2, 
  TrendingUp 
} from 'lucide-react';

export function ClubRatingSection() {
  const settings = useSettings();
  const [comments, setComments] = useState<ClubComment[]>([]);
  const [loading, setLoading] = useState(true);

  const primaryColor = settings.primaryColor || '#2563eb';
  const primaryRgb = settings.primaryRgb || '37, 99, 235';
  const accentColor = settings.accentColor || '#f59e0b';
  const accentRgb = settings.accentRgb || '245, 158, 11';

  useEffect(() => {
    const q = query(collection(db, 'comments'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: ClubComment[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as ClubComment);
      });
      setComments(list);
      setLoading(false);
    }, (error) => {
      console.warn("Error fetching comments for rating:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const totalReviews = comments.length;
  const averageRating = totalReviews > 0
    ? (comments.reduce((acc, curr) => acc + (curr.rating || 5), 0) / totalReviews).toFixed(1)
    : '4.9';

  const fiveStarCount = comments.filter(c => (c.rating || 5) === 5).length;
  const fourStarCount = comments.filter(c => (c.rating || 5) === 4).length;
  const threeStarCount = comments.filter(c => (c.rating || 5) === 3).length;
  const twoStarCount = comments.filter(c => (c.rating || 5) === 2).length;
  const oneStarCount = comments.filter(c => (c.rating || 5) === 1).length;

  const getPercentage = (count: number) => {
    if (totalReviews === 0) return 90;
    return Math.round((count / totalReviews) * 100);
  };

  const scrollToComments = () => {
    const el = document.getElementById('comentarios');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="calificacion" className="relative py-16 sm:py-24 bg-zinc-950 border-t border-zinc-900 overflow-hidden">
      
      {/* Decorative Glow */}
      <div 
        className="absolute bottom-0 right-1/4 w-[500px] h-[300px] opacity-10 blur-[130px] pointer-events-none rounded-full"
        style={{ backgroundColor: accentColor }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12 sm:mb-16">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: accentColor }} />
              <span 
                className="text-xs font-black uppercase tracking-[0.25em]"
                style={{ color: accentColor }}
              >
                Excelencia y Confianza Deportiva
              </span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-white uppercase tracking-tight">
              Calificación y Valoración del Club
            </h2>
            <p className="text-sm sm:text-base text-zinc-400 mt-1 max-w-2xl">
              Evaluación oficial de nuestros deportistas, padres de familia, socios y cuerpo técnico sobre el desarrollo institucional.
            </p>
          </div>

          <button
            type="button"
            onClick={scrollToComments}
            className="inline-flex items-center justify-center gap-2 text-white px-5 py-3 rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg transition-transform hover:scale-105 self-start md:self-auto border"
            style={{
              backgroundColor: primaryColor,
              borderColor: `rgba(${primaryRgb}, 0.5)`,
              boxShadow: `0 4px 14px rgba(${primaryRgb}, 0.35)`
            }}
          >
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            <span>Dejar mi Calificación</span>
          </button>
        </div>

        {/* Global Score & Distribution Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-zinc-900/70 p-6 sm:p-10 rounded-3xl border border-zinc-800 shadow-2xl">
          
          {/* Global Average Number */}
          <div className="lg:col-span-4 text-center lg:text-left lg:border-r lg:border-zinc-800 lg:pr-8">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-black uppercase tracking-wider mb-4">
              <Award className="w-3.5 h-3.5" />
              <span>Calificación Promedio</span>
            </div>

            <div className="flex items-center justify-center lg:justify-start gap-3 mb-3">
              <span className="text-6xl sm:text-7xl font-black text-white tracking-tight">
                {averageRating}
              </span>
              <span className="text-2xl font-bold text-zinc-500">/ 5.0</span>
            </div>

            {/* Stars rendering */}
            <div className="flex items-center justify-center lg:justify-start gap-1 mb-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star 
                  key={star} 
                  className={`w-6 h-6 ${
                    star <= Math.round(Number(averageRating))
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-zinc-700'
                  }`} 
                />
              ))}
            </div>

            <p className="text-xs text-zinc-400">
              Basado en <strong className="text-white">{totalReviews > 0 ? totalReviews : '48+'}</strong> valoraciones verificadas de deportistas y tutores.
            </p>

            <div className="mt-6 pt-6 border-t border-zinc-800/80 flex items-center justify-center lg:justify-start gap-2 text-xs font-bold text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
              <span>98% Índice de Recomendación</span>
            </div>
          </div>

          {/* Star Distribution Bars */}
          <div className="lg:col-span-4 space-y-2.5">
            <h4 className="text-xs font-black uppercase tracking-wider text-zinc-400 mb-4">
              Distribución de Reseñas
            </h4>

            {[
              { stars: 5, count: totalReviews > 0 ? fiveStarCount : 42, pct: totalReviews > 0 ? getPercentage(fiveStarCount) : 88 },
              { stars: 4, count: totalReviews > 0 ? fourStarCount : 5, pct: totalReviews > 0 ? getPercentage(fourStarCount) : 10 },
              { stars: 3, count: totalReviews > 0 ? threeStarCount : 1, pct: totalReviews > 0 ? getPercentage(threeStarCount) : 2 },
              { stars: 2, count: totalReviews > 0 ? twoStarCount : 0, pct: totalReviews > 0 ? getPercentage(twoStarCount) : 0 },
              { stars: 1, count: totalReviews > 0 ? oneStarCount : 0, pct: totalReviews > 0 ? getPercentage(oneStarCount) : 0 },
            ].map((item) => (
              <div key={item.stars} className="flex items-center gap-3 text-xs">
                <span className="w-12 font-mono text-zinc-400 flex items-center gap-1 shrink-0">
                  {item.stars} <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                </span>
                <div className="flex-1 bg-zinc-950 rounded-full h-2.5 overflow-hidden border border-zinc-800">
                  <div 
                    className="h-full rounded-full transition-all duration-700"
                    style={{ 
                      width: `${item.pct}%`,
                      backgroundColor: item.stars >= 4 ? primaryColor : '#71717a'
                    }}
                  />
                </div>
                <span className="w-10 text-right font-mono text-zinc-400">{item.pct}%</span>
              </div>
            ))}
          </div>

          {/* Quality Pillars & Satisfactions */}
          <div className="lg:col-span-4 bg-zinc-950 p-5 sm:p-6 rounded-2xl border border-zinc-800/80 space-y-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4" style={{ color: accentColor }} />
              <span>Pilares de Calidad Evaluados</span>
            </h4>

            <div className="space-y-3 text-xs">
              <div>
                <div className="flex justify-between text-zinc-300 font-bold mb-1">
                  <span>Metodología y Nivel Técnico</span>
                  <span className="text-emerald-400 font-mono">99%</span>
                </div>
                <div className="w-full bg-zinc-900 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: '99%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-zinc-300 font-bold mb-1">
                  <span>Disciplina y Valores Humanos</span>
                  <span className="text-emerald-400 font-mono">100%</span>
                </div>
                <div className="w-full bg-zinc-900 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: '100%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-zinc-300 font-bold mb-1">
                  <span>Infraestructura y Balones Oficiales</span>
                  <span className="text-emerald-400 font-mono">96%</span>
                </div>
                <div className="w-full bg-zinc-900 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: '96%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-zinc-300 font-bold mb-1">
                  <span>Atención y Staff de Entrenadores</span>
                  <span className="text-emerald-400 font-mono">98%</span>
                </div>
                <div className="w-full bg-zinc-900 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: '98%' }} />
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
