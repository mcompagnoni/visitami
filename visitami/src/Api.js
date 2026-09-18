const BASE_URL = 'http://localhost:5000';
let logoutCallback = null;

const request = async (endpoint, options = {}) => {
  const defaultOptions = {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };
  
  const config = {
    ...defaultOptions,
    ...options,
    body: options.body ? JSON.stringify(options.body) : null,
  };
  
  if (config.method === 'GET') delete config.body;

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, config);
    if (response.status === 401) {
      console.warn("Sessione scaduta o non valida.");
      if (logoutCallback) logoutCallback();
      return Promise.reject("Unauthorized");
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.errore || `Errore HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
};

const API = {
  setUnauthorizedListener: (fn) => { logoutCallback = fn; },
  get: (endpoint) => request(endpoint, { method: 'GET' }),
  post: (endpoint, body) => request(endpoint, { method: 'POST', body }),
  
  // MODULO AUTH
  auth: {
    login: (email, password) => API.post('/login', { email, password }),
    logout: () => API.post('/logout'),
    me: () => API.get('/me'),
  },
  
  // MODULO PRENOTAZIONI
  prenotazioni: {
    lista: (argomenti) => API.get(`/prenotazioni?vista=${argomenti}`),
    crea: (dati) => API.post('/prenotazioni', dati),
    // cancella: (id) => API.post(`/prenotazioni/${id}`, { method: 'DELETE' })
  },

  esplora: {
    get: () => API.get('/esploraPrestazioni'),
  },
};

export default API;