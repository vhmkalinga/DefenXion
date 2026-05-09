import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, Send, Bot, User, ArrowRight, MessageSquare, Minimize2, Sparkles, Download, FileText, RotateCcw } from 'lucide-react';
import { sendChatMessage, getReports, generateReport, getReportDetail } from '../services/api';
import { downloadCSV } from '../utils/export';
import { generateReportPDF } from '../utils/pdf';
import { toast } from 'sonner';

const SESSION_KEY = 'defenxion_copilot_messages';
const MAX_STORED = 20;

function triggerCSVFromMessage(content: string) {
  const rows: Record<string, string>[] = [];
  const lines = content.split('\n').filter(l => l.trim().startsWith('•') || l.trim().match(/^\d+\./));
  lines.forEach(line => {
    const clean = line.replace(/^[•\d.\s*]+/, '').trim();
    rows.push({ detail: clean.replace(/\*\*/g, '') });
  });
  if (rows.length === 0) rows.push({ report: content.replace(/\*\*/g, '').replace(/\n/g, ' ') });
  downloadCSV(rows, `defenxion-report-${new Date().toISOString().slice(0, 10)}.csv`);
}

async function triggerPDFFromCopilot() {
  try {
    toast.info('Preparing report for print…');
    const reports = await getReports();
    if (!reports || reports.length === 0) {
      const generated = await generateReport('daily');
      const detail = await getReportDetail(generated.report_id);
      await generateReportPDF(detail);
    } else {
      const latest = reports[0];
      const detail = await getReportDetail(latest.report_id);
      await generateReportPDF(detail);
    }
    toast.success('Print dialog opened — save as PDF');
  } catch (e) {
    console.error(e);
    toast.error('PDF generation failed');
  }
}

interface Message {
  id: number;
  role: 'bot' | 'user';
  content: string;
  action_url: string | null;
  secondary_action_url: string | null;
  timestamp: string; // ISO string for serialization
}

const QUICK_ACTIONS = [
  { label: '📡 System Status',  query: 'system status' },
  { label: '🚨 Latest Threats', query: 'latest threats' },
  { label: '🎯 Top Attackers',  query: 'top attacking IPs' },
  { label: '📊 Weekly Report',  query: 'weekly report' },
  { label: '📄 Export PDF',     query: 'download pdf report' },
  { label: '📈 Threat Trends',  query: 'threat trends this week' },
  { label: '🔒 Blocked IPs',    query: 'blocked IPs' },
  { label: '🔑 Failed Logins',  query: 'failed logins' },
  { label: '📋 Compliance',     query: 'compliance audit gdpr' },
];

const INITIAL_MESSAGE: Message = {
  id: 1,
  role: 'bot',
  content: "👋 Hi! I'm your **Security Copilot**.\n\nI can query live threat data, explain attack types, generate reports, download PDFs, show threat trends, and guide you through security actions.\n\nTry a quick action below or type anything!",
  action_url: null,
  secondary_action_url: null,
  timestamp: new Date().toISOString(),
};

function loadMessages(): Message[] {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return [INITIAL_MESSAGE];
}

function saveMessages(msgs: Message[]) {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(msgs.slice(-MAX_STORED)));
  } catch { /* ignore */ }
}

