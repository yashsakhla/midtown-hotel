/**
 * Occupancy pricing, per room per night (GST extra):
 *   1 guest  -> singleRate
 *   2 guests -> doubleRate
 *   3+       -> doubleRate + (guests - 2) x additionalGuestRate
 * The backend is the source of truth; this only drives the on-screen estimate.
 */
export function roomRate(type, guests) {
  if (!type) return 0;
  const g = Math.max(1, Math.floor(Number(guests)) || 1);
  const single = type.singleRate || type.tariff || 0;
  const dbl = type.doubleRate || single;
  const extra = type.additionalGuestRate || 0;
  if (g === 1) return single;
  if (g === 2) return dbl;
  return dbl + (g - 2) * extra;
}

/** Total for a list of room lines [{ type, guests }] over `nights`. */
export function bookingTotal(lines, roomTypes, nights) {
  const n = Math.max(0, Number(nights) || 0);
  return lines.reduce((sum, l) => sum + roomRate(roomTypes.find((r) => r.type === l.type), l.guests) * n, 0);
}
