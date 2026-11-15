import { money } from './format';
import { FOOD_GST } from '../store/GuestContext';

/** Bookings the guest is staying in right now. */
export const activeBookings = (db) => db.bookings.filter((b) => b.status === 'CHECKED_IN');
/** Requested / confirmed, not arrived yet. */
export const upcomingBookings = (db) => db.bookings.filter((b) => b.status === 'REQUESTED' || b.status === 'CONFIRMED');
/** Checked out or cancelled — the "past bookings" list. */
export const pastBookings = (db) => db.bookings.filter((b) => b.status === 'CHECKED_OUT' || b.status === 'CANCELLED');

/** Every room the guest currently occupies, across all active bookings. */
export const activeRooms = (db) =>
  activeBookings(db).flatMap((b) =>
    b.rooms
      .filter((r) => r.status === 'CHECKED_IN')
      .map((r) => ({ ...r, bookingId: b.id, ref: b.ref, departure: b.departure }))
  );

export const hasActiveStay = (db) => activeRooms(db).length > 0;

/** Outstanding balance across all active bookings. */
export const folioTotal = (db) => activeBookings(db).reduce((t, b) => t + b.balance, 0);

export const cartSubtotal = (db) => db.cart.reduce((s, c) => s + c.p * c.q, 0);
export const cartTax = (db) => Math.round(cartSubtotal(db) * FOOD_GST);
export const cartTotal = (db) => cartSubtotal(db) + cartTax(db);
export const cartCount = (db) => db.cart.reduce((s, c) => s + c.q, 0);

/** Nights left in a booking, counting from the working date. */
export function nightsLeft(db, booking) {
  if (!booking?.departure) return 0;
  return Math.max(0, Math.round((new Date(booking.departure) - new Date(db.date)) / 86400000));
}

export const ORDER_STEPS = ['Placed', 'Preparing', 'On the way', 'Served'];

/** How far along an order is, for the little tracker. */
export const orderStep = (status) => {
  const i = ORDER_STEPS.indexOf(status);
  return i === -1 ? 0 : i;
};

/** ₹ with the minus sign outside, for credits on the bill. */
export const signedMoney = (n) => (n < 0 ? `−${money(-n)}` : money(n));
