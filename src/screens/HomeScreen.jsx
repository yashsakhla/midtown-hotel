import { HERO } from '../assets';
import Card from '../components/Card';
import { QuickIcon } from '../components/Icons';
import ListRow from '../components/ListRow';
import Pill from '../components/Pill';
import { SERVICES } from '../data/seed';
import { money } from '../lib/format';
import { STATUS_LABEL } from '../lib/mappers';
import {
  activeBookings, activeRooms, folioTotal, nightsLeft, pastBookings, upcomingBookings
} from '../lib/selectors';
import { useGuest } from '../store/GuestContext';

const QUICK = [
  ['food', 'Order food', 'menu'],
  ['housekeeping', 'Housekeeping', 'service:housekeeping'],
  ['bill', 'My bills', 'bills'],
  ['call', 'Front desk', 'service:call']
];

const tone = (status) =>
  status === 'CONFIRMED' || status === 'CHECKED_OUT' ? 'g' : status === 'CANCELLED' ? 'r' : 'o';

const roomList = (b) => b.rooms.map((r) => r.number).filter(Boolean).join(', ');

function BookingRow({ b, onClick }) {
  const n = b.rooms.length || 1;
  return (
    <ListRow onClick={onClick}>
      <div className="t">
        <b>{b.ref || 'Booking'} · {n} room{n > 1 ? 's' : ''}</b>
        <span>
          {b.arrival} → {b.departure}
          {roomList(b) ? ` · Room ${roomList(b)}` : ''}
        </span>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div className="num" style={{ color: 'var(--ink)' }}>{money(b.amount)}</div>
        <Pill tone={tone(b.status)}>{STATUS_LABEL[b.status]}</Pill>
      </div>
    </ListRow>
  );
}

/** Customer home: current stay (if any), a Book Room button, upcoming and past bookings. */
export default function HomeScreen() {
  const { db, setTab, openSheet } = useGuest();
  const staying = activeBookings(db);
  const rooms = activeRooms(db);
  const upcoming = upcomingBookings(db);
  const past = pastBookings(db);
  const live = rooms.length > 0;
  const openOrders = db.orders.filter((o) => o.status !== 'Served');
  const openRequests = db.requests.filter((r) => r.status !== 'Done');

  const openBills = () =>
    (staying.length === 1 ? openSheet('folio', { bookingId: staying[0].id }) : openSheet('bills'));

  const quickAction = (target) => {
    if (target === 'menu') return setTab('menu');
    if (target === 'bills') return openBills();
    const key = target.split(':')[1];
    return openSheet('service', { service: SERVICES.find((s) => s.key === key) });
  };

  return (
    <>
      {db.customer?.name && (
        <p style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--body)' }}>
          Hello, <b style={{ color: 'var(--ink)' }}>{db.customer.name}</b>
        </p>
      )}

      {live ? staying.map((b) => (
        <div className="staycard" key={b.id}>
          <div className="sl">You are staying in</div>
          <h2>{b.rooms.length > 1 ? `${b.rooms.length} rooms` : `Room ${roomList(b)}`}</h2>
          <div className="chipset">
            {b.rooms.map((r) => (
              <span key={r.stayId}>Room {r.number}{r.type ? ` · ${r.type}` : ''}</span>
            ))}
          </div>
          <div className="srow">
            <div><span>Check-in</span><b>{b.arrival}</b></div>
            <div><span>Check-out</span><b>{b.departure}</b></div>
            <div><span>Nights left</span><b>{nightsLeft(db, b)}</b></div>
          </div>
        </div>
      )) : (
        <div className="hero">
          <img src={HERO} alt="The Midtown Hotel" />
          <div className="ov">
            <div style={{ color: 'var(--gold)', fontSize: 12, fontWeight: 600 }}>Welcome to</div>
            <h2>The Midtown Hotel</h2>
            <p>{upcoming.length ? 'Your booking is on its way' : 'Book a room to begin your stay'}</p>
          </div>
        </div>
      )}

      <button className="btn p" onClick={() => setTab('rooms')}>
        {live ? 'Book another room' : 'Book a room'}
      </button>

      {live && <div className="quick">
        {QUICK.map(([icon, label, target]) => (
          <button key={label} onClick={() => quickAction(target)}>
            <QuickIcon name={icon} />
            {label}
          </button>
        ))}
      </div>}

      {live && (
        <Card title="Your bill so far" action={<button className="btn sm" onClick={openBills}>Details</button>} body>
          <table>
            <tbody>
              {staying.map((b) => (
                <tr key={b.id}>
                  <td>{b.ref || 'Booking'} · Room {roomList(b)}</td>
                  <td className="rt num">{money(b.balance)}</td>
                </tr>
              ))}
              <tr>
                <td><b>Balance due</b></td>
                <td className="rt num" style={{ fontSize: 17, color: 'var(--ink)' }}>{money(folioTotal(db))}</td>
              </tr>
            </tbody>
          </table>
          <p style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 8 }}>
            Payable at the front desk on check-out — cash, UPI, card or bank transfer.
          </p>
        </Card>
      )}

      {live && (
        <Card title="Running now">
          {openOrders.length || openRequests.length ? (
            <>
              {openOrders.map((o) => (
                <ListRow
                  key={o.id}
                  title={o.items.map((i) => `${i.q}× ${i.n}`).join(', ')}
                  sub={`${o.kind}${o.room ? ` · Room ${o.room}` : ''} · ${o.time}`}
                  right={<Pill tone="o">{o.status}</Pill>}
                  onClick={() => setTab('orders')}
                />
              ))}
              {openRequests.map((r) => (
                <ListRow
                  key={r.id}
                  title={r.label}
                  sub={`${r.rooms.length ? `Room ${r.rooms.join(', ')} · ` : ''}${r.note || `Sent at ${r.time}`}`}
                  right={<Pill tone="b">{r.status}</Pill>}
                  onClick={() => setTab('orders')}
                />
              ))}
            </>
          ) : (
            <ListRow><span style={{ color: 'var(--muted)' }}>Nothing pending. Enjoy your stay.</span></ListRow>
          )}
        </Card>
      )}

      {live && (
        <Card title="Need something?">
          {SERVICES.filter((s) => s.key !== 'checkout').map((s) => (
            <ListRow
              key={s.key}
              title={s.label}
              sub={s.sub}
              onClick={() => openSheet('service', { service: s })}
              right={<span style={{ color: 'var(--muted)' }}>›</span>}
            />
          ))}
        </Card>
      )}

      {live && <button className="btn" onClick={() => openSheet('checkOut')}>Request check-out</button>}

      {upcoming.length > 0 && (
        <Card title="Upcoming bookings">
          {upcoming.map((b) => <BookingRow key={b.id} b={b} />)}
        </Card>
      )}

      <Card title="Past bookings">
        {past.length ? past.map((b) => (
          <BookingRow key={b.id} b={b} onClick={() => openSheet('folio', { bookingId: b.id })} />
        )) : (
          <ListRow><span style={{ color: 'var(--muted)' }}>No past bookings yet.</span></ListRow>
        )}
      </Card>
    </>
  );
}
