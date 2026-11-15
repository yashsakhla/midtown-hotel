import Card from '../components/Card';
import ListRow from '../components/ListRow';
import Pill from '../components/Pill';
import { money } from '../lib/format';
import { ORDER_STEPS, orderStep } from '../lib/selectors';
import { useGuest } from '../store/GuestContext';

export default function OrdersScreen() {
  const { setTab, db } = useGuest();

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
                    {o.kind}{o.room ? ` · Room ${o.room}` : ''} · {o.time}
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
            sub={`${r.rooms.length ? `Room ${r.rooms.join(', ')} · ` : ''}${r.note ? `${r.note} · ${r.time}` : `Sent at ${r.time}`}`}
            right={<Pill tone={r.status === 'Done' ? 'g' : 'o'}>{r.status}</Pill>}
          />
        )) : (
          <ListRow><span style={{ color: 'var(--muted)' }}>No requests raised.</span></ListRow>
        )}
      </Card>
    </>
  );
}