// ── Markdown table renderer ────────────────────────────────
function renderTable(tableText: string) {
  const lines = tableText.trim().split('\n').filter(l => l.trim().startsWith('|'));
  if (lines.length < 2) return null;
  const headerCells = lines[0].split('|').map(c => c.trim()).filter(Boolean);
  const bodyRows = lines.slice(2).map(l => l.split('|').map(c => c.trim()).filter(Boolean));
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, marginTop: 8 }}>
      <thead>
        <tr>
          {headerCells.map((h, i) => (
            <th key={i} style={{ padding: '5px 8px', background: 'rgba(31,111,235,0.2)', color: '#C9D1D9', borderBottom: '1px solid rgba(31,111,235,0.3)', textAlign: i === 0 ? 'left' : 'center', fontWeight: 600 }}>
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {bodyRows.map((row, ri) => (
          <tr key={ri} style={{ background: ri % 2 === 0 ? 'rgba(22,27,34,0.6)' : 'transparent' }}>
            {row.map((cell, ci) => (
              <td key={ci} style={{ padding: '5px 8px', color: '#C9D1D9', borderBottom: '1px solid rgba(48,54,61,0.3)', textAlign: ci === 0 ? 'left' : 'center', fontFamily: ci === 0 ? 'inherit' : 'monospace' }}>
                {cell.replace(/`/g, '')}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ── Content renderer (bold + tables) ──────────────────────
function renderContent(text: string) {
  const blocks = text.split(/(\n\|[^\n]+\|[^\n]*(?:\n\|[^\n]+\|[^\n]*)*)/g);
  return blocks.map((block, bi) => {
    if (block.startsWith('\n|') || block.startsWith('|')) {
      const table = renderTable(block);
      if (table) return <span key={bi}>{table}</span>;
    }
    const parts = block.split(/(\*\*[^*]+\*\*)/g);
    return (
      <span key={bi}>
        {parts.map((part, i) =>
          part.startsWith('**') && part.endsWith('**')
            ? <strong key={i}>{part.slice(2, -2)}</strong>
            : part
        )}
      </span>
    );
  });
}

export function SecurityCopilot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>(loadMessages);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const [pulseButton, setPulseButton] = useState(true);
  const [isPDFLoading, setIsPDFLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isOpen) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  useEffect(() => {
    const t = setTimeout(() => setPulseButton(false), 8000);
    return () => clearTimeout(t);
  }, []);

  // Persist messages to sessionStorage whenever they change
  useEffect(() => { saveMessages(messages); }, [messages]);

  // Re-show quick actions after 30s of user inactivity
  const resetIdleTimer = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => setShowQuickActions(true), 30000);
  }, []);

  useEffect(() => {
    resetIdleTimer();
    return () => { if (idleTimerRef.current) clearTimeout(idleTimerRef.current); };
  }, [messages, resetIdleTimer]);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;
    setShowQuickActions(false);
    resetIdleTimer();
    const userMsg: Message = { id: Date.now(), role: 'user', content: text, action_url: null, secondary_action_url: null, timestamp: new Date().toISOString() };
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
        secondary_action_url: response.secondary_action_url ?? null,
        timestamp: new Date().toISOString(),
      }]);
    } catch {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'bot',
        content: "⚠️ I couldn't reach the backend. Please make sure the server is running.",
        action_url: null,
        secondary_action_url: null,
        timestamp: new Date().toISOString(),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
  };

  const clearHistory = () => {
    const fresh = [{ ...INITIAL_MESSAGE, timestamp: new Date().toISOString() }];
    setMessages(fresh);
    setShowQuickActions(true);
    sessionStorage.removeItem(SESSION_KEY);
  };

  const formatTime = (ts: string) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

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
          boxShadow: isOpen ? '0 8px 28px rgba(239,68,68,0.4)' : '0 8px 28px rgba(31,111,235,0.5)',
          zIndex: 999998,
          transition: 'all 0.25s cubic-bezier(0.34,1.56,0.64,1)',
          transform: 'scale(1)',
          animation: pulseButton && !isOpen ? 'copilot-pulse 2s ease-in-out infinite' : 'none',
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.1)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
      >
        {isOpen ? <X size={22} color="white" /> : <MessageSquare size={22} color="white" />}
        {!isOpen && (
          <span style={{ position: 'absolute', top: 2, right: 2, width: 12, height: 12, borderRadius: '50%', background: '#22c55e', border: '2px solid white' }} />
        )}
      </button>

      {/* ── Chat Window ── */}
      <div style={{
        position: 'fixed', bottom: 96, right: 28,
        width: 420, height: isMinimized ? 56 : 580,
        background: 'rgba(13,17,23,0.97)', backdropFilter: 'blur(20px)',
        border: '1px solid rgba(48,54,61,0.8)', borderRadius: 20,
        boxShadow: '0 32px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(88,166,255,0.05)',
        display: 'flex', flexDirection: 'column',
        zIndex: 999997, overflow: 'hidden',
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
          borderBottom: '1px solid rgba(48,54,61,0.6)', flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: 12, background: 'linear-gradient(135deg, #1F6FEB, #58A6FF)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(31,111,235,0.4)' }}>
              <Bot size={20} color="white" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ color: '#E6EDF3', fontWeight: 700, fontSize: 14 }}>Security Copilot</span>
                <Sparkles size={12} color="#58A6FF" />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 1 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', animation: 'copilot-blink 2s ease-in-out infinite' }} />
                <span style={{ color: '#7D8590', fontSize: 11 }}>AI-Powered • Live Data • PDF Export</span>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 2 }}>
            <button onClick={clearHistory} title="Clear history"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#484F58', padding: 6, borderRadius: 8, display: 'flex', alignItems: 'center', transition: 'color 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.color = '#7D8590'}
              onMouseLeave={e => e.currentTarget.style.color = '#484F58'}>
              <RotateCcw size={13} />
            </button>
            <button onClick={() => setIsMinimized(p => !p)} title={isMinimized ? 'Expand' : 'Minimize'}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#7D8590', padding: 6, borderRadius: 8, display: 'flex', alignItems: 'center' }}>
              <Minimize2 size={15} />
            </button>
            <button onClick={() => setIsOpen(false)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#7D8590', padding: 6, borderRadius: 8, display: 'flex', alignItems: 'center' }}>
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
                  <div style={{ display: 'flex', gap: 8, maxWidth: '92%', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row', alignItems: 'flex-start' }}>
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
                        fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-wrap',
                        background: msg.role === 'user' ? 'linear-gradient(135deg, #1F6FEB, #2679f5)' : 'rgba(22,27,34,0.9)',
                        color: msg.role === 'user' ? 'white' : '#C9D1D9',
                        border: msg.role === 'user' ? 'none' : '1px solid rgba(48,54,61,0.7)',
                        boxShadow: msg.role === 'user' ? '0 4px 12px rgba(31,111,235,0.3)' : '0 2px 8px rgba(0,0,0,0.3)',
                      }}>
                        {renderContent(msg.content)}
                      </div>

                      {/* Action buttons */}
                      {(msg.action_url || msg.secondary_action_url) && (
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {/* Primary action */}
                          {msg.action_url && (
                            msg.action_url === 'export-csv' ? (
                              <button
                                onClick={() => triggerCSVFromMessage(msg.content)}
                                style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: '#22c55e', fontSize: 12, fontWeight: 600, padding: '6px 12px', borderRadius: 8, background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)', cursor: 'pointer', fontFamily: 'inherit' }}
                              >
                                <Download size={13} /> Download CSV
                              </button>
                            ) : msg.action_url === 'export-pdf' ? (
                              <button
                                disabled={isPDFLoading}
                                onClick={async () => { setIsPDFLoading(true); await triggerPDFFromCopilot(); setIsPDFLoading(false); }}
                                style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: '#BC8CFF', fontSize: 12, fontWeight: 600, padding: '6px 12px', borderRadius: 8, background: 'rgba(188,140,255,0.12)', border: '1px solid rgba(188,140,255,0.3)', cursor: isPDFLoading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: isPDFLoading ? 0.6 : 1 }}
                              >
                                <FileText size={13} /> {isPDFLoading ? 'Generating…' : 'Download PDF'}
                              </button>
                            ) : (
                              <button
                                onClick={() => { window.dispatchEvent(new CustomEvent('copilot-navigate', { detail: msg.action_url })); setIsOpen(false); }}
                                style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: '#58A6FF', fontSize: 12, fontWeight: 600, padding: '6px 12px', borderRadius: 8, background: 'rgba(31,111,235,0.12)', border: '1px solid rgba(31,111,235,0.3)', cursor: 'pointer', fontFamily: 'inherit' }}
                              >
                                Open Module <ArrowRight size={13} />
                              </button>
                            )
                          )}
                          {/* Secondary action (e.g. CSV when PDF is primary) */}
                          {msg.secondary_action_url === 'export-csv' && (
                            <button
                              onClick={() => triggerCSVFromMessage(msg.content)}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: '#22c55e', fontSize: 12, fontWeight: 600, padding: '6px 12px', borderRadius: 8, background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)', cursor: 'pointer', fontFamily: 'inherit' }}
                            >
                              <Download size={13} /> Download CSV
                            </button>
                          )}
                        </div>
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

              {/* Quick Actions */}
              {showQuickActions && !isLoading && (
                <div>
                  <div style={{ color: '#484F58', fontSize: 10, marginBottom: 6, paddingLeft: 2 }}>Quick actions</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                    {QUICK_ACTIONS.map(qa => (
                      <button
                        key={qa.label}
                        onClick={() => sendMessage(qa.query)}
                        style={{ padding: '5px 11px', borderRadius: 20, fontSize: 11, background: 'rgba(31,111,235,0.08)', border: '1px solid rgba(31,111,235,0.2)', color: '#58A6FF', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s', whiteSpace: 'nowrap' }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(31,111,235,0.2)'; e.currentTarget.style.borderColor = 'rgba(88,166,255,0.45)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(31,111,235,0.08)'; e.currentTarget.style.borderColor = 'rgba(31,111,235,0.2)'; }}
                      >
                        {qa.label}
                      </button>
                    ))}
                  </div>
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
                  placeholder="Ask about threats, trends, PDF report…"
                  style={{ flex: 1, background: 'rgba(13,17,23,0.8)', border: '1px solid rgba(48,54,61,0.8)', borderRadius: 12, padding: '10px 14px', fontSize: 13, color: '#C9D1D9', outline: 'none', fontFamily: 'inherit', transition: 'border-color 0.15s' }}
                  onFocus={e => e.target.style.borderColor = 'rgba(31,111,235,0.6)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(48,54,61,0.8)'}
                />
                <button
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim() || isLoading}
                  style={{ width: 38, height: 38, borderRadius: 10, flexShrink: 0, background: input.trim() && !isLoading ? 'linear-gradient(135deg, #1F6FEB, #58A6FF)' : 'rgba(48,54,61,0.5)', border: 'none', cursor: input.trim() && !isLoading ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', boxShadow: input.trim() && !isLoading ? '0 4px 12px rgba(31,111,235,0.3)' : 'none' }}
                >
                  <Send size={15} color="white" />
                </button>
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: 7, gap: 4, alignItems: 'center' }}>
                <Sparkles size={9} color="#484F58" />
                <span style={{ fontSize: 10, color: '#484F58' }}>Powered by live DefenXion data · history persisted</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Keyframes */}
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
