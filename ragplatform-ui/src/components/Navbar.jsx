import React from 'react';
import { Layers, Database, MessageSquare, HardDrive, ShieldCheck, LogOut, Activity, Cpu } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, user, onLogout, healthStatus }) {
  const isHealthy = healthStatus?.status === 'UP';

  return (
    <header className="navbar-container">
      <div className="navbar-content">
        {/* Brand */}
        <div className="navbar-brand">
          <div className="brand-logo-glow">
            <Layers className="brand-icon" size={24} />
          </div>
          <div>
            <div className="brand-title">
              Nexus<span className="gradient-text">RAG</span>
            </div>
            <div className="brand-subtitle">
              <Cpu size={11} style={{ display: 'inline', marginRight: 4 }} />
              Spring AI &bull; Gemini Flash &bull; pgvector
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        {user && (
          <nav className="navbar-nav">
            <button
              className={`nav-tab-btn ${activeTab === 'chat' ? 'active' : ''}`}
              onClick={() => setActiveTab('chat')}
            >
              <MessageSquare size={16} />
              <span>RAG Assistant</span>
            </button>
            <button
              className={`nav-tab-btn ${activeTab === 'documents' ? 'active' : ''}`}
              onClick={() => setActiveTab('documents')}
            >
              <HardDrive size={16} />
              <span>Document Store</span>
            </button>
            <button
              className={`nav-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              <Database size={16} />
              <span>Architecture</span>
            </button>
          </nav>
        )}

        {/* Right Section */}
        <div className="navbar-actions">
          {/* Health Indicator */}
          <div className="health-pill" title={`Backend Health: ${healthStatus?.status || 'Checking'}`}>
            <span className={`health-dot ${isHealthy ? 'healthy' : 'unhealthy'}`}></span>
            <span className="health-label">
              {isHealthy ? 'Backend Active' : healthStatus?.status ? `Backend: ${healthStatus.status}` : 'Connecting...'}
            </span>
          </div>

          {/* User profile */}
          {user ? (
            <div className="user-profile-badge">
              <div className="user-avatar">
                {user.username.charAt(0).toUpperCase()}
              </div>
              <div className="user-details">
                <span className="user-name">{user.username}</span>
                <span className="tenant-tag" title="Multi-tenant vector namespace">
                  <ShieldCheck size={11} /> {user.tenantId || user.username}
                </span>
              </div>
              <button 
                onClick={onLogout} 
                className="btn btn-ghost logout-btn" 
                title="Sign out"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <div className="guest-badge">
              <span>Authentication Required</span>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .navbar-container {
          background: rgba(10, 14, 23, 0.85);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          border-bottom: 1px solid var(--border-subtle);
          position: sticky;
          top: 0;
          z-index: 100;
          padding: 0.75rem 1.5rem;
        }

        .navbar-content {
          max-width: 1400px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1.5rem;
        }

        .navbar-brand {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .brand-logo-glow {
          width: 40px;
          height: 40px;
          border-radius: var(--radius-md);
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.25) 0%, rgba(139, 92, 246, 0.3) 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid var(--border-active);
          box-shadow: 0 0 16px rgba(99, 102, 241, 0.3);
          color: #a5b4fc;
        }

        .brand-title {
          font-family: var(--font-heading);
          font-size: 1.25rem;
          font-weight: 800;
          letter-spacing: -0.02em;
          color: #ffffff;
        }

        .brand-subtitle {
          font-size: 0.7rem;
          color: var(--text-dim);
          font-family: var(--font-mono);
          letter-spacing: 0.02em;
        }

        .navbar-nav {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(15, 23, 42, 0.6);
          padding: 0.3rem 0.4rem;
          border-radius: var(--radius-full);
          border: 1px solid var(--border-subtle);
        }

        .nav-tab-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.45rem 1rem;
          border-radius: var(--radius-full);
          background: transparent;
          border: none;
          color: var(--text-muted);
          font-family: var(--font-body);
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .nav-tab-btn:hover {
          color: var(--text-main);
          background: rgba(255, 255, 255, 0.05);
        }

        .nav-tab-btn.active {
          color: #ffffff;
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.3) 0%, rgba(139, 92, 246, 0.3) 100%);
          border: 1px solid rgba(99, 102, 241, 0.4);
          box-shadow: 0 2px 8px rgba(99, 102, 241, 0.2);
        }

        .navbar-actions {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .health-pill {
          display: flex;
          align-items: center;
          gap: 0.45rem;
          padding: 0.35rem 0.75rem;
          border-radius: var(--radius-full);
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid var(--border-subtle);
          font-size: 0.75rem;
          font-family: var(--font-mono);
          color: var(--text-muted);
        }

        .health-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .health-dot.healthy {
          background-color: var(--accent-emerald);
          box-shadow: 0 0 8px #10b981;
        }

        .health-dot.unhealthy {
          background-color: var(--accent-rose);
          box-shadow: 0 0 8px #f43f5e;
        }

        .user-profile-badge {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          padding: 0.3rem 0.5rem 0.3rem 0.75rem;
          border-radius: var(--radius-full);
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid var(--border-subtle);
        }

        .user-avatar {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--accent-indigo), var(--accent-cyan));
          color: #ffffff;
          font-weight: 700;
          font-size: 0.8rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .user-details {
          display: flex;
          flex-direction: column;
        }

        .user-name {
          font-size: 0.82rem;
          font-weight: 600;
          color: var(--text-main);
          line-height: 1.1;
        }

        .tenant-tag {
          font-size: 0.68rem;
          color: #38bdf8;
          font-family: var(--font-mono);
          display: flex;
          align-items: center;
          gap: 3px;
        }

        .logout-btn {
          padding: 0.35rem;
          border-radius: 50%;
          color: var(--text-dim);
        }

        .logout-btn:hover {
          color: #fb7185;
          background: rgba(244, 63, 94, 0.15);
        }

        .guest-badge {
          font-size: 0.8rem;
          color: var(--text-muted);
          padding: 0.35rem 0.75rem;
          border-radius: var(--radius-full);
          border: 1px solid var(--border-subtle);
          background: rgba(255, 255, 255, 0.03);
        }

        @media (max-width: 768px) {
          .navbar-nav {
            display: none;
          }
          .health-pill {
            display: none;
          }
        }
      `}</style>
    </header>
  );
}
