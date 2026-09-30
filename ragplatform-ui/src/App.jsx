import React, { useState, useEffect } from 'react';
import { api, getStoredUser, clearSession } from './api';
import Navbar from './components/Navbar';
import AuthModal from './components/AuthModal';
import DocumentManager from './components/DocumentManager';
import ChatInterface from './components/ChatInterface';
import Overview from './components/Overview';

export default function App() {
  const [user, setUser] = useState(() => getStoredUser());
  const [activeTab, setActiveTab] = useState('chat');
  const [healthStatus, setHealthStatus] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const checkHealth = async () => {
    const health = await api.system.checkHealth();
    setHealthStatus(health);
  };

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 20000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleAuthExpired = () => {
      setUser(null);
      showToast('Session expired. Please log in again.', 'warning');
    };
    window.addEventListener('auth-expired', handleAuthExpired);
    return () => window.removeEventListener('auth-expired', handleAuthExpired);
  }, []);

  const handleAuthSuccess = (authenticatedUser) => {
    setUser(authenticatedUser);
    showToast(`Signed in as ${authenticatedUser.username} (${authenticatedUser.tenantId})`, 'success');
  };

  const handleLogout = () => {
    clearSession();
    setUser(null);
    showToast('Signed out successfully', 'info');
  };

  const handleDocumentUploaded = (uploadRes) => {
    showToast(`Successfully indexed "${uploadRes.fileName}" (${uploadRes.chunkCount} chunks)`, 'success');
  };

  return (
    <div className="app-container">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        onLogout={handleLogout}
        healthStatus={healthStatus}
      />

      {/* Floating Toast Notification */}
      {toast && (
        <div className={`toast-notification toast-${toast.type} animate-fade-in`}>
          <span>{toast.message}</span>
        </div>
      )}

      <main className="app-main-content">
        {!user ? (
          <AuthModal onAuthSuccess={handleAuthSuccess} />
        ) : (
          <>
            {activeTab === 'chat' && (
              <ChatInterface
                user={user}
                onGoToDocuments={() => setActiveTab('documents')}
              />
            )}
            {activeTab === 'documents' && (
              <DocumentManager
                user={user}
                onDocumentUploaded={handleDocumentUploaded}
              />
            )}
            {activeTab === 'overview' && (
              <Overview
                user={user}
                healthStatus={healthStatus}
              />
            )}
          </>
        )}
      </main>

      <style>{`
        .app-container {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }

        .app-main-content {
          flex: 1;
        }

        .toast-notification {
          position: fixed;
          bottom: 1.5rem;
          right: 1.5rem;
          z-index: 1000;
          padding: 0.85rem 1.25rem;
          border-radius: var(--radius-md);
          font-size: 0.88rem;
          font-weight: 500;
          backdrop-filter: blur(12px);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .toast-info {
          background: rgba(15, 23, 42, 0.95);
          border: 1px solid rgba(99, 102, 241, 0.4);
          color: #c7d2fe;
        }

        .toast-success {
          background: rgba(6, 78, 59, 0.95);
          border: 1px solid rgba(16, 185, 129, 0.5);
          color: #a7f3d0;
        }

        .toast-warning {
          background: rgba(120, 53, 15, 0.95);
          border: 1px solid rgba(245, 158, 11, 0.5);
          color: #fde68a;
        }
      `}</style>
    </div>
  );
}
