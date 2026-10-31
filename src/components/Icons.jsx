/** Inline SVG icons for the guest app. */

const stroke = { strokeLinecap: 'round', strokeLinejoin: 'round' };

export const TAB_ICONS = {
  stay: 'M3 11l9-7 9 7v9a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1z',
  rooms: 'M4 21V7l8-4 8 4v14M9 21v-5h6v5',
  menu: 'M7 3v8a3 3 0 006 0V3M10 11v10M17 3c-1.5 2-2 4-2 6h4c0-2-.5-4-2-6zM17 9v12',
  orders: 'M6 3h9l5 5v13H6zM15 3v5h5M9 13h7M9 17h5',
  help: 'M4 6h16M4 12h16M4 18h16'
};

export function TabIcon({ name }) {
  return (
    <svg viewBox="0 0 24 24" {...stroke} aria-hidden="true">
      <path d={TAB_ICONS[name]} />
    </svg>
  );
}

const QUICK_PATHS = {
  food: 'M7 3v8a3 3 0 006 0V3M10 11v10M17 3c-1.5 2-2 4-2 6h4c0-2-.5-4-2-6zM17 9v12',
  housekeeping: 'M14 3l-2 2 5 5 2-2-5-5zM11 6L4 13v5h5l7-7',
  laundry: 'M5 3h14v18H5zM8 3v3h8V3M12 18a4 4 0 100-8 4 4 0 000 8z',
  bill: 'M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6',
  wifi: 'M5 12.5a10 10 0 0114 0M8 16a6 6 0 018 0M12 20h.01',
  call: 'M4 5c0 8.3 6.7 15 15 15v-3.5l-4-1.5-2 2a12 12 0 01-6-6l2-2L7.5 5z',
  checkout: 'M15 4h3a1 1 0 011 1v14a1 1 0 01-1 1h-3M10 16l4-4-4-4M14 12H3',
  taxi: 'M5 17h14M6 17v2M18 17v2M4 13l1.5-4.5A2 2 0 017.4 7h9.2a2 2 0 011.9 1.5L20 13v4H4zM8 7V5h8v2'
};

export function QuickIcon({ name }) {
  return (
    <svg viewBox="0 0 24 24" {...stroke} aria-hidden="true">
      <path d={QUICK_PATHS[name]} />
    </svg>
  );
}

export function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" {...stroke} aria-hidden="true">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  );
}
