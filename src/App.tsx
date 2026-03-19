import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, 
  Mic, 
  MicOff, 
  Send, 
  User, 
  Bot, 
  Headphones, 
  Info,
  ChevronRight,
  Heart,
  Car,
  Home,
  Briefcase,
  Plane,
  TrendingUp
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { LiveChatService, ChatMessage } from './services/liveChatService';

const INSURANCE_CATEGORIES = [
  { icon: Heart, name: 'Life', color: 'text-rose-500' },
  { icon: Shield, name: 'Health', color: 'text-emerald-500' },
  { icon: Car, name: 'Auto', color: 'text-blue-500' },
  { icon: Home, name: 'Home', color: 'text-amber-500' },
  { icon: Briefcase, name: 'Business', color: 'text-indigo-500' },
  { icon: Plane, name: 'Specialty', color: 'text-purple-500' },
  { icon: TrendingUp, name: 'Financial', color: 'text-cyan-500' },
];

export default function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLive, setIsLive] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const chatServiceRef = useRef<LiveChatService | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const toggleLive = async () => {
    if (isLive) {
      chatServiceRef.current?.disconnect();
      setIsLive(false);
    } else {
      setIsConnecting(true);
      try {
        const service = new LiveChatService((msg) => {
          setMessages(prev => {
            // Update last message if it's Alex and we're streaming
            if (msg.role === 'alex' && prev.length > 0 && prev[prev.length - 1].role === 'alex') {
              const newMessages = [...prev];
              newMessages[newMessages.length - 1] = msg;
              return newMessages;
            }
            return [...prev, msg];
          });
        });
        await service.connect();
        chatServiceRef.current = service;
        setIsLive(true);
      } catch (error) {
        console.error("Failed to connect:", error);
      } finally {
        setIsConnecting(false);
      }
    }
  };

  const handleSendText = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    
    if (isLive) {
      chatServiceRef.current?.sendText(inputText);
    } else {
      // Mock or handle offline mode
      setMessages(prev => [...prev, { role: 'user', text: inputText, timestamp: new Date() }]);
    }
    setInputText('');
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-slate-900 font-sans selection:bg-indigo-100">
      {/* Header */}
      <header className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-slate-200 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
              <Shield className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-xl tracking-tight text-slate-900">SecureGuard</h1>
              <p className="text-[10px] uppercase tracking-widest font-semibold text-slate-400">Universal Concierge</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={toggleLive}
              disabled={isConnecting}
              className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-all ${
                isLive 
                ? 'bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-100' 
                : 'bg-indigo-600 text-white shadow-md shadow-indigo-100 hover:bg-indigo-700'
              }`}
            >
              {isConnecting ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : isLive ? (
                <MicOff className="w-4 h-4" />
              ) : (
                <Mic className="w-4 h-4" />
              )}
              {isLive ? 'End Voice' : 'Start Voice'}
            </button>
          </div>
        </div>
      </header>

      <main className="pt-16 h-screen flex flex-col lg:flex-row">
        {/* Sidebar - Desktop */}
        <aside className="hidden lg:flex w-80 border-r border-slate-200 flex-col bg-white">
          <div className="p-6">
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-6">Expertise Areas</h2>
            <div className="space-y-1">
              {INSURANCE_CATEGORIES.map((cat) => (
                <button 
                  key={cat.name}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group text-left"
                >
                  <cat.icon className={`w-5 h-5 ${cat.color}`} />
                  <span className="font-medium text-slate-600 group-hover:text-slate-900">{cat.name}</span>
                  <ChevronRight className="w-4 h-4 ml-auto text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>
          </div>

          <div className="p-6 border-t border-slate-100">
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Omni-channel Support</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <Send className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">SMS Support</p>
                  <p className="text-sm font-mono text-slate-700">{process.env.TWILIO_PHONE_NUMBER || '+1 (555) 000-0000'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Headphones className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Voice Concierge</p>
                  <p className="text-sm font-mono text-slate-700">{process.env.TWILIO_PHONE_NUMBER || '+1 (555) 000-0000'}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-auto p-6 border-t border-slate-100">
            <div className="bg-slate-50 rounded-2xl p-4 flex items-start gap-3">
              <Info className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
              <p className="text-xs text-slate-500 leading-relaxed">
                Alex can assist with any provider globally. For sensitive data, please use the chat box.
              </p>
            </div>
          </div>
        </aside>

        {/* Chat Area */}
        <section className="flex-1 flex flex-col relative bg-white">
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 lg:p-8 space-y-6 scroll-smooth"
          >
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto">
                <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-6">
                  <Bot className="w-10 h-10 text-indigo-600" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Hello! I'm Alex.</h3>
                <p className="text-slate-500">
                  Your virtual insurance partner. I can help with quotes, policy questions, or claims across any provider.
                </p>
                <div className="mt-8 grid grid-cols-2 gap-3 w-full">
                  <button className="p-3 bg-white border border-slate-200 rounded-xl text-sm font-medium hover:border-indigo-300 transition-colors">
                    Get a Life Quote
                  </button>
                  <button className="p-3 bg-white border border-slate-200 rounded-xl text-sm font-medium hover:border-indigo-300 transition-colors">
                    Auto Insurance Help
                  </button>
                </div>
              </div>
            )}

            <AnimatePresence initial={false}>
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex gap-3 max-w-[85%] lg:max-w-[70%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      msg.role === 'user' ? 'bg-slate-200' : 'bg-indigo-600'
                    }`}>
                      {msg.role === 'user' ? <User className="w-4 h-4 text-slate-600" /> : <Bot className="w-4 h-4 text-white" />}
                    </div>
                    <div className={`p-4 rounded-2xl shadow-sm ${
                      msg.role === 'user' 
                      ? 'bg-slate-900 text-white rounded-tr-none' 
                      : 'bg-slate-50 text-slate-800 rounded-tl-none border border-slate-100'
                    }`}>
                      <div className="prose prose-sm prose-slate max-w-none prose-headings:text-slate-900 prose-strong:text-slate-900 prose-a:text-indigo-600">
                        <ReactMarkdown>{msg.text}</ReactMarkdown>
                      </div>
                      <p className={`text-[10px] mt-2 ${msg.role === 'user' ? 'text-slate-400' : 'text-slate-400'}`}>
                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Input Area */}
          <div className="p-4 lg:p-8 bg-white border-t border-slate-100">
            <form onSubmit={handleSendText} className="max-w-4xl mx-auto relative">
              <input 
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={isLive ? "Speak or type your message..." : "Type your message..."}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-6 pr-14 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
              <button 
                type="submit"
                className="absolute right-2 top-2 bottom-2 w-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
            <div className="mt-3 flex items-center justify-center gap-4 text-[10px] uppercase tracking-widest font-bold text-slate-400">
              <div className="flex items-center gap-1">
                <div className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                {isLive ? 'Voice Active' : 'Voice Offline'}
              </div>
              <div className="flex items-center gap-1">
                <Headphones className="w-3 h-3" />
                24kHz High Fidelity
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

