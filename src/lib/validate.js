/** Booking form rules. Shared by the form (inline errors) and the store (last line of defence). */

export const MAX_ROOMS = 10;
export const MAX_NIGHTS = 30;
export const BULK_MESSAGE = 'For bulk booking, please contact the front desk.';

/** 10-digit mobile number without +91 / 0 prefix or spaces. */
export const normalizePhone = (v) => String(v || '').replace(/[\s-]/g, '').replace(/^(\+91|0)/, '');

const whole = (v) => (/^\d+$/.test(String(v).trim()) ? Number(v) : NaN);

export function validateBooking(form, room, today) {
  const e = {};

  const name = (form.guest || '').trim();
  if (name.length < 2) e.guest = 'Enter your full name';
  else if (!/^[\p{L} .'-]+$/u.test(name)) e.guest = 'Name can only contain letters';

  const phone = normalizePhone(form.phone);
  if (!/^[6-9]\d{9}$/.test(phone)) e.phone = 'Enter a valid 10-digit mobile number';

  if (!form.inD) e.inD = 'Pick an arrival date';
  else if (form.inD < today) e.inD = 'Arrival cannot be in the past';

  const nights = whole(form.nights);
  if (!(nights >= 1)) e.nights = 'At least 1 night';
  else if (nights > MAX_NIGHTS) e.nights = `Up to ${MAX_NIGHTS} nights online — call the front desk for longer stays`;

  const rooms = whole(form.rooms);
  if (!(rooms >= 1)) e.rooms = 'At least 1 room';
  else if (rooms > MAX_ROOMS) e.rooms = BULK_MESSAGE;

  const pax = whole(form.pax);
  const cap = (room?.sleeps || 2) * (rooms >= 1 && rooms <= MAX_ROOMS ? rooms : 1);
  if (!(pax >= 1)) e.pax = 'At least 1 guest';
  else if (pax > cap) e.pax = `This room sleeps ${room?.sleeps || 2} — max ${cap} guest${cap > 1 ? 's' : ''} for ${rooms >= 1 ? rooms : 1} room${rooms > 1 ? 's' : ''}`;

  return e;
}
