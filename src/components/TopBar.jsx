import { HOTEL } from '../data/seed';
import { useGuest } from '../store/GuestContext';

const SUBTITLES = {
  stay: 'Your stay',
  rooms: 'Rooms & tariff',
  menu: 'In-room dining',
  orders: 'Orders & requests',
  help: 'Hotel & help'
};

export default function TopBar() {
  const { db, tab, openSheet } = useGuest();

  return (
    <header className="hd">
      <div className="dot" aria-hidden="true">&#10052;</div>
      <div style={{ flex: 1 }}>
        <h1>{HOTEL.name}</h1>
        <p>{SUBTITLES[tab]}</p>
      </div>
      {db.stay && (
        <button className="btn sm" onClick={() => openSheet('folio')}>
          Room {db.stay.room}
        </button>
      )}
    </header>
  );
}
