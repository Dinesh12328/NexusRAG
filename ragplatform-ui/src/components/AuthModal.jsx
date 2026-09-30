import React, { useState } from 'react';
import { api, setSession } from '../api';
import { Lock, User, Mail, ArrowRight, ShieldCheck, Sparkles, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export default function AuthModal({ onAuthSuccess }) {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('dinesh');
  const [email, setEmail] = useState('dinesh@example.com');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      let res;
      if (isRegister) {
        if (!email) throw new Error('Email is required for registration');
        res = await api.auth.register(username.trim(), email.trim(), password);
      } else {
        res = await api.auth.login(username.trim(), password);
      }

      if (res && res.token) {
        setSession(res.token, {
          username: res.username || username,
          email: res.email || email,
          tenantId: res.tenantId || username,
        });
        onAuthSuccess({
          username: res.username || username,
          email: res.email || email,
          tenantId: res.tenantId || username,
        });
      } else {
        throw new Error(res.message || 'Authentication failed: No token received');
      }
    } catch (err) {
      setError(err.message || 'An error occurred during authentication');
    } finally {
      setLoading(false);
    }
  };

  const fillQuickTenant = (name, mail) => {
    setUsername(name);
    setEmail(mail);
    setPassword('secret123');
    setError(null);
  };

  return (
    <div className="auth-overlay">
      <div className="auth-card glass-panel animate-fade-in">
        {/* Header Icon */}
        <div className="auth-badge-top">
          <div className="auth-icon-halo">
            <ShieldCheck size={28} className="auth-shield-icon" />
          </div>
          <h2>{isRegister ? 'Create Tenant Account' : 'Welcome to NexusRAG'}</h2>
          <p className="auth-subtext">
            {isRegister
              ? 'Register a secure workspace with isolated vector storage'
              : 'Enter your credentials to access your tenant knowledge base'}
          </p>
        </div>

        {/* Tab switch */}
        <div className="auth-tabs">
          <button
            type="button"
            className={`auth-tab ${!isRegister ? 'active' : ''}`}
            onClick={() => { setIsRegister(false); setError(null); }}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`auth-tab ${isRegister ? 'active' : ''}`}
            onClick={() => { setIsRegister(true); setError(null); }}
          >
            Register
          </button>
        </div>

        {/* Error notification */}
        {error && (
          <div className="auth-error-banner animate-fade-in">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label">Username / Tenant Name</label>
            <div className="input-with-icon">
              <User size={16} className="input-icon" />
              <input
                type="text"
                className="form-input"
                placeholder="e.g. acme_corp or dinesh"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          </div>

          {isRegister && (
            <div className="form-group animate-fade-in">
              <label className="form-label">Email Address</label>
              <div className="input-with-icon">
                <Mail size={16} className="input-icon" />
                <input
                  type="email"
                  className="form-input"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="input-with-icon">
              <Lock size={16} className="input-icon" />
              <input
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary auth-submit-btn"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <span>{isRegister ? 'Create & Launch' : 'Enter Workspace'}</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {/* Multi-tenant Quick Demo Helper */}
        <div className="auth-presets">
          <div className="presets-title">
            <Sparkles size={13} />
            <span>Quick Tenant Presets (Multi-Tenant Demo):</span>
          </div>
          <div className="preset-buttons">
            <button
              type="button"
              className="preset-btn"
              onClick={() => fillQuickTenant('tenant_alpha', 'alpha@enterprise.io')}
            >
              tenant_alpha
            </button>
            <button
              type="button"
              className="preset-btn"
              onClick={() => fillQuickTenant('tenant_beta', 'beta@research.org')}
            >
              tenant_beta
            </button>
            <button
              type="button"
              className="preset-btn"
              onClick={() => fillQuickTenant('dinesh', 'dinesh@ragplatform.com')}
            >
              dinesh (admin)
            </button>
          </div>
          <p className="tenant-isolation-note">
            Each tenant gets strict vector space isolation in pgvector via metadata filtering.
          </p>
        </div>
      </div>

      <style>{`
        .auth-overlay {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem 1rem;
          min-height: calc(100vh - 120px);
        }

        .auth-card {
          width: 100%;
          max-width: 440px;
          padding: 2.25rem 2rem;
          background: rgba(15, 23, 42, 0.85);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6), 0 0 50px rgba(99, 102, 241, 0.15);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .auth-badge-top {
          text-align: center;
          margin-bottom: 1.5rem;
        }

        .auth-icon-halo {
          width: 56px;
          height: 56px;
          margin: 0 auto 1rem;
          border-radius: var(--radius-lg);
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.25) 0%, rgba(139, 92, 246, 0.2) 100%);
          border: 1px solid var(--border-active);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 20px rgba(99, 102, 241, 0.3);
        }

        .auth-shield-icon {
          color: #a5b4fc;
        }

        .auth-subtext {
          font-size: 0.85rem;
          color: var(--text-muted);
          margin-top: 0.35rem;
        }

        .auth-tabs {
          display: flex;
          background: rgba(0, 0, 0, 0.3);
          padding: 4px;
          border-radius: var(--radius-md);
          margin-bottom: 1.5rem;
          border: 1px solid var(--border-subtle);
        }

        .auth-tab {
          flex: 1;
          padding: 0.5rem;
          background: transparent;
          border: none;
          color: var(--text-muted);
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          border-radius: var(--radius-sm);
          transition: all var(--transition-fast);
        }

        .auth-tab.active {
          background: rgba(255, 255, 255, 0.1);
          color: #ffffff;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
        }

        .auth-error-banner {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          border-radius: var(--radius-md);
          background: rgba(244, 63, 94, 0.12);
          border: 1px solid rgba(244, 63, 94, 0.35);
          color: #fb7185;
          font-size: 0.85rem;
          margin-bottom: 1.25rem;
        }

        .input-with-icon {
          position: relative;
          display: flex;
          align-items: center;
        }

        .input-icon {
          position: absolute;
          left: 1rem;
          color: var(--text-dim);
          pointer-events: none;
        }

        .input-with-icon .form-input {
          padding-left: 2.75rem;
        }

        .auth-submit-btn {
          width: 100%;
          margin-top: 0.5rem;
          padding: 0.85rem;
          font-size: 0.95rem;
        }

        .auth-presets {
          margin-top: 1.5rem;
          padding-top: 1.25rem;
          border-top: 1px solid var(--border-subtle);
        }

        .presets-title {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.78rem;
          font-weight: 600;
          color: var(--text-dim);
          text-transform: uppercase;
          letter-spacing: 0.04em;
          margin-bottom: 0.65rem;
        }

        .preset-buttons {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .preset-btn {
          padding: 0.3rem 0.65rem;
          border-radius: var(--radius-sm);
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--border-subtle);
          color: #38bdf8;
          font-size: 0.75rem;
          font-family: var(--font-mono);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .preset-btn:hover {
          background: rgba(56, 189, 248, 0.15);
          border-color: rgba(56, 189, 248, 0.4);
        }

        .tenant-isolation-note {
          margin-top: 0.75rem;
          font-size: 0.72rem;
          color: var(--text-dim);
          line-height: 1.4;
        }
      `}</style>
    </div>
  );
}
