/** Formatting and small value helpers shared across the app. */

export const today = () => new Date().toISOString().slice(0, 10);

/** ₹ with Indian digit grouping, no decimals. */
export const money = (n) =>
  '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });

/** Add n days to an ISO date string and return an ISO date string. */
export const addDays = (date, n) => {
  const d = new Date(date);
  d.setDate(d.getDate() + (Number(n) || 0));
  return d.toISOString().slice(0, 10);
};

/** Short, readable id with a type prefix — E for entry, C for cash line, etc. */
export const uid = (prefix) => prefix + Math.random().toString(36).slice(2, 7).toUpperCase();

/** Current clock time as HH:MM. */
export const now = () => new Date().toTimeString().slice(0, 5);

export const num = (v, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};
