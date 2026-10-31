import { ROOM_IMG } from '../assets';
import Pill from '../components/Pill';
import { money } from '../lib/format';
import { useGuest } from '../store/GuestContext';

export default function RoomsScreen() {
  const { db, openSheet } = useGuest();

  return (
    <>
      <p style={{ fontSize: 13, color: 'var(--body)', margin: '0 0 14px' }}>
        Our rooms, all with air conditioning, hot water and free Wi-Fi.
        Pick one and we will hold it for you.
      </p>

      {db.roomTypes.map((r) => (
        <article className="gcard" key={r.id}>
          <img src={r.img || ROOM_IMG[r.type]} alt={`${r.type} room`} />
          <div className="gb">
            <h4>{r.type}</h4>
            <p className="gd">{r.blurb}</p>

            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
              <Pill tone="n">{r.beds}</Pill>
              <Pill tone="n">{r.size}</Pill>
              <Pill tone="n">Sleeps {r.sleeps}</Pill>
            </div>

            <ul style={{ margin: '10px 0 0', padding: 0, listStyle: 'none', fontSize: 12, color: 'var(--body)' }}>
              {r.perks.map((p) => (
                <li key={p} style={{ display: 'flex', gap: 7, marginTop: 4 }}>
                  <span style={{ color: 'var(--gold)' }}>•</span>{p}
                </li>
              ))}
            </ul>

            <div className="gfoot">
              <div className="num gp">
                {money(r.tariff)} <small>/ night + GST</small>
              </div>
              <button
                className="btn p sm"
                style={{ marginLeft: 'auto', width: 'auto', padding: '9px 16px' }}
                onClick={() => openSheet('book', { type: r.type })}
              >
                Book this room
              </button>
            </div>
          </div>
        </article>
      ))}

      <p style={{ fontSize: 11.5, color: 'var(--muted)', textAlign: 'center' }}>
        Check-in from 12:00 noon · Check-out by 11:00 am
      </p>
    </>
  );
}
