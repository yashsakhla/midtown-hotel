import { money } from './format';
import { FOOD_GST } from '../store/GuestContext';

/** What the guest owes right now. */
export const folioTotal = (db) => (db.stay ? db.stay.balance : 0);

export const cartSubtotal = (db) => db.cart.reduce((s, c) => s + c.p * c.q, 0);
export const cartTax = (db) => Math.round(cartSubtotal(db) * FOOD_GST);
export const cartTotal = (db) => cartSubtotal(db) + cartTax(db);
export const cartCount = (db) => db.cart.reduce((s, c) => s + c.q, 0);

/** Nights left, counting from the working date. */
export function nightsLeft(db) {
  if (!db.stay) return 0;
  const out = new Date(db.stay.checkOut);
  const today = new Date(db.date);
  return Math.max(0, Math.round((out - today) / 86400000));
}

export const ORDER_STEPS = ['Placed', 'Preparing', 'On the way', 'Served'];

/** How far along an order is, for the little tracker. */
export const orderStep = (status) => {
  const i = ORDER_STEPS.indexOf(status);
  return i === -1 ? 0 : i;
};

/** ₹ with the minus sign outside, for credits on the bill. */
export const signedMoney = (n) => (n < 0 ? `−${money(-n)}` : money(n));
