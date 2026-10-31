import { HERO } from '../assets';
import Card from '../components/Card';
import { QuickIcon } from '../components/Icons';
import ListRow from '../components/ListRow';
import Pill from '../components/Pill';
import { SERVICES } from '../data/seed';
import { money } from '../lib/format';
import { folioTotal, nightsLeft, signedMoney } from '../lib/selectors';
import { useGuest } from '../store/GuestContext';

const QUICK = [
  ['food', 'Order food', 'menu'],
  ['housekeeping', 'Housekeeping', 'service:housekeeping'],
  ['bill', 'My bill', 'folio'],
  ['call', 'Front desk', 'service:call']
];

export default function StayScreen() {
  const { db, setTab, openSheet } = useGuest();
  const stay = db.stay;
  const due = folioTotal(db);

  const quickAction = (target) => {
    if (target === 'menu') return setTab('menu');
    if (target === 'folio') return openSheet('folio');
    const key = target.split(':')[1];
    openSheet('service', { service: SERVICES.find((s) => s.key === key) });
  };

  return (
    <>
      {stay ? (
        <div className="staycard">
          <div className="sl">You are staying in</div>
          <h2>Room {stay.room}</h2>
          <p style={{ color: '#C8C0AD', fontSize: 12.5, margin: '4px 0 0' }}>
            {stay.type} · {stay.guest}
          </p>
          <div className="srow">
            <div><span>Check-in</span><b>{stay.checkIn}</b></div>
            <div><span>Check-out</span><b>{stay.checkOut}</b></div>
            <div><span>Nights left</span><b>{nightsLeft(db)}</b></div>
          </div>
        </div>
      ) : (
        <div className="hero">
          <img src={HERO} alt="The Midtown Hotel" />
          <div className="ov">
            <div style={{ color: 'var(--gold)', fontSize: 12, fontWeight: 600 }}>Welcome to</div>
            <h2>The Midtown Hotel</h2>
            <p>Book a room to begin your stay</p>
          </div>
        </div>
      )}

      {stay && <div className="quick">
        {QUICK.map(([icon, label, target]) => (
          <button key={label} onClick={() => quickAction(target)}>
            <QuickIcon name={icon} />
            {label}
          </button>
        ))}
      </div>}

      {stay && <Card
        title="Your bill so far"
        action={<button className="btn sm" onClick={() => openSheet('folio')}>Details</button>}
        body
      >
        <table>
          <tbody>
            {stay && stay.folio.slice(0, 3).map((f) => (
              <tr key={f.id}>
                <td>{f.head}</td>
                <td className="rt num" style={{ color: f.amount < 0 ? 'var(--green)' : 'var(--ink)' }}>
                  {signedMoney(f.amount)}
                </td>
              </tr>
            ))}
            <tr>
              <td><b>Balance due</b></td>
              <td className="rt num" style={{ fontSize: 17, color: 'var(--ink)' }}>{money(due)}</td>
            </tr>
          </tbody>
        </table>
        <p style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 8 }}>
          Payable at the front desk on check-out — cash, UPI, card or bank transfer.
        </p>
      </Card>}

      {stay && <Card title="Running now">
        {db.orders.filter((o) => o.status !== 'Served').length || db.requests.filter((r) => r.status !== 'Done').length ? (
          <>
            {db.orders.filter((o) => o.status !== 'Served').map((o) => (
              <ListRow
                key={o.id}
                title={o.items.map((i) => `${i.q}× ${i.n}`).join(', ')}
                sub={`${o.kind} · ${o.time}`}
                right={<Pill tone="o">{o.status}</Pill>}
                onClick={() => setTab('orders')}
              />
            ))}
            {db.requests.filter((r) => r.status !== 'Done').map((r) => (
              <ListRow
                key={r.id}
                title={r.label}
                sub={r.note || `Sent at ${r.time}`}
                right={<Pill tone="b">{r.status}</Pill>}
                onClick={() => setTab('orders')}
              />
            ))}
          </>
        ) : (
          <ListRow><span style={{ color: 'var(--muted)' }}>Nothing pending. Enjoy your stay.</span></ListRow>
        )}
      </Card>}

      {stay && <Card title="Need something?">
        {SERVICES.filter((s) => s.key !== 'checkout').map((s) => (
          <ListRow
            key={s.key}
            title={s.label}
            sub={s.sub}
            onClick={() => openSheet('service', { service: s })}
            right={<span style={{ color: 'var(--muted)' }}>›</span>}
          />
        ))}
      </Card>}

      {stay && (
        <button className="btn" onClick={() => openSheet('checkOut')}>
          Request check-out
        </button>
      )}
    </>
  );
}
