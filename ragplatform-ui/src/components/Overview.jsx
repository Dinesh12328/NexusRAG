import React from 'react';
import { 
  Server, Cpu, Database, HardDrive, ShieldCheck, 
  Workflow, ArrowRight, CheckCircle2, Lock, Sparkles, Terminal 
} from 'lucide-react';

export default function Overview({ user, healthStatus }) {
  const isHealthy = healthStatus?.status === 'UP';

  return (
    <div className="overview-container animate-fade-in">
      {/* Header */}
      <div className="overview-hero glass-panel">
        <div className="hero-content">
          <div className="badge badge-info mb-2">
            <Sparkles size={12} /> Enterprise Multi-Tenant Architecture
          </div>
          <h2>NexusRAG Platform Topology</h2>
          <p className="hero-description">
            End-to-end Retrieval Augmented Generation platform built with Spring AI, 
            Google Gemini generative models, pgvector similarity indexing, and multi-tenant security isolation.
          </p>
        </div>

        <div className="hero-status-box">
          <div className="status-item">
            <span className="label">Spring Boot Core</span>
            <span className="value code-font">v3.3.5 (Java 21)</span>
          </div>
          <div className="status-item">
            <span className="label">Backend Status</span>
            <span className={`badge ${isHealthy ? 'badge-success' : 'badge-danger'}`}>
              {healthStatus?.status || 'UNKNOWN'}
            </span>
          </div>
          <div className="status-item">
            <span className="label">Active Tenant</span>
            <span className="value code-font text-cyan">{user.tenantId || user.username}</span>
          </div>
        </div>
      </div>

      {/* Architecture Flow Diagram */}
      <div className="pipeline-section glass-panel">
        <h3 className="section-title">
          <Workflow size={20} className="text-indigo" />
          <span>Ingestion & Retrieval Pipeline</span>
        </h3>

        <div className="pipeline-flow">
          <div className="pipeline-node">
            <div className="node-icon">
              <HardDrive size={22} />
            </div>
            <div className="node-title">1. Document Upload</div>
            <div className="node-desc">PDF, DOCX, TXT, MD via Apache Tika</div>
            <div className="node-badge">/api/documents/upload</div>
          </div>

          <div className="flow-arrow">
            <ArrowRight size={20} />
          </div>

          <div className="pipeline-node">
            <div className="node-icon purple">
              <Cpu size={22} />
            </div>
            <div className="node-title">2. Chunking & Embeddings</div>
            <div className="node-desc">Gemini gemini-embedding-001 (768 dim)</div>
            <div className="node-badge">Spring AI Model</div>
          </div>

          <div className="flow-arrow">
            <ArrowRight size={20} />
          </div>

          <div className="pipeline-node">
            <div className="node-icon cyan">
              <Database size={22} />
            </div>
            <div className="node-title">3. Vector Store</div>
            <div className="node-desc">Neon PostgreSQL + pgvector (HNSW)</div>
            <div className="node-badge">metadata: tenant_id</div>
          </div>

          <div className="flow-arrow">
            <ArrowRight size={20} />
          </div>

          <div className="pipeline-node">
            <div className="node-icon emerald">
              <Sparkles size={22} />
            </div>
            <div className="node-title">4. RAG Generation</div>
            <div className="node-desc">Gemini 3.8 Flash with context & citations</div>
            <div className="node-badge">/api/chat</div>
          </div>
        </div>
      </div>

      {/* Grid of Components */}
      <div className="components-grid">
        {/* Component 1: Multi-Tenant Security */}
        <div className="glass-panel comp-card">
          <div className="comp-card-header">
            <div className="comp-icon indigo">
              <ShieldCheck size={20} />
            </div>
            <h4>Tenant Isolation</h4>
          </div>
          <p className="comp-text">
            Every ingested chunk is stamped with the authenticated user's <code>tenant_id</code>. 
            All similarity searches query with strict filter criteria, preventing cross-tenant data leakage.
          </p>
          <ul className="comp-list">
            <li><CheckCircle2 size={14} className="text-emerald" /> JWT stateless token authentication</li>
            <li><CheckCircle2 size={14} className="text-emerald" /> BCrypt password hashing</li>
            <li><CheckCircle2 size={14} className="text-emerald" /> Per-tenant metadata filtering in pgvector</li>
          </ul>
        </div>

        {/* Component 2: LLM & Embeddings */}
        <div className="glass-panel comp-card">
          <div className="comp-card-header">
            <div className="comp-icon purple">
              <Cpu size={20} />
            </div>
            <h4>Google Gemini Integration</h4>
          </div>
          <p className="comp-text">
            Utilizes Spring AI 1.1.0 Google GenAI starters with official Gemini Flash and embedding backends.
          </p>
          <ul className="comp-list">
            <li><CheckCircle2 size={14} className="text-emerald" /> Chat Model: <code>gemini-3.8-flash</code></li>
            <li><CheckCircle2 size={14} className="text-emerald" /> Embeddings: <code>gemini-embedding-001</code></li>
            <li><CheckCircle2 size={14} className="text-emerald" /> Vector Dimensions: 768</li>
          </ul>
        </div>

        {/* Component 3: Data & Memory */}
        <div className="glass-panel comp-card">
          <div className="comp-card-header">
            <div className="comp-icon cyan">
              <Database size={20} />
            </div>
            <h4>Database & Memory</h4>
          </div>
          <p className="comp-text">
            Cloud database pairing Neon serverless Postgres for persistence and Upstash Redis for fast chat session memory.
          </p>
          <ul className="comp-list">
            <li><CheckCircle2 size={14} className="text-emerald" /> Neon PostgreSQL with pgvector extension</li>
            <li><CheckCircle2 size={14} className="text-emerald" /> HikariCP managed connection pool</li>
            <li><CheckCircle2 size={14} className="text-emerald" /> Upstash Redis SSL conversation cache</li>
          </ul>
        </div>
      </div>

      <style>{`
        .overview-container {
          max-width: 1300px;
          margin: 0 auto;
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .overview-hero {
          padding: 2rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 2rem;
        }

        .hero-content {
          max-width: 650px;
        }

        .hero-content h2 {
          font-size: 1.8rem;
          margin-bottom: 0.5rem;
        }

        .hero-description {
          color: var(--text-muted);
          font-size: 0.95rem;
        }

        .hero-status-box {
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          padding: 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          min-width: 250px;
        }

        .status-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.85rem;
        }

        .status-item .label {
          color: var(--text-dim);
        }

        .section-title {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 1.15rem;
          margin-bottom: 1.5rem;
        }

        .pipeline-section {
          padding: 1.75rem;
        }

        .pipeline-flow {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.75rem;
          overflow-x: auto;
          padding-bottom: 0.5rem;
        }

        .pipeline-node {
          background: rgba(15, 23, 42, 0.7);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          padding: 1.25rem 1rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          flex: 1;
          min-width: 180px;
        }

        .node-icon {
          width: 44px;
          height: 44px;
          border-radius: var(--radius-md);
          background: rgba(99, 102, 241, 0.15);
          color: #818cf8;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 0.75rem;
        }

        .node-icon.purple {
          background: rgba(139, 92, 246, 0.15);
          color: #a78bfa;
        }

        .node-icon.cyan {
          background: rgba(6, 182, 212, 0.15);
          color: #38bdf8;
        }

        .node-icon.emerald {
          background: rgba(16, 185, 129, 0.15);
          color: #34d399;
        }

        .node-title {
          font-weight: 700;
          font-size: 0.9rem;
          color: #ffffff;
          margin-bottom: 0.25rem;
        }

        .node-desc {
          font-size: 0.78rem;
          color: var(--text-muted);
          margin-bottom: 0.75rem;
          line-height: 1.4;
        }

        .node-badge {
          font-family: var(--font-mono);
          font-size: 0.7rem;
          padding: 2px 8px;
          border-radius: var(--radius-full);
          background: rgba(255, 255, 255, 0.05);
          color: #94a3b8;
          border: 1px solid var(--border-subtle);
        }

        .flow-arrow {
          color: var(--text-dim);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .components-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 1.25rem;
        }

        .comp-card {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
        }

        .comp-card-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 0.75rem;
        }

        .comp-icon {
          width: 36px;
          height: 36px;
          border-radius: var(--radius-sm);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .comp-icon.indigo {
          background: rgba(99, 102, 241, 0.15);
          color: #818cf8;
        }

        .comp-icon.purple {
          background: rgba(139, 92, 246, 0.15);
          color: #a78bfa;
        }

        .comp-icon.cyan {
          background: rgba(6, 182, 212, 0.15);
          color: #38bdf8;
        }

        .comp-text {
          font-size: 0.88rem;
          color: var(--text-muted);
          margin-bottom: 1rem;
          line-height: 1.5;
        }

        .comp-list {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          font-size: 0.82rem;
          color: var(--text-main);
          margin-top: auto;
        }

        .comp-list li {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .comp-list code {
          font-family: var(--font-mono);
          color: #38bdf8;
          font-size: 0.78rem;
        }
      `}</style>
    </div>
  );
}
