const rawBase = import.meta.env.VITE_API_URL;

function normalizeBase(url) {
  if (!url) return '';
  const trimmed = url.trim().replace(/\/$/, '');
  if (/\/api$/i.test(trimmed)) {
    return trimmed;
  }
  return `${trimmed}/api`;
}

const base = normalizeBase(rawBase);

function url(path) {
  if (!base) throw new Error('VITE_API_URL is not set');
  return `${base.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
}

async function parseJson(r) {
  const ct = r.headers.get('content-type') || '';
  const text = await r.text();

  if (!ct.includes('application/json')) {
    try {
      return JSON.parse(text);
    } catch {
      const trimmed = text.trim();
      if (trimmed.startsWith('<!DOCTYPE') || trimmed.startsWith('<html')) {
        throw new Error('Terjadi kesalahan pada layanan, coba beberapa saat lagi.');
      }
      throw new Error(trimmed || `HTTP ${r.status}`);
    }
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new Error(text || 'Invalid JSON');
  }
}

export async function request(path, options = {}) {
  const { method = 'GET' } = options;
  const headers = new Headers(options.headers || {});
  const token = localStorage.getItem('mutu-token');
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const opts = { ...options, headers };
  const res = await fetch(url(path), opts);

  if (res.ok) return parseJson(res);

  const errTxt = await res.text();
  throw new Error(errTxt || `HTTP ${res.status}`);
}

// contoh simple untuk test
export async function ping() {
  return request('/ping');
}

export async function getAkreditasi(params = {}) {
  const query = new URLSearchParams();
  if (params.year) query.set('year', params.year);
  if (params.month) query.set('month', params.month);
  if (params.region) query.set('region', params.region);
  const suffix = query.toString() ? `?${query.toString()}` : '';
  return request(`/akreditasi${suffix}`);
}

export async function saveAkreditasi(payload) {
  return request('/akreditasi', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function getAkreditasiHistory(params = {}) {
  const query = new URLSearchParams();
  if (params.year) query.set('year', params.year);
  if (params.month) query.set('month', params.month);
  if (params.region) query.set('region', params.region);
  if (params.limit) query.set('limit', params.limit);
  const suffix = query.toString() ? `?${query.toString()}` : '';
  return request(`/akreditasi/history${suffix}`);
}

export async function getIndikators() {
  return request('/indikators');
}

export async function createIndicator(payload) {
  return request('/indikators', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function updateIndicator(id, payload) {
  return request(`/indikators/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function deleteIndicator(id) {
  return request(`/indikators/${id}`, { method: 'DELETE' });
}

export async function replaceIndicators(items) {
  return request('/indikators/replace', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items }),
  });
}

export async function updateAkreditasi(payload) {
  return request('/akreditasi', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function getDocuments() {
  return request('/documents');
}

export async function uploadDocument(formData) {
  return request('/documents', {
    method: 'POST',
    body: formData,
  });
}

export async function updateDocument(id, formData) {
  return request(`/documents/${id}`, {
    method: 'POST',
    body: formData,
  });
}

export async function deleteDocument(id) {
  return request(`/documents/${id}`, { method: 'DELETE' });
}

export async function register(userPayload) {
  const res = await request('/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userPayload),
  });
  if (res.token) {
    localStorage.setItem('mutu-token', res.token);
  }
  return res;
}

export async function login(email, password, recaptchaToken) {
  const res = await request('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, recaptcha_token: recaptchaToken }),
  });
  if (res.token) {
    localStorage.setItem('mutu-token', res.token);
  }
  return res;
}

export async function logout() {
  await request('/auth/logout', { method: 'POST' });
  localStorage.removeItem('mutu-token');
}

export async function me() {
  return request('/auth/me');
}

export async function updateProfile(updates) {
  return request('/profile', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
}

export async function getUsers() {
  return request('/admin/users');
}

export async function createUser(payload) {
  return request('/admin/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function updateUser(id, payload) {
  return request(`/admin/users/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function deleteUser(id) {
  return request(`/admin/users/${id}`, { method: 'DELETE' });
}

export async function trackVisitor({ sessionId, countView = false } = {}) {
  const headers = new Headers({ 'Content-Type': 'application/json' });
  if (sessionId) headers.set('X-Visitor-Session', sessionId);
  return request('/analytics/track', {
    method: 'POST',
    headers,
    body: JSON.stringify({ count_view: countView }),
  });
}

export async function getVisitorStats(days = 14) {
  return request(`/analytics/stats?days=${days}`);
}

export async function getVisitorSummary() {
  return request('/analytics/summary');
}

export async function getActivityLogs(limit = 20) {
  return request(`/activity/logs?limit=${limit}`);
}
