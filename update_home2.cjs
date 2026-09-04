const fs = require('fs');
let content = fs.readFileSync('src/pages/Home.tsx', 'utf8');

const statsCode = `            {/* =========================================================================
                SECCIÓN: ESTADÍSTICAS DEL CLUB Y DIRECTOR
               ========================================================================= */}
            <div className="py-12 border-b border-zinc-900 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-zinc-950 p-6 rounded-2xl border border-zinc-800 text-center relative overflow-hidden group">
                   <div className="absolute top-0 left-0 right-0 h-1 transition-transform scale-x-100" style={{ backgroundColor: primaryColor }} />
                   <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 bg-zinc-900 border border-zinc-800">
                     <Users className="w-6 h-6 text-zinc-400" />
                   </div>
                   <h4 className="text-3xl font-black text-white">{displayedAthletesCount}</h4>
                   <p className="text-xs text-zinc-500 uppercase tracking-widest mt-2">Jugadores</p>
                </div>
                <div className="bg-zinc-950 p-6 rounded-2xl border border-zinc-800 text-center relative overflow-hidden group">
                   <div className="absolute top-0 left-0 right-0 h-1 transition-transform scale-x-100" style={{ backgroundColor: accentColor }} />
                   <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 bg-zinc-900 border border-zinc-800">
                     <Eye className="w-6 h-6 text-zinc-400" />
                   </div>
                   <h4 className="text-3xl font-black text-white">{settings.pageViews || 0}</h4>
                   <p className="text-xs text-zinc-500 uppercase tracking-widest mt-2">Visitas web</p>
                </div>
                <div className="bg-zinc-950 p-6 rounded-2xl border border-zinc-800 text-center relative overflow-hidden group">
                   <div className="absolute top-0 left-0 right-0 h-1 transition-transform scale-x-100" style={{ backgroundColor: primaryColor }} />
                   <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 bg-zinc-900 border border-zinc-800">
                     <Trophy className="w-6 h-6 text-zinc-400" />
                   </div>
                   <h4 className="text-3xl font-black text-white">{settings.statsChampionships || '20+'}</h4>
                   <p className="text-xs text-zinc-500 uppercase tracking-widest mt-2">Campeonatos</p>
                </div>
                <div className="bg-zinc-950 p-6 rounded-2xl border border-zinc-800 text-center relative overflow-hidden group">
                   <div className="absolute top-0 left-0 right-0 h-1 transition-transform scale-x-100" style={{ backgroundColor: accentColor }} />
                   <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 bg-zinc-900 border border-zinc-800">
                     <Building2 className="w-6 h-6 text-zinc-400" />
                   </div>
                   <h4 className="text-3xl font-black text-white">{settings.statsFoundedYear || '2015'}</h4>
                   <p className="text-xs text-zinc-500 uppercase tracking-widest mt-2">Fundación</p>
                </div>
              </div>

              {directorProfile && (
                <div className="mt-12 bg-zinc-950 rounded-2xl p-6 sm:p-8 border border-zinc-800 shadow-2xl flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
                   <div className="absolute left-0 top-0 bottom-0 w-1 transition-transform scale-y-100" style={{ backgroundColor: primaryColor }} />
                   <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full overflow-hidden border-4 border-zinc-900 shrink-0 shadow-xl bg-zinc-900">
                      {directorProfile.photoURL ? (
                        <img src={directorProfile.photoURL} alt="Director" className="w-full h-full object-cover" />
                      ) : (
                        <UserIcon className="w-16 h-16 text-zinc-600 m-auto mt-8" />
                      )}
                   </div>
                   <div className="flex-1 text-center md:text-left space-y-4">
                      <div>
                        <span className="text-[10px] font-heading font-black uppercase tracking-[0.2em] text-zinc-500 block mb-1">
                          Dirección General
                        </span>
                        <h3 className="text-2xl sm:text-3xl font-heading font-black text-white uppercase tracking-tight">
                          {directorProfile.name || 'Director General'}
                        </h3>
                        <p className="text-sm font-bold mt-1" style={{ color: accentColor }}>
                          {directorProfile.executiveRole || 'Presidente del Club'}
                        </p>
                      </div>
                      <div className="text-sm text-zinc-400 italic leading-relaxed max-w-3xl border-l-2 border-zinc-800 pl-4 py-1">
                        "{directorProfile.institutionalBio || 'Comprometidos con el desarrollo integral y deportivo de nuestra comunidad, formando atletas con valores, disciplina y pasión por el deporte.'}"
                      </div>
                   </div>
                </div>
              )}
            </div>`;

content = content.replace('<MissionVisionSection />', '<MissionVisionSection />\n' + statsCode);

fs.writeFileSync('src/pages/Home.tsx', content);
console.log('Updated');
