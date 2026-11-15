import { HOTEL } from '../data/seed';
import { activeRooms } from '../lib/selectors';
import { useGuest } from '../store/GuestContext';

const SUBTITLES = {
  home: 'Your bookings',
  rooms: 'Rooms & tariff',
  menu: 'In-room dining',
  orders: 'Orders & requests',
  help: 'Hotel & help'
};

export default function TopBar() {
  const { db, auth, tab, setTab, actions } = useGuest();
  const rooms = activeRooms(db);

  return (
    <header className="hd">
      <div className="dot" aria-hidden="true">&#10052;</div>
      <div style={{ flex: 1 }}>
        <h1>{HOTEL.name}</h1>
        <p>{auth === 'visitor' ? 'Explore rooms' : SUBTITLES[tab]}</p>
      </div>
      {auth === 'visitor' && (
        <button className="btn sm" onClick={actions.signOut}>Sign in</button>
      )}
      {auth === 'in' && rooms.length > 0 && (
        <button className="btn sm" onClick={() => setTab('home')}>
          {rooms.length === 1 ? `Room ${rooms[0].number}` : `${rooms.length} rooms`}
        </button>
      )}
    </header>
  );
}
