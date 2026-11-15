/** Booking form rules. Shared by the form (inline errors) and the store (last line of defence). */

export const MAX_ROOMS = 10;
export const MAX_NIGHTS = 30;
export const BULK_MESSAGE = 'For bulk booking, please contact the front desk.';

/** 10-digit mobile number without +91 / 0 prefix or spaces. */
export const normalizePhone = (v) => String(v || '').replace(/[\s-]/g, '').replace(/^(\+91|0)/, '');

const whole = (v) => (/^\d+$/.test(String(v).trim()) ? Number(v) : NaN);

/**
 * form.lines = [{ type, guests }], one per room. Each room's guests are capped at that
 * room type's `sleeps`. Returns { field: message }, with `lines` as an array of messages.
 */
export function validateBooking(form, roomTypes, today) {
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

  const lines = form.lines || [];
  if (!lines.length) e.rooms = 'Add at least one room';
  else if (lines.length > MAX_ROOMS) e.rooms = BULK_MESSAGE;

  const lineErrors = lines.map((l) => {
    const type = roomTypes.find((r) => r.type === l.type);
    if (!type) return 'Pick a room type';
    const g = whole(l.guests);
    if (!(g >= 1)) return 'At least 1 guest';
    if (g > (type.sleeps || 2)) return `${type.type} sleeps ${type.sleeps || 2} — max ${type.sleeps || 2} guests per room`;
    return '';
  });
  if (lineErrors.some(Boolean)) e.lines = lineErrors;

  return e;
}
