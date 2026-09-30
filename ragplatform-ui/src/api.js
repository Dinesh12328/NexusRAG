const API_BASE = import.meta.env.VITE_API_BASE_URL || ''; // configurable for cloud deployments, fallback to proxy in local dev

export const TOKEN_STORAGE_KEY = 'rag_auth_token';
export const USER_STORAGE_KEY = 'rag_auth_user';

export function getStoredToken() {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function getStoredUser() {
  const raw = localStorage.getItem(USER_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

export function setSession(token, user) {
  if (token) {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  }
  if (user) {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(USER_STORAGE_KEY);
  }
}

export function clearSession() {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  localStorage.removeItem(USER_STORAGE_KEY);
}

async function request(endpoint, options = {}) {
  const token = getStoredToken();
  const headers = {
    ...options.headers,
  };

  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // If body is NOT FormData, set application/json
  if (options.body && !(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if ((response.status === 401 || response.status === 403) && !endpoint.startsWith('/api/auth/')) {
    // Session expired or invalid
    clearSession();
    window.dispatchEvent(new CustomEvent('auth-expired'));
    throw new Error('Session expired or unauthorized. Please sign in again.');
  }

  let data;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    const errorMsg = (data && data.message) || (data && data.error) || (typeof data === 'string' ? data : 'Request failed');
    throw new Error(errorMsg);
  }

  return data;
}

export const api = {
  auth: {
    async register(username, email, password) {
      return request('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ username, email, password }),
      });
    },

    async login(username, password) {
      return request('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });
    },
  },

  documents: {
    async list() {
      return request('/api/documents', {
        method: 'GET',
      });
    },

    async upload(file) {
      const formData = new FormData();
      formData.append('file', file);

      return request('/api/documents/upload', {
        method: 'POST',
        body: formData,
      });
    },

    async delete(id) {
      return request(`/api/documents/${id}`, {
        method: 'DELETE',
      });
    },

    async clearAll() {
      return request('/api/documents/clear', {
        method: 'DELETE',
      });
    },
  },

  chat: {
    async send(question) {
      return request('/api/chat', {
        method: 'POST',
        body: JSON.stringify({ question }),
      });
    },

    async getHistory() {
      return request('/api/chat/history', {
        method: 'GET',
      });
    },

    async clearHistory() {
      return request('/api/chat/history', {
        method: 'DELETE',
      });
    },
  },

  system: {
    async checkHealth() {
      try {
        const res = await fetch(`${API_BASE}/actuator/health`);
        if (!res.ok) return { status: 'DOWN', error: `HTTP ${res.status}` };
        return await res.json();
      } catch (err) {
        return { status: 'OFFLINE', error: err.message };
      }
    },

    async searchDirect(query) {
      return request(`/search?query=${encodeURIComponent(query)}`, {
        method: 'GET',
      });
    }
  }
};
