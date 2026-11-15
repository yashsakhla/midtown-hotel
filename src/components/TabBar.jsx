import { hasActiveStay } from '../lib/selectors';
import { useGuest } from '../store/GuestContext';
import { TabIcon } from './Icons';

const TABS = [
  ['home', 'Home'],
  ['rooms', 'Rooms'],
  ['menu', 'Menu'],
  ['orders', 'Orders'],
  ['help', 'Help']
];

export default function TabBar() {
  const { db, tab, setTab } = useGuest();
  // Food and orders only make sense while the customer is staying.
  const tabs = hasActiveStay(db) ? TABS : TABS.filter(([id]) => id !== 'menu' && id !== 'orders');

  return (
    <nav className="tb" aria-label="Main sections">
      {tabs.map(([id, label]) => (
        <button
          key={id}
          className={tab === id ? 'on' : ''}
          aria-current={tab === id ? 'page' : undefined}
          onClick={() => setTab(id)}
        >
          <TabIcon name={id} />
          {label}
        </button>
      ))}
    </nav>
  );
}
