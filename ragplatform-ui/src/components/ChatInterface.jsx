import React, { useState, useRef, useEffect } from 'react';
import { api } from '../api';
import { 
  Send, Bot, User, Sparkles, Layers, BookOpen, Trash2, 
  Copy, Check, AlertCircle, Loader2, ShieldCheck, ArrowRight 
} from 'lucide-react';

export default function ChatInterface({ user, onGoToDocuments }) {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Hello ${user.username}! I am your AI Knowledge Assistant powered by Google Gemini and Spring AI. Ask me anything grounded in your tenant's indexed documents, and I will cite the exact source files and chunks used.`,
      sources: [],
      chunksUsed: 0,
      timestamp: new Date(),
    }
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (queryText = inputQuery) => {
    const text = queryText.trim();
    if (!text || loading) return;

    const userMessageId = `user-${Date.now()}`;
    const newUserMsg = {
      id: userMessageId,
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newUserMsg]);
    setInputQuery('');
    setError(null);
    setLoading(true);

    try {
      const response = await api.chat.send(text);

      const aiMessageId = `ai-${Date.now()}`;
      const newAiMsg = {
        id: aiMessageId,
        role: 'assistant',
        content: response.answer || "I don't have enough information from your uploaded documents to answer this question.",
        sources: response.sources || [],
        chunksUsed: response.chunksUsed || 0,
        tenantId: response.tenantId || user.username,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, newAiMsg]);
    } catch (err) {
      setError(err.message || 'Error communicating with RAG chat service');
      const isConnectionErr = err.message && (err.message.toLowerCase().includes('failed to fetch') || err.message.toLowerCase().includes('network'));
      const errorMsg = {
        id: `err-${Date.now()}`,
        role: 'system_error',
        content: isConnectionErr
          ? `Could not reach backend service: ${err.message}. Please verify that your Spring Boot server is running on port 8080.`
          : `Error: ${err.message || 'Server error'}. Please try again in a few moments.`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const clearChat = async () => {
    try {
      await api.chat.clearHistory();
    } catch (e) {
      console.warn('Could not clear backend chat history:', e);
    }
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: 'assistant',
        content: `Chat history cleared. How can I assist you today with your ${user.username} documents?`,
        sources: [],
        chunksUsed: 0,
        timestamp: new Date(),
      }
    ]);
    setError(null);
  };

  const starterPrompts = [
    'Summarize all documents in my knowledge base',
    'What are the key technical specifications and capabilities?',
    'What are the operational constraints or limits mentioned?',
    'List all action items, rules, or recommendations'
  ];

  return (
    <div className="chat-interface-wrapper animate-fade-in">
      {/* Top Chat Bar */}
      <div className="chat-header glass-panel">
        <div className="chat-header-info">
          <div className="agent-avatar-glow">
            <Bot size={22} className="text-indigo" />
          </div>
          <div>
            <div className="chat-title">
              Tenant RAG Chat Assistant
            </div>
            <div className="chat-tenant-scope">
              <ShieldCheck size={12} className="text-cyan" />
              <span>Isolated Vector Scope: <strong>{user.tenantId || user.username}</strong></span>
            </div>
          </div>
        </div>

        <div className="chat-header-actions">
          <button 
            type="button" 
            className="btn btn-ghost btn-sm"
            onClick={clearChat}
            title="Clear Chat History"
          >
            <Trash2 size={16} />
            <span>Reset Chat</span>
          </button>
        </div>
      </div>

      {/* Messages Stream */}
      <div className="messages-stream">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          const isError = msg.role === 'system_error';

          return (
            <div
              key={msg.id}
              className={`message-row ${isUser ? 'user-row' : 'assistant-row'} animate-fade-in`}
            >
              <div className="message-avatar">
                {isUser ? (
                  <div className="avatar user-bubble">
                    <User size={16} />
                  </div>
                ) : (
                  <div className={`avatar bot-bubble ${isError ? 'error-bubble' : ''}`}>
                    {isError ? <AlertCircle size={16} /> : <Bot size={16} />}
                  </div>
                )}
              </div>

              <div className="message-content-wrapper">
                <div className={`message-bubble ${isUser ? 'user-speech' : isError ? 'error-speech' : 'bot-speech glass-panel'}`}>
                  <div className="message-text">
                    {msg.content}
                  </div>

                  {/* Sources & Citations if provided */}
                  {!isUser && !isError && msg.sources && msg.sources.length > 0 && (
                    <div className="citations-container">
                      <div className="citations-header">
                        <BookOpen size={13} className="text-cyan" />
                        <span>Sources Cited ({msg.sources.length} document{msg.sources.length > 1 ? 's' : ''}, {msg.chunksUsed} chunks used):</span>
                      </div>
                      <div className="citations-list">
                        {msg.sources.map((src, i) => (
                          <span key={i} className="citation-tag">
                            <Layers size={11} />
                            <span>{src}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Metadata footer */}
                  <div className="message-footer">
                    <span className="timestamp">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {!isError && (
                      <button
                        className="copy-btn"
                        onClick={() => copyToClipboard(msg.content, msg.id)}
                        title="Copy message"
                      >
                        {copiedId === msg.id ? <Check size={13} className="text-emerald" /> : <Copy size={13} />}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Live Loading Typing Bubble */}
        {loading && (
          <div className="message-row assistant-row animate-fade-in">
            <div className="message-avatar">
              <div className="avatar bot-bubble">
                <Bot size={16} />
              </div>
            </div>
            <div className="message-content-wrapper">
              <div className="message-bubble bot-speech glass-panel typing-bubble">
                <div className="typing-indicator">
                  <span className="typing-dot"></span>
                  <span className="typing-dot"></span>
                  <span className="typing-dot"></span>
                </div>
                <span className="generating-text">
                  Retrieving chunks & generating grounded answer with Gemini...
                </span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Prompts if chat is brief */}
      {messages.length <= 2 && !loading && (
        <div className="suggested-prompts-section animate-fade-in">
          <div className="prompt-header">
            <Sparkles size={14} className="text-indigo" />
            <span>Suggested questions for your documents:</span>
          </div>
          <div className="prompts-grid">
            {starterPrompts.map((prompt, idx) => (
              <button
                key={idx}
                type="button"
                className="starter-prompt-card glass-panel"
                onClick={() => handleSend(prompt)}
              >
                <span>{prompt}</span>
                <ArrowRight size={14} className="prompt-arrow" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Composer */}
      <div className="chat-composer glass-panel">
        <textarea
          ref={textareaRef}
          className="composer-textarea"
          rows={1}
          placeholder="Ask a question about your documents... (Press Enter to send)"
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
        />

        <button
          type="button"
          className="btn btn-primary send-btn"
          onClick={() => handleSend()}
          disabled={!inputQuery.trim() || loading}
          title="Send Query"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
        </button>
      </div>

      <style>{`
        .chat-interface-wrapper {
          display: flex;
          flex-direction: column;
          height: calc(100vh - 100px);
          max-width: 1100px;
          margin: 0 auto;
          padding: 1rem 1.5rem;
          gap: 1rem;
        }

        .chat-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.85rem 1.25rem;
          border-radius: var(--radius-md);
        }

        .chat-header-info {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .agent-avatar-glow {
          width: 38px;
          height: 38px;
          border-radius: var(--radius-sm);
          background: rgba(99, 102, 241, 0.15);
          border: 1px solid var(--border-active);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 12px rgba(99, 102, 241, 0.2);
        }

        .chat-title {
          font-weight: 700;
          font-size: 0.95rem;
          color: #ffffff;
        }

        .chat-tenant-scope {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 0.75rem;
          color: var(--text-muted);
          font-family: var(--font-mono);
        }

        .btn-sm {
          padding: 0.4rem 0.75rem;
          font-size: 0.8rem;
        }

        .messages-stream {
          flex: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          padding-right: 0.5rem;
        }

        .message-row {
          display: flex;
          gap: 0.75rem;
          max-width: 88%;
        }

        .user-row {
          align-self: flex-end;
          flex-direction: row-reverse;
        }

        .assistant-row {
          align-self: flex-start;
        }

        .message-avatar {
          flex-shrink: 0;
          margin-top: 2px;
        }

        .avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .user-bubble {
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: #ffffff;
        }

        .bot-bubble {
          background: rgba(99, 102, 241, 0.2);
          border: 1px solid rgba(99, 102, 241, 0.4);
          color: #a5b4fc;
        }

        .error-bubble {
          background: rgba(244, 63, 94, 0.2);
          border-color: rgba(244, 63, 94, 0.4);
          color: #fb7185;
        }

        .message-bubble {
          padding: 1rem 1.25rem;
          border-radius: var(--radius-lg);
          font-size: 0.92rem;
          line-height: 1.6;
          position: relative;
        }

        .user-speech {
          background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%);
          color: #ffffff;
          border-bottom-right-radius: 4px;
          box-shadow: 0 4px 14px rgba(79, 70, 229, 0.25);
        }

        .bot-speech {
          border-bottom-left-radius: 4px;
          background: rgba(18, 24, 38, 0.85);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }

        .error-speech {
          background: rgba(244, 63, 94, 0.12);
          border: 1px solid rgba(244, 63, 94, 0.3);
          color: #fda4af;
          border-bottom-left-radius: 4px;
        }

        .message-text {
          white-space: pre-wrap;
          word-break: break-word;
        }

        .citations-container {
          margin-top: 0.85rem;
          padding-top: 0.75rem;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
        }

        .citations-header {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.75rem;
          color: var(--text-muted);
          font-weight: 600;
          margin-bottom: 0.45rem;
        }

        .citations-list {
          display: flex;
          flex-wrap: wrap;
          gap: 0.4rem;
        }

        .citation-tag {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          padding: 0.2rem 0.55rem;
          border-radius: var(--radius-sm);
          background: rgba(6, 182, 212, 0.1);
          border: 1px solid rgba(6, 182, 212, 0.25);
          color: #38bdf8;
          font-family: var(--font-mono);
          font-size: 0.75rem;
        }

        .message-footer {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 0.5rem;
          margin-top: 0.4rem;
        }

        .timestamp {
          font-size: 0.7rem;
          color: var(--text-dim);
          font-family: var(--font-mono);
        }

        .copy-btn {
          background: transparent;
          border: none;
          color: var(--text-dim);
          cursor: pointer;
          padding: 2px;
          border-radius: 3px;
          transition: all var(--transition-fast);
        }

        .copy-btn:hover {
          color: #ffffff;
        }

        .typing-bubble {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.85rem 1.25rem;
        }

        .typing-indicator {
          display: flex;
          gap: 4px;
        }

        .typing-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #818cf8;
          animation: pulseGlow 1.2s infinite ease-in-out;
        }

        .typing-dot:nth-child(2) {
          animation-delay: 0.2s;
        }

        .typing-dot:nth-child(3) {
          animation-delay: 0.4s;
        }

        .generating-text {
          font-size: 0.85rem;
          color: var(--text-muted);
          font-family: var(--font-mono);
        }

        .suggested-prompts-section {
          padding: 0.5rem 0;
        }

        .prompt-header {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.8rem;
          color: var(--text-muted);
          margin-bottom: 0.6rem;
          font-weight: 500;
        }

        .prompts-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
          gap: 0.6rem;
        }

        .starter-prompt-card {
          padding: 0.75rem 1rem;
          text-align: left;
          background: rgba(18, 24, 38, 0.6);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          color: var(--text-main);
          font-size: 0.85rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          cursor: pointer;
          transition: all var(--transition-smooth);
        }

        .starter-prompt-card:hover {
          background: rgba(99, 102, 241, 0.1);
          border-color: var(--border-active);
          transform: translateY(-2px);
        }

        .prompt-arrow {
          color: var(--text-dim);
          flex-shrink: 0;
          margin-left: 0.5rem;
          transition: transform var(--transition-fast);
        }

        .starter-prompt-card:hover .prompt-arrow {
          color: #818cf8;
          transform: translateX(3px);
        }

        .chat-composer {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.6rem 0.75rem 0.6rem 1.25rem;
          border-radius: var(--radius-lg);
          border: 1px solid var(--border-active);
          background: rgba(15, 23, 42, 0.9);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
        }

        .composer-textarea {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          color: var(--text-main);
          font-family: var(--font-body);
          font-size: 0.95rem;
          resize: none;
        }

        .composer-textarea::placeholder {
          color: var(--text-dim);
        }

        .send-btn {
          width: 42px;
          height: 42px;
          padding: 0;
          border-radius: var(--radius-md);
          flex-shrink: 0;
        }
      `}</style>
    </div>
  );
}
