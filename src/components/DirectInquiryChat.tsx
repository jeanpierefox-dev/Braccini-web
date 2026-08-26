import React, { useState, useEffect, useRef } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  doc, 
  serverTimestamp,
  where
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../hooks/useSettings';
import { 
  MessageCircle, 
  X, 
  Send, 
  ShieldCheck, 
  User, 
  Phone, 
  Mail, 
  Clock, 
  Sparkles, 
  CheckCheck, 
  HelpCircle, 
  ChevronRight,
  Minimize2,
  Maximize2,
  Inbox,
  ArrowLeft
} from 'lucide-react';

interface ChatMessage {
  id?: string;
  inquiryId: string;
  senderName: string;
  senderRole: 'admin' | 'visitante' | 'atleta' | 'socio';
  senderId?: string;
  message: string;
  createdAt: any;
}

interface InquiryThread {
  id: string;
  userName: string;
  userRole: string;
  userId?: string;
  userEmail?: string;
  userPhone?: string;
  category: string;
  lastMessage: string;
  status: 'abierto' | 'respondido' | 'cerrado';
  createdAt: any;
  updatedAt: any;
  unreadAdmin?: boolean;
  unreadUser?: boolean;
}

export function DirectInquiryChat() {
  const { user, role } = useAuth();
  const settings = useSettings();

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'inbox'>('chat');
  const [inquiryId, setInquiryId] = useState<string>(() => {
    return localStorage.getItem('club_active_inquiry_id') || '';
  });
  
  // User info form if not logged in
  const [visitorName, setVisitorName] = useState(() => localStorage.getItem('club_visitor_name') || '');
  const [visitorContact, setVisitorContact] = useState('');
  const [category, setCategory] = useState<'inscripciones' | 'entrenamientos' | 'horarios' | 'pagos' | 'general'>('inscripciones');
  const [hasStartedThread, setHasStartedThread] = useState(false);

  // Chat messages
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  
  // Admin Inbox
  const [allInquiries, setAllInquiries] = useState<InquiryThread[]>([]);
  const [selectedAdminThread, setSelectedAdminThread] = useState<InquiryThread | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const primaryColor = settings.primaryColor || '#2563eb';
  const primaryRgb = settings.primaryRgb || '37, 99, 235';

  // Fast preset quick questions
  const quickQuestions = [
    { text: '¿Cuáles son los horarios de entrenamiento por categoría?', cat: 'horarios' },
    { text: '¿Cómo puedo inscribirme o hacer una prueba gratis?', cat: 'inscripciones' },
    { text: '¿Cuáles son los costos de mensualidad y uniformes?', cat: 'pagos' },
    { text: '¿Aceptan principiantes o solo nivel avanzado?', cat: 'entrenamientos' }
  ];

  // Auto-scroll chat
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, selectedAdminThread]);

  // If Admin, load all inquiries for the inbox
  useEffect(() => {
    if (role !== 'admin') return;

    const q = query(
      collection(db, 'inquiries'),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const threads: InquiryThread[] = [];
      snapshot.forEach((d) => {
        threads.push({ id: d.id, ...d.data() } as InquiryThread);
      });
      setAllInquiries(threads);
    }, (err) => {
      console.error('Error fetching admin inquiries:', err);
    });

    return () => unsubscribe();
  }, [role]);

  // Load active inquiry thread if existing
  useEffect(() => {
    const currentId = (role === 'admin' && selectedAdminThread) ? selectedAdminThread.id : inquiryId;
    if (!currentId) {
      setMessages([]);
      return;
    }

    setHasStartedThread(true);
    const q = query(
      collection(db, 'chat_messages'),
      where('inquiryId', '==', currentId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs: ChatMessage[] = [];
      snapshot.forEach((d) => {
        msgs.push({ id: d.id, ...d.data() } as ChatMessage);
      });

      msgs.sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0);
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0);
        return timeA - timeB;
      });

      setMessages(msgs);
    }, (err) => {
      console.error('Error loading chat messages:', err);
    });

    return () => unsubscribe();
  }, [inquiryId, selectedAdminThread, role]);

  // Start new inquiry
  const handleStartInquiry = async (initialText?: string) => {
    const textToSend = initialText || newMessage;
    if (!textToSend.trim()) return;

    const name = user ? (user.displayName || user.email?.split('@')[0] || 'Miembro') : (visitorName.trim() || 'Visitante');
    const uRole = role === 'admin' ? 'admin' : (user ? 'socio' : 'visitante');

    try {
      setIsSending(true);

      // Create inquiry doc
      const inquiryRef = await addDoc(collection(db, 'inquiries'), {
        userName: name,
        userRole: uRole,
        userId: user?.uid || null,
        userEmail: user?.email || (visitorContact.includes('@') ? visitorContact : null),
        userPhone: !visitorContact.includes('@') ? visitorContact : null,
        category,
        lastMessage: textToSend.trim(),
        status: 'abierto',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        unreadAdmin: true,
        unreadUser: false
      });

      const newId = inquiryRef.id;
      setInquiryId(newId);
      localStorage.setItem('club_active_inquiry_id', newId);
      if (visitorName) localStorage.setItem('club_visitor_name', visitorName);

      // Add first message
      await addDoc(collection(db, 'chat_messages'), {
        inquiryId: newId,
        senderName: name,
        senderRole: uRole,
        senderId: user?.uid || null,
        message: textToSend.trim(),
        createdAt: serverTimestamp()
      });

      setNewMessage('');
      setHasStartedThread(true);
    } catch (err: any) {
      console.error('Error starting inquiry:', err);
      alert('Error al iniciar consulta: ' + err.message);
    } finally {
      setIsSending(false);
    }
  };

  // Send message in existing thread
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newMessage.trim()) return;

    const currentId = (role === 'admin' && selectedAdminThread) ? selectedAdminThread.id : inquiryId;
    if (!currentId) {
      handleStartInquiry();
      return;
    }

    const name = user ? (user.displayName || user.email?.split('@')[0] || 'Miembro') : (visitorName.trim() || 'Visitante');
    const senderRole = role === 'admin' ? 'admin' : (user ? 'socio' : 'visitante');

    try {
      setIsSending(true);
      await addDoc(collection(db, 'chat_messages'), {
        inquiryId: currentId,
        senderName: name,
        senderRole,
        senderId: user?.uid || null,
        message: newMessage.trim(),
        createdAt: serverTimestamp()
      });

      // Update inquiry status
      const inquiryRef = doc(db, 'inquiries', currentId);
      await updateDoc(inquiryRef, {
        lastMessage: newMessage.trim(),
        updatedAt: serverTimestamp(),
        status: senderRole === 'admin' ? 'respondido' : 'abierto',
        unreadAdmin: senderRole !== 'admin',
        unreadUser: senderRole === 'admin'
      });

      setNewMessage('');
    } catch (err: any) {
      console.error('Error sending message:', err);
      alert('Error al enviar mensaje: ' + err.message);
    } finally {
      setIsSending(false);
    }
  };

  const handleQuickQuestionClick = (q: { text: string; cat: string }) => {
    setCategory(q.cat as any);
    if (!hasStartedThread && !inquiryId) {
      handleStartInquiry(q.text);
    } else {
      setNewMessage(q.text);
    }
  };

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return 'Ahora';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp.seconds * 1000);
      return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <>
      {/* Floating Launcher Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-5 right-5 z-40 flex items-center gap-2.5 px-4 py-3 rounded-full text-white font-bold text-xs uppercase tracking-wider shadow-2xl transition-all duration-300 hover:scale-105 group border border-white/20 cursor-pointer"
          style={{
            backgroundColor: primaryColor,
            boxShadow: `0 10px 25px rgba(${primaryRgb}, 0.5)`
          }}
          title="Abrir Chat de Consultas Directas"
        >
          <div className="relative">
            <MessageCircle className="w-5 h-5 text-white" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse ring-2 ring-black" />
          </div>
          <span className="hidden sm:inline">Consultas Directas</span>
          {role === 'admin' && allInquiries.filter(i => i.unreadAdmin).length > 0 && (
            <span className="bg-rose-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-black ml-1">
              {allInquiries.filter(i => i.unreadAdmin).length}
            </span>
          )}
        </button>
      )}

      {/* Main Chat Drawer / Window */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-[94vw] sm:w-[420px] h-[580px] max-h-[85vh] bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-fade-in">
          
          {/* Header */}
          <div 
            className="p-4 flex items-center justify-between border-b border-zinc-800"
            style={{ backgroundColor: `rgba(${primaryRgb}, 0.15)` }}
          >
            <div className="flex items-center gap-2.5">
              {role === 'admin' && selectedAdminThread && (
                <button
                  onClick={() => setSelectedAdminThread(null)}
                  className="p-1 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white"
                  title="Volver a la lista de consultas"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
              )}
              <div 
                className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs text-white"
                style={{ backgroundColor: primaryColor }}
              >
                <MessageCircle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm leading-tight flex items-center gap-1.5">
                  <span>Consultas Directas</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                </h3>
                <p className="text-[11px] text-zinc-400">
                  {role === 'admin' 
                    ? (selectedAdminThread ? `Atendiendo a: ${selectedAdminThread.userName}` : 'Bandeja de Consultas de Usuarios')
                    : 'Atención oficial del club en tiempo real'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {role === 'admin' && (
                <button
                  onClick={() => setActiveTab(activeTab === 'chat' ? 'inbox' : 'chat')}
                  className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    activeTab === 'inbox' ? 'bg-amber-500 text-black' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                  }`}
                  title="Ver todas las consultas"
                >
                  <Inbox className="w-3.5 h-3.5 inline mr-1" />
                  <span>{allInquiries.length}</span>
                </button>
              )}

              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Body Section */}
          <div className="flex-1 overflow-y-auto flex flex-col p-4 space-y-3 scrollbar-thin scrollbar-thumb-zinc-800">
            
            {/* ADMIN INBOX VIEW */}
            {role === 'admin' && activeTab === 'inbox' && !selectedAdminThread && (
              <div className="space-y-2">
                <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>Consultas de Usuarios</span>
                  <span className="text-[10px] text-zinc-500">{allInquiries.length} totales</span>
                </div>

                {allInquiries.length === 0 ? (
                  <div className="text-center py-12 text-zinc-500">
                    <Inbox className="w-8 h-8 mx-auto opacity-40 mb-2" />
                    <p className="text-xs">No hay consultas registradas aún.</p>
                  </div>
                ) : (
                  allInquiries.map((inq) => (
                    <button
                      key={inq.id}
                      onClick={() => {
                        setSelectedAdminThread(inq);
                        setActiveTab('chat');
                      }}
                      className={`w-full text-left p-3 rounded-2xl border transition-all cursor-pointer flex flex-col gap-1 ${
                        inq.unreadAdmin 
                          ? 'bg-zinc-900 border-amber-500/50 shadow-md' 
                          : 'bg-zinc-950 border-zinc-800/80 hover:bg-zinc-900/60'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs text-white">{inq.userName}</span>
                          <span className="text-[9px] uppercase px-1.5 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">
                            {inq.category}
                          </span>
                        </div>
                        <span className="text-[10px] text-zinc-500">{formatTimestamp(inq.updatedAt)}</span>
                      </div>
                      <p className="text-xs text-zinc-300 line-clamp-1">{inq.lastMessage}</p>
                      {inq.unreadAdmin && (
                        <span className="text-[10px] font-bold text-amber-400 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                          Nuevo mensaje pendiente
                        </span>
                      )}
                    </button>
                  ))
                )}
              </div>
            )}

            {/* NORMAL CHAT VIEW / ACTIVE THREAD */}
            {(!role || role !== 'admin' || activeTab === 'chat' || selectedAdminThread) && (
              <>
                {/* Greeting message */}
                <div className="bg-zinc-900/80 border border-zinc-800/90 rounded-2xl p-3 text-xs text-zinc-300 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>¡Hola! Bienvenido al canal directo del Club</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Escribe tu consulta sobre inscripciones, pruebas de nivel, horarios o mensualidades. Nuestro equipo te responderá aquí mismo.
                  </p>
                </div>

                {/* Quick preset pills if thread is not long */}
                {messages.length === 0 && !hasStartedThread && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                      Preguntas Frecuentes Rápidas:
                    </span>
                    <div className="space-y-1.5">
                      {quickQuestions.map((q, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleQuickQuestionClick(q)}
                          className="w-full text-left p-2 rounded-xl bg-zinc-900/60 hover:bg-zinc-800 border border-zinc-800 text-[11px] text-zinc-300 flex items-center justify-between transition-colors cursor-pointer group"
                        >
                          <span>{q.text}</span>
                          <ChevronRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-white shrink-0" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Initial visitor contact inputs if first time */}
                {!user && !hasStartedThread && messages.length === 0 && (
                  <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-3 space-y-2 mt-2">
                    <div className="text-[11px] font-bold text-zinc-300">Tus datos para contactarte:</div>
                    <input
                      type="text"
                      value={visitorName}
                      onChange={(e) => setVisitorName(e.target.value)}
                      placeholder="Tu nombre completo *"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
                    />
                    <input
                      type="text"
                      value={visitorContact}
                      onChange={(e) => setVisitorContact(e.target.value)}
                      placeholder="Teléfono WhatsApp o Correo (Opcional)"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
                    />
                    <div className="flex gap-1.5 flex-wrap pt-1">
                      {(['inscripciones', 'entrenamientos', 'horarios', 'pagos', 'general'] as const).map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setCategory(cat)}
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border transition-all cursor-pointer ${
                            category === cat 
                              ? 'border-amber-400 bg-amber-500/20 text-amber-300' 
                              : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Messages stream */}
                <div className="space-y-3 pt-2">
                  {messages.map((m) => {
                    const isAdmin = m.senderRole === 'admin';
                    return (
                      <div 
                        key={m.id}
                        className={`flex flex-col ${isAdmin ? 'items-start' : 'items-end'}`}
                      >
                        <div className="flex items-center gap-1 mb-1 text-[10px] text-zinc-500">
                          {isAdmin && <ShieldCheck className="w-3 h-3 text-amber-400" />}
                          <span className="font-bold text-zinc-400">{m.senderName}</span>
                          <span>• {formatTimestamp(m.createdAt)}</span>
                        </div>

                        <div 
                          className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed shadow-md ${
                            isAdmin 
                              ? 'bg-zinc-900 border border-amber-500/30 text-white rounded-tl-sm' 
                              : 'text-white rounded-tr-sm'
                          }`}
                          style={!isAdmin ? { backgroundColor: primaryColor } : undefined}
                        >
                          {m.message}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              </>
            )}

          </div>

          {/* Chat Footer / Input Form */}
          {(!role || role !== 'admin' || activeTab === 'chat' || selectedAdminThread) && (
            <form 
              onSubmit={handleSendMessage}
              className="p-3 bg-zinc-900 border-t border-zinc-800 flex items-center gap-2"
            >
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={role === 'admin' ? "Escribe la respuesta del club..." : "Escribe tu consulta aquí..."}
                className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
              />
              <button
                type="submit"
                disabled={isSending || !newMessage.trim()}
                className="p-2.5 rounded-xl text-white font-bold text-xs transition-transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shrink-0 shadow-md"
                style={{ backgroundColor: primaryColor }}
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          )}

        </div>
      )}
    </>
  );
}
