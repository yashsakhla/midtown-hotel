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
      tariff: num(r.tariff ?? r.rate ?? r.price),
      beds: r.beds || fb.beds || '',
      size: r.sizeSqft ? `${r.sizeSqft} sq ft` : fb.size || '',
      sleeps: r.sleeps ?? fb.sleeps ?? 2,
      blurb: r.blurb || fb.blurb || '',
      perks: Array.isArray(r.perks) && r.perks.length ? r.perks : fb.perks || [],
      img: r.photoUrl || null
    };
  });

export function mapStay(stayData, folioData) {
  const s = stayData?.stay || stayData || {};
  const room = stayData?.room || s.room || {};
  const lines = list(folioData, 'lines').map((l, i) => ({
    id: l.id || `L${i}`,
    head: l.head || l.description || l.narration || 'Charge',
    amount: num(l.amount)
  }));
  const total = lines.reduce((t, l) => t + l.amount, 0);
  const checkIn = dateOnly(s.checkIn || s.checkInDate);
  const checkOut = dateOnly(s.checkOut || s.checkOutDate);
  const nights = s.nights ?? (checkIn && checkOut ? Math.round((new Date(checkOut) - new Date(checkIn)) / 864e5) : 0);
  return {
    room: String(room.number ?? s.roomNumber ?? ''),
    type: room.roomType?.name || room.roomTypeName || room.type || s.roomType || '',
    guest: s.guestName || '',
    phone: s.phone || '',
    checkIn,
    checkOut,
    nights: num(nights),
    rate: num(s.rate ?? room.rate ?? room.roomType?.tariff),
    folio: lines,
    balance: folioData?.balance != null ? num(folioData.balance) : total
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
    note: r.note || ''
  }));

export const mapBooking = (data, form, roomType) => {
  const b = data?.booking || data || {};
  return {
    id: b.id,
    ref: b.ref || b.reference || '',
    guest: form.guest,
    phone: form.phone,
    type: roomType?.type || form.type,
    rooms: num(form.rooms, 1),
    pax: num(form.pax, 2),
    inD: form.inD,
    outD: form.outD,
    nights: num(form.nights, 1),
    amount: num(b.amount, num(roomType?.tariff) * num(form.nights, 1) * num(form.rooms, 1)),
    status: b.status === 'CONFIRMED' ? 'Confirmed' : 'Requested'
  };
};
