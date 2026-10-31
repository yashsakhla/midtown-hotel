import { useGuest } from '../store/GuestContext';
import { TabIcon } from './Icons';

const TABS = [
  ['stay', 'My stay'],
  ['rooms', 'Rooms'],
  ['menu', 'Menu'],
  ['orders', 'Orders'],
  ['help', 'Help']
];

export default function TabBar() {
  const { tab, setTab } = useGuest();

  return (
    <nav className="tb" aria-label="Main sections">
      {TABS.map(([id, label]) => (
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
