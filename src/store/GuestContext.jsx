import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { api, ApiError, session, setUnauthorizedHandler } from '../lib/api';
import { addDays, today } from '../lib/format';
import { normalizePhone, validateBooking } from '../lib/validate';
import { mapBooking, mapMenu, mapOrders, mapRequests, mapRoomTypes, mapStay } from '../lib/mappers';

const GuestContext = createContext(null);

/** Food GST, same rate the restaurant bills at. */
export const FOOD_GST = 0.05;

const EMPTY = {
  date: today(),
  stay: null,
  cart: [],
  orders: [],
  requests: [],
  bookings: [],
  feedback: null,
  menu: [],
  roomTypes: []
};

const errMsg = (e) => (e instanceof ApiError ? e.message : 'Something went wrong. Please try again.');

export function GuestProvider({ children }) {
  const [db, setDb] = useState(EMPTY);
  const [auth, setAuth] = useState(session.token() ? 'loading' : 'out'); // loading | out | stay | visitor
  const [tab, setTab] = useState('stay');
  const [sheet, setSheet] = useState(null);
  const [toastMsg, setToastMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const menuRef = useRef([]);

  const patch = useCallback((p) => setDb((prev) => ({ ...prev, ...(typeof p === 'function' ? p(prev) : p) })), []);

  const toast = useCallback((msg) => {
    setToastMsg(msg);
    window.clearTimeout(toast._t);
    toast._t = window.setTimeout(() => setToastMsg(''), 2600);
  }, []);

  const openSheet = useCallback((type, props = {}) => setSheet({ type, props }), []);
  const closeSheet = useCallback(() => setSheet(null), []);

  /* ---------------------------------------------------------------- loading */

  /** Orders + service requests change while the guest is looking, so they are polled. */
  const refreshActivity = useCallback(async () => {
    const [o, r] = await Promise.all([api.orders(), api.serviceRequests()]);
    patch({ orders: mapOrders(o, menuRef.current), requests: mapRequests(r) });
  }, [patch]);

  const refreshStay = useCallback(async () => {
    const [stay, folio] = await Promise.all([api.stay(), api.folio()]);
    patch({ stay: mapStay(stay, folio) });
  }, [patch]);

  const loadAll = useCallback(async (mode) => {
    if (mode === 'visitor') {
      patch({ ...EMPTY, date: today(), roomTypes: mapRoomTypes(await api.publicRoomTypes()) });
      return;
    }
    const [menuRaw, typesRaw] = await Promise.all([api.menu(), api.roomTypes()]);
    const menu = mapMenu(menuRaw);
    menuRef.current = menu;
    patch({ menu, roomTypes: mapRoomTypes(typesRaw), date: today() });
    await Promise.all([refreshStay(), refreshActivity()]);
  }, [patch, refreshStay, refreshActivity]);

  const signOut = useCallback(() => {
    session.clear();
    menuRef.current = [];
    setDb(EMPTY);
    setSheet(null);
    setTab('stay');
    setAuth('out');
  }, []);

  useEffect(() => { setUnauthorizedHandler(signOut); }, [signOut]);

  /* restore a saved session */
  useEffect(() => {
    if (!session.token() || session.mode() !== 'stay') { session.clear(); setAuth('out'); return; }
    loadAll('stay')
      .then(() => setAuth('stay'))
      .catch((e) => {
        if (e instanceof ApiError && e.status === 401) return; // handler already signed out
        toast(errMsg(e));
        setAuth('out');
      });
  }, [loadAll, toast]);

  /* keep orders and requests fresh */
  useEffect(() => {
    if (auth !== 'stay') return undefined;
    const t = window.setInterval(() => { refreshActivity().catch(() => {}); }, 20000);
    return () => window.clearInterval(t);
  }, [auth, refreshActivity]);

  /* ------------------------------------------------------------------ auth */

  const requestOtp = useCallback(async (roomNumber, phone) => {
    setBusy(true);
    try {
      await api.requestOtp(roomNumber, phone);
      toast('OTP sent to your phone');
      return true;
    } catch (e) { toast(errMsg(e)); return false; }
    finally { setBusy(false); }
  }, [toast]);

  const verifyOtp = useCallback(async (roomNumber, phone, otp) => {
    setBusy(true);
    try {
      const res = await api.verifyOtp(roomNumber, phone, otp);
      session.save(res.accessToken, 'stay');
      await loadAll('stay');
      setAuth('stay');
      return true;
    } catch (e) { session.clear(); toast(errMsg(e)); return false; }
    finally { setBusy(false); }
  }, [loadAll, toast]);

  /** "Just browsing": nothing is stored and nobody is signed in. */
  const browseAsVisitor = useCallback(async () => {
    setBusy(true);
    try {
      session.clear();
      await loadAll('visitor');
      setTab('rooms');
      setAuth('visitor');
      return true;
    } catch (e) { toast(errMsg(e)); return false; }
    finally { setBusy(false); }
  }, [loadAll, toast]);

  /** Visitors confirm their mobile number with an OTP before a booking is sent. */
  const sendBookingOtp = useCallback(async (phone) => {
    setBusy(true);
    try {
      await api.publicBookingOtp(normalizePhone(phone));
      toast('OTP sent to your mobile number');
      return true;
    } catch (e) { toast(errMsg(e)); return false; }
    finally { setBusy(false); }
  }, [toast]);

  /* ------------------------------------------------------------------ cart */

  const addToCart = useCallback((item, qty = 1, note = '') => {
    setDb((d) => {
      const cart = d.cart.map((c) => ({ ...c }));
      const found = cart.find((c) => c.id === item.id);
      if (found) { found.q += qty; if (note) found.note = note; }
      else cart.push({ id: item.id, n: item.n, p: item.p, q: qty, note });
      return { ...d, cart };
    });
    closeSheet();
    toast(`${item.n} added to your tray`);
  }, [closeSheet, toast]);

  const changeQty = useCallback((id, delta) => {
    setDb((d) => ({
      ...d,
      cart: d.cart
        .map((c) => (c.id === id ? { ...c, q: c.q + delta } : c))
        .filter((c) => c.q > 0)
    }));
  }, []);

  const clearCart = useCallback(() => patch({ cart: [] }), [patch]);

  /** "room" charges the folio (paid at check-out); "pay" is settled on delivery. */
  const placeOrder = useCallback(async (billTo, note) => {
    if (!db.cart.length) { toast('Your tray is empty'); return false; }
    if (auth !== 'stay') { toast('Sign in with your room number to order food'); return false; }

    setBusy(true);
    try {
      await api.placeOrder({
        items: db.cart.map((c) => ({ menuItemId: c.id, qty: c.q, note: c.note || '' })),
        billTo: billTo === 'room' ? 'ROOM' : 'PAY_NOW',
        note: note || ''
      });
      patch({ cart: [] });
      await Promise.all([refreshActivity(), refreshStay()]);
      closeSheet();
      setTab('orders');
      toast(billTo === 'room' ? 'Order placed — added to your bill' : 'Order placed');
      return true;
    } catch (e) { toast(errMsg(e)); return false; }
    finally { setBusy(false); }
  }, [db.cart, auth, patch, refreshActivity, refreshStay, closeSheet, toast]);

  /* -------------------------------------------------------------- services */

  const requestService = useCallback(async (service, note) => {
    setBusy(true);
    try {
      await api.sendServiceRequest(service.key, note || '');
      await refreshActivity();
      closeSheet();
      toast(`${service.label} — front desk notified`);
    } catch (e) { toast(errMsg(e)); }
    finally { setBusy(false); }
  }, [refreshActivity, closeSheet, toast]);

  /* -------------------------------------------------------------- bookings */

  const requestBooking = useCallback(async (form, otp) => {
    const guest = (form.guest || '').trim();
    const roomType = db.roomTypes.find((r) => r.type === form.type);
    if (!roomType) { toast('Pick a room type'); return false; }

    const problems = validateBooking(form, roomType, today());
    if (Object.keys(problems).length) { toast(Object.values(problems)[0]); return false; }

    const nights = Number(form.nights) || 1;
    const outD = form.outD || addDays(form.inD, nights);

    setBusy(true);
    try {
      const visitor = auth === 'visitor';
      const res = await (visitor ? api.publicBook : api.book)({
        guestName: guest,
        phone: normalizePhone(form.phone),
        ...(visitor ? { otp } : {}),
        roomTypeId: roomType.id,
        rooms: Number(form.rooms) || 1,
        pax: Number(form.pax) || 2,
        arrivalDate: form.inD,
        departureDate: outD,
        note: form.note || ''
      });
      const booking = mapBooking(res, { ...form, guest, outD, nights }, roomType);
      patch((d) => ({ bookings: [booking, ...d.bookings] }));
      closeSheet();
      if (visitor) {
        toast(booking.ref ? `Request sent (ref ${booking.ref}) — the hotel will call you` : 'Request sent — the hotel will call you');
      } else {
        setTab('orders');
        toast('Request sent — the hotel will confirm shortly');
      }
      return true;
    } catch (e) { toast(errMsg(e)); return false; }
    finally { setBusy(false); }
  }, [db.roomTypes, auth, patch, closeSheet, toast]);

  /* ----------------------------------------------------------- check-out */

  const requestCheckOut = useCallback(async (note) => {
    setBusy(true);
    try {
      await api.checkoutRequest(note || '');
      await refreshActivity();
      closeSheet();
      toast('Front desk is preparing your bill');
    } catch (e) { toast(errMsg(e)); }
    finally { setBusy(false); }
  }, [refreshActivity, closeSheet, toast]);

  const saveFeedback = useCallback(async (rating, text) => {
    setBusy(true);
    try {
      await api.feedback(rating, text || '');
      patch({ feedback: { rating, text, time: new Date().toTimeString().slice(0, 5) } });
      closeSheet();
      toast('Thank you — your feedback reached the manager');
    } catch (e) { toast(errMsg(e)); }
    finally { setBusy(false); }
  }, [patch, closeSheet, toast]);

  const value = useMemo(() => ({
    db, auth, busy, tab, setTab, sheet, openSheet, closeSheet, toastMsg, toast,
    actions: {
      requestOtp, verifyOtp, browseAsVisitor, sendBookingOtp, signOut,
      addToCart, changeQty, clearCart, placeOrder,
      requestService, requestBooking, requestCheckOut, saveFeedback
    }
  }), [
    db, auth, busy, tab, sheet, toastMsg, openSheet, closeSheet, toast,
    requestOtp, verifyOtp, browseAsVisitor, sendBookingOtp, signOut,
    addToCart, changeQty, clearCart, placeOrder,
    requestService, requestBooking, requestCheckOut, saveFeedback
  ]);

  return <GuestContext.Provider value={value}>{children}</GuestContext.Provider>;
}

export function useGuest() {
  const ctx = useContext(GuestContext);
  if (!ctx) throw new Error('useGuest must be used inside <GuestProvider>');
  return ctx;
}
