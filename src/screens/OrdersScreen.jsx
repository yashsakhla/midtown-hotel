import Card from '../components/Card';
import ListRow from '../components/ListRow';
import Pill from '../components/Pill';
import { money } from '../lib/format';
import { ORDER_STEPS, orderStep } from '../lib/selectors';
import { useGuest } from '../store/GuestContext';

export default function OrdersScreen() {
  const { db, setTab } = useGuest();

  return (
    <>
      <Card title="Food orders">
        {db.orders.length ? db.orders.map((o) => (
          <ListRow key={o.id}>
            <div style={{ width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <div className="t" style={{ flex: 1 }}>
                  <b>{o.items.map((i) => `${i.q}× ${i.n}`).join(', ')}</b>
                  <span>
                    {o.kind} · {o.time}
                    {o.billTo === 'room' ? ' · charged to room' : ''}
                    {o.note ? ` · “${o.note}”` : ''}
                  </span>
                </div>
                <span className="num" style={{ color: 'var(--ink)' }}>{money(o.total)}</span>
              </div>

              <div className="track">
                {ORDER_STEPS.map((s, i) => (
                  <div key={s} className={i <= orderStep(o.status) ? 'done' : ''}>{s}</div>
                ))}
              </div>
            </div>
          </ListRow>
        )) : (
          <ListRow>
            <span style={{ color: 'var(--muted)' }}>No orders yet.</span>
            <button className="btn sm" style={{ marginLeft: 'auto', width: 'auto', padding: '8px 14px' }}
              onClick={() => setTab('menu')}>
              See the menu
            </button>
          </ListRow>
        )}
      </Card>

      <Card title="Service requests">
        {db.requests.length ? db.requests.map((r) => (
          <ListRow
            key={r.id}
            title={r.label}
            sub={r.note ? `${r.note} · ${r.time}` : `Sent at ${r.time}`}
            right={<Pill tone={r.status === 'Done' ? 'g' : 'o'}>{r.status}</Pill>}
          />
        )) : (
          <ListRow><span style={{ color: 'var(--muted)' }}>No requests raised.</span></ListRow>
        )}
      </Card>

      <Card title="Booking requests">
        {db.bookings.length ? db.bookings.map((b) => (
          <ListRow key={b.id}>
            <div className="t">
              <b>{b.type} × {b.rooms}</b>
              <span>{b.ref} · {b.inD} → {b.outD} · {b.pax} guests</span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="num" style={{ color: 'var(--ink)' }}>{money(b.amount)}</div>
              <Pill tone={b.status === 'Confirmed' ? 'g' : 'o'}>{b.status}</Pill>
            </div>
          </ListRow>
        )) : (
          <ListRow>
            <span style={{ color: 'var(--muted)' }}>No booking requests.</span>
            <button className="btn sm" style={{ marginLeft: 'auto', width: 'auto', padding: '8px 14px' }}
              onClick={() => setTab('rooms')}>
              Book a room
            </button>
          </ListRow>
        )}
      </Card>
    </>
  );
}
