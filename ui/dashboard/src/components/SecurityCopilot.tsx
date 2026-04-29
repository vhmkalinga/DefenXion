import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Send, Bot, User, ArrowRight, MessageSquare, Minimize2, Sparkles, Download } from 'lucide-react';
import { sendChatMessage } from '../services/api';

function triggerCSVFromMessage(content: string) {
  // Parse the text report into CSV rows
  const rows: Record<string, string>[] = [];
  const lines = content.split('\n').filter(l => l.trim().startsWith('•') || l.trim().match(/^\d+\./) );
  lines.forEach(line => {
    const clean = line.replace(/^[•\d.\s*]+/, '').trim();
    const parts = clean.split(/—|\|/);
    if (parts.length >= 1) {
      rows.push({ detail: clean.replace(/\*\*/g, '') });
    }
  });
  if (rows.length === 0) {
    rows.push({ report: content.replace(/\*\*/g, '').replace(/\n/g, ' ') });
  }
  const headers = Object.keys(rows[0]);
  const csv = [headers.join(','), ...rows.map(r => headers.map(h => `"${(r[h] || '').replace(/"/g, '""')}"`).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `defenxion-report-${new Date().toISOString().slice(0,10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

interface Message {
  id: number;
  role: 'bot' | 'user';
  content: string;
  action_url: string | null;
  timestamp: Date;
}

const QUICK_ACTIONS = [
  { label: '📡 System Status', query: 'system status' },
  { label: '🚨 Latest Threats', query: 'latest threats' },
  { label: '🎯 Top Attackers', query: 'top attacking IPs' },
  { label: '📊 Weekly Report', query: 'generate weekly report' },
  { label: '🔑 Failed Logins', query: 'failed logins' },
  { label: '🛡️ Firewall Rules', query: 'firewall rules' },
];

export function SecurityCopilot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([{
    id: 1,
    role: 'bot',
    content: "👋 Hi! I'm your **Security Copilot**.\n\nI can query live threat data, explain attack types, generate reports, and guide you through security actions.\n\nTry a quick action below or type anything!",
    action_url: null,
    timestamp: new Date(),
  }]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const [pulseButton, setPulseButton] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  // Stop pulsing after 8 seconds
  useEffect(() => {
    const t = setTimeout(() => setPulseButton(false), 8000);
    return () => clearTimeout(t);
  }, []);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;
    setShowQuickActions(false);
    const userMsg: Message = { id: Date.now(), role: 'user', content: text, action_url: null, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);
    try {
      const response = await sendChatMessage(text);
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'bot',
        content: response.reply,
        action_url: response.action_url,
        timestamp: new Date(),
      }]);
    } catch {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'bot',
        content: "⚠️ I couldn't reach the backend. Please make sure the server is running.",
        action_url: null,
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
  };

  const formatTime = (d: Date) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Render markdown-like bold
  const renderContent = (text: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) =>
      part.startsWith('**') && part.endsWith('**')
        ? <strong key={i}>{part.slice(2, -2)}</strong>
        : part
    );
  };

  const portal = (
    <>
      {/* ── Floating Button ── */}
      <button
        onClick={() => { setIsOpen(p => !p); setIsMinimized(false); }}
        title="Security Copilot"
        style={{
          position: 'fixed', bottom: 28, right: 28,
          width: 58, height: 58, borderRadius: '50%',
          background: isOpen
            ? 'linear-gradient(135deg, #ef4444, #f87171)'
            : 'linear-gradient(135deg, #1F6FEB, #58A6FF)',
          border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: isOpen
            ? '0 8px 28px rgba(239,68,68,0.4)'
            : '0 8px 28px rgba(31,111,235,0.5)',
          zIndex: 999998,
          transition: 'all 0.25s cubic-bezier(0.34,1.56,0.64,1)',
          transform: 'scale(1)',
          animation: pulseButton && !isOpen ? 'copilot-pulse 2s ease-in-out infinite' : 'none',
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.1)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
      >
        {isOpen
          ? <X size={22} color="white" />
          : <MessageSquare size={22} color="white" />
        }
        {/* Unread badge when closed */}
        {!isOpen && (
          <span style={{
            position: 'absolute', top: 2, right: 2,
            width: 12, height: 12, borderRadius: '50%',
            background: '#22c55e', border: '2px solid white',
          }} />
        )}
      </button>

      {/* ── Chat Window ── */}
      <div style={{
        position: 'fixed',
        bottom: isMinimized ? 96 : 96,
        right: 28,
        width: 400,
        height: isMinimized ? 56 : 560,
        background: 'rgba(13,17,23,0.97)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(48,54,61,0.8)',
        borderRadius: 20,
        boxShadow: '0 32px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(88,166,255,0.05)',
        display: 'flex', flexDirection: 'column',
        zIndex: 999997,
        overflow: 'hidden',
        opacity: isOpen ? 1 : 0,
        transform: isOpen ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.94)',
        pointerEvents: isOpen ? 'all' : 'none',
        transition: 'all 0.25s cubic-bezier(0.34,1.56,0.64,1)',
      }}>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 16px',
          background: 'linear-gradient(135deg, rgba(31,111,235,0.15), rgba(88,166,255,0.08))',
          borderBottom: '1px solid rgba(48,54,61,0.6)',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 12,
              background: 'linear-gradient(135deg, #1F6FEB, #58A6FF)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(31,111,235,0.4)',
            }}>
              <Bot size={20} color="white" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ color: '#E6EDF3', fontWeight: 700, fontSize: 14 }}>Security Copilot</span>
                <Sparkles size={12} color="#58A6FF" />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 1 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', animation: 'copilot-blink 2s ease-in-out infinite' }} />
                <span style={{ color: '#7D8590', fontSize: 11 }}>AI-Powered • Live Data</span>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            <button
              onClick={() => setIsMinimized(p => !p)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#7D8590', padding: 6, borderRadius: 8, display: 'flex', alignItems: 'center' }}
              title={isMinimized ? 'Expand' : 'Minimize'}
            >
              <Minimize2 size={15} />
            </button>
            <button
              onClick={() => setIsOpen(false)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#7D8590', padding: 6, borderRadius: 8, display: 'flex', alignItems: 'center' }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {messages.map(msg => (
                <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  <div style={{ display: 'flex', gap: 8, maxWidth: '90%', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row', alignItems: 'flex-start' }}>
                    {/* Avatar */}
                    <div style={{
                      width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                      background: msg.role === 'user' ? 'rgba(88,166,255,0.15)' : 'linear-gradient(135deg, #1F6FEB22, #58A6FF22)',
                      border: `1px solid ${msg.role === 'user' ? 'rgba(88,166,255,0.3)' : 'rgba(31,111,235,0.3)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {msg.role === 'user' ? <User size={14} color="#58A6FF" /> : <Bot size={14} color="#58A6FF" />}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div style={{
                        padding: '10px 14px',
                        borderRadius: msg.role === 'user' ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
                        fontSize: 13,
                        lineHeight: 1.6,
                        whiteSpace: 'pre-wrap',
                        background: msg.role === 'user'
                          ? 'linear-gradient(135deg, #1F6FEB, #2679f5)'
                          : 'rgba(22,27,34,0.9)',
                        color: msg.role === 'user' ? 'white' : '#C9D1D9',
                        border: msg.role === 'user' ? 'none' : '1px solid rgba(48,54,61,0.7)',
                        boxShadow: msg.role === 'user'
                          ? '0 4px 12px rgba(31,111,235,0.3)'
                          : '0 2px 8px rgba(0,0,0,0.3)',
                      }}>
                        {renderContent(msg.content)}
                      </div>
                      {msg.action_url && (
                        msg.action_url === 'export-csv' ? (
                          <button
                            onClick={() => triggerCSVFromMessage(msg.content)}
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: 5,
                              color: '#22c55e', fontSize: 12, fontWeight: 600,
                              padding: '6px 12px', borderRadius: 8,
                              background: 'rgba(34,197,94,0.12)',
                              border: '1px solid rgba(34,197,94,0.3)',
                              cursor: 'pointer', fontFamily: 'inherit',
                              transition: 'background 0.15s',
                            }}
                          >
                            <Download size={13} /> Download CSV
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              window.dispatchEvent(new CustomEvent('copilot-navigate', { detail: msg.action_url }));
                              setIsOpen(false);
                            }}
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: 5,
                              color: '#58A6FF', fontSize: 12, fontWeight: 600,
                              padding: '6px 12px', borderRadius: 8,
                              background: 'rgba(31,111,235,0.12)',
                              border: '1px solid rgba(31,111,235,0.3)',
                              cursor: 'pointer', fontFamily: 'inherit',
                              transition: 'background 0.15s',
                            }}
                          >
                            Open Module <ArrowRight size={13} />
                          </button>
                        )
                      )}
                    </div>
                  </div>
                  {/* Timestamp */}
                  <span style={{ fontSize: 10, color: '#484F58', marginTop: 3, paddingLeft: msg.role === 'bot' ? 38 : 0, paddingRight: msg.role === 'user' ? 38 : 0 }}>
                    {formatTime(msg.timestamp)}
                  </span>
                </div>
              ))}

              {/* Typing Indicator */}
              {isLoading && (
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg, #1F6FEB22, #58A6FF22)', border: '1px solid rgba(31,111,235,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Bot size={14} color="#58A6FF" />
                  </div>
                  <div style={{ padding: '12px 16px', borderRadius: '4px 16px 16px 16px', background: 'rgba(22,27,34,0.9)', border: '1px solid rgba(48,54,61,0.7)', display: 'flex', gap: 5, alignItems: 'center' }}>
                    {[0, 0.2, 0.4].map((delay, i) => (
                      <div key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: '#58A6FF', animation: `copilot-typing 1.2s ease-in-out ${delay}s infinite` }} />
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Action Chips */}
              {showQuickActions && !isLoading && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                  {QUICK_ACTIONS.map(qa => (
                    <button
                      key={qa.label}
                      onClick={() => sendMessage(qa.query)}
                      style={{
                        padding: '6px 12px', borderRadius: 20, fontSize: 12,
                        background: 'rgba(31,111,235,0.1)',
                        border: '1px solid rgba(31,111,235,0.25)',
                        color: '#58A6FF', cursor: 'pointer', fontFamily: 'inherit',
                        transition: 'all 0.15s',
                        whiteSpace: 'nowrap',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = 'rgba(31,111,235,0.22)';
                        e.currentTarget.style.borderColor = 'rgba(88,166,255,0.5)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = 'rgba(31,111,235,0.1)';
                        e.currentTarget.style.borderColor = 'rgba(31,111,235,0.25)';
                      }}
                    >
                      {qa.label}
                    </button>
                  ))}
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div style={{ padding: '10px 12px 12px', background: 'rgba(22,27,34,0.9)', borderTop: '1px solid rgba(48,54,61,0.6)', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Ask about threats, logs, attacks..."
                  style={{
                    flex: 1,
                    background: 'rgba(13,17,23,0.8)',
                    border: '1px solid rgba(48,54,61,0.8)',
                    borderRadius: 12, padding: '10px 14px',
                    fontSize: 13, color: '#C9D1D9', outline: 'none',
                    fontFamily: 'inherit',
                    transition: 'border-color 0.15s',
                  }}
                  onFocus={e => e.target.style.borderColor = 'rgba(31,111,235,0.6)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(48,54,61,0.8)'}
                />
                <button
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim() || isLoading}
                  style={{
                    width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                    background: input.trim() && !isLoading
                      ? 'linear-gradient(135deg, #1F6FEB, #58A6FF)'
                      : 'rgba(48,54,61,0.5)',
                    border: 'none', cursor: input.trim() && !isLoading ? 'pointer' : 'default',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.2s',
                    boxShadow: input.trim() && !isLoading ? '0 4px 12px rgba(31,111,235,0.3)' : 'none',
                  }}
                >
                  <Send size={15} color="white" />
                </button>
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: 7, gap: 4, alignItems: 'center' }}>
                <Sparkles size={9} color="#484F58" />
                <span style={{ fontSize: 10, color: '#484F58' }}>Powered by live DefenXion data</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Keyframe Animations */}
      <style>{`
        @keyframes copilot-pulse {
          0%, 100% { box-shadow: 0 8px 28px rgba(31,111,235,0.5); }
          50% { box-shadow: 0 8px 36px rgba(31,111,235,0.8), 0 0 0 8px rgba(31,111,235,0.15); }
        }
        @keyframes copilot-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes copilot-typing {
          0%, 100% { transform: translateY(0); opacity: 0.5; }
          50% { transform: translateY(-4px); opacity: 1; }
        }
      `}</style>
    </>
  );

  return createPortal(portal, document.body);
}
