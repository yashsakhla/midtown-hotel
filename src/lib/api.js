/** Thin client for the Midtown backend (/api/v1). Responses come wrapped as { data }. */

// Backend location comes from .env.development / .env.production (see project root).
export const BACKEND_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
const BASE = BACKEND_URL + (import.meta.env.VITE_API_PREFIX || '/api/v1');
const TOKEN_KEY = 'midtown.guest.token';
const MODE_KEY = 'midtown.guest.mode'; // 'stay' (signed in with room + OTP) or 'visitor'

export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export const session = {
  token: () => localStorage.getItem(TOKEN_KEY),
  mode: () => localStorage.getItem(MODE_KEY),
  save(token, mode) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(MODE_KEY, mode);
  },
  clear() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(MODE_KEY);
  }
};

let onUnauthorized = () => {};
export const setUnauthorizedHandler = (fn) => { onUnauthorized = fn; };

async function request(method, path, body) {
  const token = session.token();
  let res;
  try {
    res = await fetch(BASE + path, {
      method,
      headers: {
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: body !== undefined ? JSON.stringify(body) : undefined
    });
  } catch {
    throw new ApiError(0, 'Cannot reach the hotel server. Check your connection.');
  }

  let json = null;
  try { json = await res.json(); } catch { /* empty body */ }

  if (!res.ok) {
    const msg = json?.error?.message || json?.message || json?.error || `Request failed (${res.status})`;
    if (res.status === 401 && token) onUnauthorized();
    throw new ApiError(res.status, typeof msg === 'string' ? msg : 'Request failed');
  }
  return json && 'data' in json ? json.data : json;
}

const get = (p) => request('GET', p);
const post = (p, b = {}) => request('POST', p, b);

export const api = {
  requestOtp: (roomNumber, phone) => post('/auth/guest/request-otp', { roomNumber, phone }),
  verifyOtp: (roomNumber, phone, otp) => post('/auth/guest/verify-otp', { roomNumber, phone, otp }),

  // "Just browsing" — no login, no token. Needs these public endpoints on the backend.
  publicRoomTypes: () => get('/public/room-types'),
  publicBookingOtp: (phone) => post('/public/bookings/request-otp', { phone }),
  publicBook: (payload) => post('/public/bookings', payload),

  stay: () => get('/guest/stay'),
  folio: () => get('/guest/folio'),
  menu: () => get('/guest/menu'),
  roomTypes: () => get('/guest/room-types'),
  orders: () => get('/guest/orders'),
  placeOrder: (payload) => post('/guest/orders', payload),
  serviceRequests: () => get('/guest/service-requests'),
  sendServiceRequest: (key, note) => post('/guest/service-requests', { key, note }),
  checkoutRequest: (note) => post('/guest/checkout-request', { note }),
  feedback: (rating, text) => post('/guest/feedback', { rating, text }),
  book: (payload) => post('/guest/bookings', payload)
};
