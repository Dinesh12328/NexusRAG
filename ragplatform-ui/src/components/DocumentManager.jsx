import React, { useState, useEffect, useRef } from 'react';
import { api } from '../api';
import { 
  UploadCloud, FileText, CheckCircle2, Clock, AlertTriangle, 
  RefreshCw, Search, Database, Layers, ArrowUpRight, FileUp, Sparkles, Loader2, Trash2 
} from 'lucide-react';

export default function DocumentManager({ user, onDocumentUploaded }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [clearing, setClearing] = useState(false);
  const fileInputRef = useRef(null);

  const fetchDocuments = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.documents.list();
      setDocuments(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to fetch document catalog');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDocument = async (doc) => {
    if (!doc.id) return;
    const confirmDelete = window.confirm(`Are you sure you want to delete "${doc.fileName}"? This will remove all its chunks and vector embeddings.`);
    if (!confirmDelete) return;

    setDeletingId(doc.id);
    setError(null);
    try {
      await api.documents.delete(doc.id);
      await fetchDocuments();
    } catch (err) {
      setError(err.message || 'Failed to delete document');
    } finally {
      setDeletingId(null);
    }
  };

  const handleClearAll = async () => {
    const confirmClear = window.confirm('Are you sure you want to delete ALL documents? This will completely clear your knowledge base and vector embeddings so you can start fresh.');
    if (!confirmClear) return;

    setClearing(true);
    setError(null);
    try {
      await api.documents.clearAll();
      await fetchDocuments();
    } catch (err) {
      setError(err.message || 'Failed to clear documents');
    } finally {
      setClearing(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleFileUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    setError(null);
    setUploadResult(null);

    try {
      const res = await api.documents.upload(file);
      setUploadResult(res);
      await fetchDocuments();
      if (onDocumentUploaded) {
        onDocumentUploaded(res);
      }
    } catch (err) {
      setError(err.message || 'Failed to upload and ingest document');
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const createSampleDocAndUpload = async () => {
    const sampleContent = `# Project Nexus RAG - Multi-Tenant Architecture & Knowledge Base
Tenant ID: ${user.username}
Generated: ${new Date().toISOString()}

## Platform Overview
NexusRAG is an enterprise-grade retrieval-augmented generation engine designed with strict tenant isolation.

### Key Capabilities
1. Multi-tenant document ingestion with Apache Tika parsing (PDF, DOCX, TXT, MD).
2. Semantic embeddings computed via Google Gemini embedding model (gemini-embedding-001) in 768 dimensions.
3. Vector similarity search utilizing PostgreSQL + pgvector with HNSW cosine distance indexing.
4. Gemini Flash 3.8 Chat completion with automatic context injection and citations.
5. Upstash Redis distributed conversation buffer memory.

### Operational Guidelines
- Maximum document upload size is configured at 20MB.
- Embeddings are partitioned by tenant_id column in document_metadata and vector store metadata filter.
- Chat prompts strictly enforce context-grounded truth to avoid hallucinations.
`;

    const blob = new Blob([sampleContent], { type: 'text/markdown' });
    const file = new File([blob], `nexus_platform_manual_${user.username}.md`, { type: 'text/markdown' });
    await handleFileUpload(file);
  };

  const formatFileSize = (bytes) => {
    if (!bytes && bytes !== 0) return 'N/A';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Recently';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, { 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch {
      return dateStr;
    }
  };

  const filteredDocs = documents.filter((doc) => {
    const name = (doc.fileName || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    return name.includes(query);
  });

  const totalChunks = documents.reduce((acc, curr) => acc + (curr.chunkCount || 0), 0);

  return (
    <div className="doc-manager-container animate-fade-in">
      {/* Top Banner / Stats */}
      <div className="doc-header-grid">
        <div className="glass-panel metric-card">
          <div className="metric-icon indigo">
            <FileText size={20} />
          </div>
          <div>
            <div className="metric-label">Indexed Documents</div>
            <div className="metric-value">{documents.length}</div>
          </div>
        </div>

        <div className="glass-panel metric-card">
          <div className="metric-icon purple">
            <Layers size={20} />
          </div>
          <div>
            <div className="metric-label">Total Vector Chunks</div>
            <div className="metric-value">{totalChunks}</div>
          </div>
        </div>

        <div className="glass-panel metric-card">
          <div className="metric-icon cyan">
            <Database size={20} />
          </div>
          <div>
            <div className="metric-label">Active Tenant Namespace</div>
            <div className="metric-value code-font">{user.tenantId || user.username}</div>
          </div>
        </div>
      </div>

      {/* Upload Zone */}
      <div className="upload-section glass-panel">
        <div
          className={`dropzone ${dragActive ? 'drag-active' : ''} ${uploading ? 'uploading' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => !uploading && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="file-input-hidden"
            accept=".pdf,.txt,.docx,.md,.csv,.json"
            onChange={handleFileChange}
            disabled={uploading}
          />

          <div className="dropzone-content">
            <div className="dropzone-icon-halo">
              {uploading ? (
                <Loader2 size={36} className="animate-spin text-indigo" />
              ) : (
                <UploadCloud size={36} className="text-indigo" />
              )}
            </div>

            <div className="dropzone-text">
              <h3>
                {uploading ? 'Ingesting, Chunking & Embedding Document...' : 'Upload Knowledge Document'}
              </h3>
              <p>
                {uploading
                  ? 'Apache Tika is extracting text, splitting into chunks, and generating Gemini vectors'
                  : 'Drag & drop your PDF, DOCX, TXT, or Markdown file here, or click to browse'}
              </p>
            </div>

            {!uploading && (
              <div className="dropzone-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                >
                  <FileUp size={16} />
                  <span>Choose File</span>
                </button>
                <button
                  type="button"
                  className="btn btn-ghost sample-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    createSampleDocAndUpload();
                  }}
                  title="Generate a sample Markdown guide and ingest into vector store"
                >
                  <Sparkles size={16} />
                  <span>Upload Sample Doc</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Upload Success Alert */}
        {uploadResult && (
          <div className="upload-result-banner animate-fade-in">
            <div className="result-icon">
              <CheckCircle2 size={20} />
            </div>
            <div className="result-details">
              <div className="result-title">
                Document Ingested: <strong>{uploadResult.fileName}</strong>
              </div>
              <div className="result-meta">
                <span>Chunks: <strong>{uploadResult.chunkCount}</strong></span>
                &bull;
                <span>Tenant: <code>{uploadResult.tenantId}</code></span>
                &bull;
                <span>Status: <span className="badge badge-success">{uploadResult.status || 'COMPLETED'}</span></span>
              </div>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="upload-error-banner animate-fade-in">
            <AlertTriangle size={20} />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Document Library Table */}
      <div className="doc-library glass-panel">
        <div className="library-toolbar">
          <div className="toolbar-title">
            <h3>Knowledge Catalog</h3>
            <span className="badge badge-info">{filteredDocs.length} files</span>
          </div>

          <div className="toolbar-controls">
            <div className="search-box">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                placeholder="Filter documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="form-input search-input"
              />
            </div>

            <button
              className="btn btn-secondary refresh-btn"
              onClick={fetchDocuments}
              disabled={loading || clearing}
              title="Refresh document catalog"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>

            <button
              className="btn btn-secondary clear-catalog-btn"
              onClick={handleClearAll}
              disabled={loading || clearing || documents.length === 0}
              title="Delete all documents to start completely fresh"
            >
              {clearing ? (
                <Loader2 size={15} className="animate-spin text-danger" />
              ) : (
                <Trash2 size={15} className="text-danger" />
              )}
              <span>Clear All</span>
            </button>
          </div>
        </div>

        {/* Catalog Table */}
        <div className="table-responsive">
          <table className="doc-table">
            <thead>
              <tr>
                <th>Document Name</th>
                <th>File Size</th>
                <th>Content Type</th>
                <th>Vector Chunks</th>
                <th>Status</th>
                <th>Uploaded</th>
                <th style={{ textAlign: 'center', width: '80px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDocs.length > 0 ? (
                filteredDocs.map((doc) => (
                  <tr key={doc.id || doc.fileName}>
                    <td>
                      <div className="file-cell">
                        <FileText size={18} className="file-icon" />
                        <span className="file-name" title={doc.fileName}>
                          {doc.fileName}
                        </span>
                      </div>
                    </td>
                    <td>{formatFileSize(doc.fileSize)}</td>
                    <td>
                      <span className="type-tag">{doc.contentType || 'document'}</span>
                    </td>
                    <td>
                      <span className="chunk-pill">
                        {doc.chunkCount != null ? `${doc.chunkCount} chunks` : '—'}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          doc.status === 'COMPLETED'
                            ? 'badge-success'
                            : doc.status === 'FAILED'
                            ? 'badge-danger'
                            : 'badge-warning'
                        }`}
                      >
                        {doc.status || 'READY'}
                      </span>
                    </td>
                    <td className="date-cell">
                      <Clock size={13} />
                      <span>{formatDate(doc.uploadedAt)}</span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        type="button"
                        className="btn-delete-row"
                        onClick={() => handleDeleteDocument(doc)}
                        disabled={deletingId === doc.id || clearing}
                        title={`Delete ${doc.fileName}`}
                      >
                        {deletingId === doc.id ? (
                          <Loader2 size={15} className="animate-spin" />
                        ) : (
                          <Trash2 size={15} />
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="empty-state-cell">
                    {loading ? (
                      <div className="empty-loading">
                        <Loader2 size={24} className="animate-spin text-indigo" />
                        <span>Loading documents...</span>
                      </div>
                    ) : (
                      <div className="empty-docs">
                        <FileText size={40} className="empty-icon" />
                        <h4>No documents found in this workspace</h4>
                        <p>
                          Upload your PDF, DOCX, TXT, or MD manuals above to enable retrieval augmented generation.
                        </p>
                      </div>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        .doc-manager-container {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          max-width: 1300px;
          margin: 0 auto;
          padding: 1.5rem;
        }

        .doc-header-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 1.25rem;
        }

        .metric-card {
          padding: 1.25rem;
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .metric-icon {
          width: 48px;
          height: 48px;
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .metric-icon.indigo {
          background: rgba(99, 102, 241, 0.15);
          color: #818cf8;
          border: 1px solid rgba(99, 102, 241, 0.3);
        }

        .metric-icon.purple {
          background: rgba(139, 92, 246, 0.15);
          color: #a78bfa;
          border: 1px solid rgba(139, 92, 246, 0.3);
        }

        .metric-icon.cyan {
          background: rgba(6, 182, 212, 0.15);
          color: #38bdf8;
          border: 1px solid rgba(6, 182, 212, 0.3);
        }

        .metric-label {
          font-size: 0.8rem;
          color: var(--text-muted);
          font-weight: 500;
        }

        .metric-value {
          font-size: 1.5rem;
          font-weight: 700;
          color: #ffffff;
          line-height: 1.2;
        }

        .code-font {
          font-family: var(--font-mono);
          font-size: 1.1rem;
          color: #38bdf8;
        }

        .upload-section {
          padding: 1.5rem;
        }

        .dropzone {
          border: 2px dashed rgba(99, 102, 241, 0.35);
          border-radius: var(--radius-lg);
          padding: 2.5rem 1.5rem;
          text-align: center;
          cursor: pointer;
          transition: all var(--transition-smooth);
          background: rgba(15, 23, 42, 0.4);
        }

        .dropzone:hover {
          border-color: var(--accent-indigo);
          background: rgba(99, 102, 241, 0.05);
        }

        .dropzone.drag-active {
          border-color: var(--accent-cyan);
          background: rgba(6, 182, 212, 0.08);
          transform: scale(1.01);
        }

        .dropzone.uploading {
          cursor: wait;
          border-color: var(--accent-purple);
        }

        .file-input-hidden {
          display: none;
        }

        .dropzone-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
        }

        .dropzone-icon-halo {
          width: 68px;
          height: 68px;
          border-radius: 50%;
          background: rgba(99, 102, 241, 0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid var(--border-active);
        }

        .dropzone-text h3 {
          font-size: 1.2rem;
          margin-bottom: 0.25rem;
        }

        .dropzone-text p {
          color: var(--text-muted);
          font-size: 0.9rem;
          max-width: 500px;
        }

        .dropzone-actions {
          display: flex;
          gap: 0.75rem;
          margin-top: 0.5rem;
        }

        .sample-btn {
          border: 1px solid rgba(255, 255, 255, 0.12);
        }

        .upload-result-banner {
          margin-top: 1.25rem;
          padding: 1rem 1.25rem;
          border-radius: var(--radius-md);
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.3);
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .result-icon {
          color: #34d399;
        }

        .result-title {
          font-size: 0.95rem;
          color: #f1f5f9;
        }

        .result-meta {
          font-size: 0.8rem;
          color: var(--text-muted);
          display: flex;
          gap: 0.5rem;
          align-items: center;
          margin-top: 0.25rem;
        }

        .upload-error-banner {
          margin-top: 1.25rem;
          padding: 1rem 1.25rem;
          border-radius: var(--radius-md);
          background: rgba(244, 63, 94, 0.12);
          border: 1px solid rgba(244, 63, 94, 0.3);
          color: #fb7185;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 0.9rem;
        }

        .doc-library {
          padding: 1.5rem;
        }

        .library-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 1rem;
          margin-bottom: 1.25rem;
        }

        .toolbar-title {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .toolbar-controls {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .search-box {
          position: relative;
          display: flex;
          align-items: center;
        }

        .search-icon {
          position: absolute;
          left: 0.75rem;
          color: var(--text-dim);
        }

        .search-input {
          padding-left: 2.25rem;
          width: 220px;
          padding-top: 0.5rem;
          padding-bottom: 0.5rem;
        }

        .refresh-btn {
          padding: 0.5rem 0.9rem;
        }

        .table-responsive {
          overflow-x: auto;
        }

        .doc-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
          font-size: 0.9rem;
        }

        .doc-table th {
          padding: 0.75rem 1rem;
          color: var(--text-dim);
          font-weight: 600;
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          border-bottom: 1px solid var(--border-subtle);
        }

        .doc-table td {
          padding: 0.9rem 1rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.04);
          color: var(--text-main);
        }

        .doc-table tr:hover td {
          background: rgba(255, 255, 255, 0.02);
        }

        .file-cell {
          display: flex;
          align-items: center;
          gap: 0.65rem;
        }

        .file-icon {
          color: #818cf8;
          flex-shrink: 0;
        }

        .file-name {
          font-weight: 600;
          color: #ffffff;
        }

        .type-tag {
          font-family: var(--font-mono);
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .chunk-pill {
          font-family: var(--font-mono);
          font-size: 0.8rem;
          color: #38bdf8;
          background: rgba(6, 182, 212, 0.1);
          padding: 0.2rem 0.5rem;
          border-radius: var(--radius-sm);
          border: 1px solid rgba(6, 182, 212, 0.2);
        }

        .date-cell {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          color: var(--text-dim);
          font-size: 0.8rem;
        }

        .empty-state-cell {
          text-align: center;
          padding: 3rem 1rem !important;
        }

        .empty-docs {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
        }

        .empty-icon {
          color: var(--text-dim);
          margin-bottom: 0.5rem;
        }

        .empty-docs h4 {
          font-size: 1.1rem;
          color: var(--text-main);
        }

        .empty-docs p {
          color: var(--text-muted);
          font-size: 0.85rem;
          max-width: 420px;
        }

        .empty-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          color: var(--text-muted);
        }

        .clear-catalog-btn {
          color: #f43f5e !important;
          border-color: rgba(244, 63, 94, 0.25) !important;
        }

        .clear-catalog-btn:hover:not(:disabled) {
          background: rgba(244, 63, 94, 0.12) !important;
          border-color: rgba(244, 63, 94, 0.45) !important;
        }

        .btn-delete-row {
          background: transparent;
          border: 1px solid transparent;
          color: var(--text-dim);
          border-radius: var(--radius-sm);
          padding: 0.35rem 0.45rem;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: all var(--transition-fast);
        }

        .btn-delete-row:hover:not(:disabled) {
          background: rgba(244, 63, 94, 0.15);
          color: #fb7185;
          border-color: rgba(244, 63, 94, 0.3);
        }

        .btn-delete-row:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .text-danger {
          color: #fb7185;
        }
      `}</style>
    </div>
  );
}
