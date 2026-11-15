/** Turn API payloads into the shapes the screens already use. Tolerant of small naming differences. */
import { ROOM_TYPES as ROOM_FALLBACK } from '../data/seed';
import { num } from './format';

const list = (v, ...keys) => {
  if (Array.isArray(v)) return v;
  for (const k of keys) if (Array.isArray(v?.[k])) return v[k];
  return [];
};
const dateOnly = (v) => (v ? String(v).slice(0, 10) : '');
const clock = (v) => {
  if (!v) return '';
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? String(v).slice(0, 5) : d.toTimeString().slice(0, 5);
};

export const mapMenu = (data) =>
  list(data, 'items', 'menu')
    .filter((m) => m.available !== false)
    .map((m) => ({
      id: m.id,
      n: m.name,
      p: num(m.price),
      c: m.category || 'Other',
      veg: m.isVeg !== false,
      d: m.description || '',
      img: m.photoUrl || null
    }));

export const mapRoomTypes = (data) =>
  list(data, 'roomTypes', 'items').map((r) => {
    const name = r.name || r.type;
    const fb = ROOM_FALLBACK.find((x) => x.type === name) || {};
    return {
      id: r.id,
      type: name,
      singleRate: num(r.singleRate ?? r.tariff ?? r.rate ?? r.price),
      doubleRate: num(r.doubleRate ?? r.singleRate ?? r.tariff ?? r.rate ?? r.price),
      additionalGuestRate: num(r.additionalGuestRate),
      tariff: num(r.singleRate ?? r.tariff ?? r.rate ?? r.price),
      beds: r.beds || fb.beds || '',
      size: r.sizeSqft ? `${r.sizeSqft} sq ft` : fb.size || '',
      sleeps: r.sleeps ?? fb.sleeps ?? 2,
      blurb: r.blurb || fb.blurb || '',
      perks: Array.isArray(r.perks) && r.perks.length ? r.perks : fb.perks || [],
      img: r.photoUrl || null
    };
  });

const BOOKING_STATUS = ['REQUESTED', 'CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED'];
export const STATUS_LABEL = {
  REQUESTED: 'Requested', CONFIRMED: 'Confirmed', CHECKED_IN: 'Staying',
  CHECKED_OUT: 'Checked out', CANCELLED: 'Cancelled'
};

/** One booking can hold several rooms; each room has its own stay id (used for service requests). */
export function mapBookings(data) {
  return list(data, 'bookings', 'items').map((b) => {
    const status = BOOKING_STATUS.includes(String(b.status).toUpperCase()) ? String(b.status).toUpperCase() : 'REQUESTED';
    const arrival = dateOnly(b.arrivalDate || b.checkIn);
    const departure = dateOnly(b.departureDate || b.checkOut);
    const nights = b.nights ?? (arrival && departure ? Math.round((new Date(departure) - new Date(arrival)) / 864e5) : 0);
    return {
      id: b.id,
      ref: b.ref || b.reference || '',
      status,
      guest: b.guestName || '',
      phone: b.phone || '',
      arrival,
      departure,
      nights: num(nights),
      pax: num(b.pax, 0),
      rooms: list(b.rooms, 'items').map((r) => ({
        stayId: r.stayId || r.id,
        number: String(r.roomNumber ?? r.number ?? ''),
        type: r.roomType || r.type || '',
        rate: num(r.rate),
        guest: r.guestName || b.guestName || '',
        status: String(r.status || status).toUpperCase()
      })),
      amount: num(b.amount ?? b.total),
      balance: num(b.balance),
      invoiceUrl: b.invoiceUrl || ''
    };
  });
}

export function mapFolio(data) {
  const lines = list(data, 'lines').map((l, i) => ({
    id: l.id || `L${i}`,
    head: l.head || l.description || l.narration || 'Charge',
    room: l.roomNumber ? String(l.roomNumber) : '',
    amount: num(l.amount)
  }));
  const total = lines.reduce((t, l) => t + l.amount, 0);
  return {
    lines,
    balance: data?.balance != null ? num(data.balance) : total,
    paid: num(data?.paid),
    invoiceUrl: data?.invoiceUrl || ''
  };
}

const ORDER_STATUS = {
  PLACED: 'Placed',
  PREPARING: 'Preparing',
  ON_THE_WAY: 'On the way',
  SERVED: 'Served'
};

export const mapOrders = (data, menu) =>
  list(data, 'kots', 'orders').map((k) => {
    const items = (k.items || []).map((i) => {
      const dish = menu.find((m) => m.id === i.menuItemId);
      return {
        n: i.name || i.menuItem?.name || dish?.n || 'Item',
        p: num(i.price ?? i.menuItem?.price ?? dish?.p),
        q: num(i.qty ?? i.quantity, 1)
      };
    });
    const sub = items.reduce((t, i) => t + i.p * i.q, 0);
    return {
      id: k.id,
      kind: 'Room service',
      time: clock(k.createdAt || k.time),
      status: ORDER_STATUS[k.status] || 'Placed',
      items,
      total: num(k.total ?? k.amount, Math.round(sub * 1.05)),
      note: k.note || '',
      room: k.roomNumber ? String(k.roomNumber) : '',
      billTo: k.billTo === 'ROOM' ? 'room' : 'pay'
    };
  });

const REQUEST_STATUS = { DONE: 'Done', COMPLETED: 'Done', IN_PROGRESS: 'In progress' };

export const mapRequests = (data) =>
  list(data, 'requests', 'items').map((r) => ({
    id: r.id,
    key: r.key,
    label: r.label || r.key,
    time: clock(r.createdAt || r.time),
    status: REQUEST_STATUS[String(r.status).toUpperCase()] || 'Sent',
    note: r.note || '',
    rooms: list(r.rooms, 'items').map((x) => String(x.roomNumber ?? x.number ?? x)).filter(Boolean)
  }));
