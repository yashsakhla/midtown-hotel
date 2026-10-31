import { EXTERIOR } from '../assets';
import Card from '../components/Card';
import ListRow from '../components/ListRow';
import Pill from '../components/Pill';
import { HOTEL, SERVICES } from '../data/seed';
import { useGuest } from '../store/GuestContext';

export default function HelpScreen() {
  const { db, openSheet, actions } = useGuest();

  return (
    <>
      <article className="gcard">
        <img src={EXTERIOR[0]} alt="The Midtown Hotel" />
        <div className="gb">
          <h4>{HOTEL.name}</h4>
          <p className="gd">{HOTEL.address}</p>
          <div className="gfoot">
            <a className="btn p sm" style={{ width: 'auto', padding: '9px 16px', textDecoration: 'none' }}
              href={`tel:${HOTEL.phone.replace(/\s/g, '')}`}>
              Call {HOTEL.phone}
            </a>
            <a className="btn sm" style={{ width: 'auto', padding: '9px 16px', textDecoration: 'none' }}
              href={`https://maps.google.com/?q=${encodeURIComponent(HOTEL.address)}`}
              target="_blank" rel="noreferrer">
              Directions
            </a>
          </div>
        </div>
      </article>

      <Card title="Wi-Fi" body>
        <table>
          <tbody>
            <tr><td>Network</td><td className="rt num">{HOTEL.wifi.network}</td></tr>
            <tr><td>Password</td><td className="rt num">{HOTEL.wifi.password}</td></tr>
          </tbody>
        </table>
      </Card>

      {db.stay && <Card title="Ask the front desk">
        {SERVICES.map((s) => (
          <ListRow
            key={s.key}
            title={s.label}
            sub={s.sub}
            onClick={() => openSheet(s.key === 'checkout' ? 'checkOut' : 'service', { service: s })}
            right={<span style={{ color: 'var(--muted)' }}>›</span>}
          />
        ))}
      </Card>}

      <Card title="Hotel timings" body>
        <table>
          <tbody>
            <tr><td>Check-in from</td><td className="rt num">{HOTEL.checkInTime}</td></tr>
            <tr><td>Check-out by</td><td className="rt num">{HOTEL.checkOutTime}</td></tr>
            <tr><td>Kitchen</td><td className="rt num">7:00 am – 11:00 pm</td></tr>
            <tr><td>Front desk</td><td className="rt num">24 hours</td></tr>
          </tbody>
        </table>
      </Card>

      {db.stay && <Card title="How was your stay?">
        {db.feedback ? (
          <ListRow
            title={`You rated us ${db.feedback.rating} out of 5`}
            sub={db.feedback.text || `Sent at ${db.feedback.time}`}
            right={<Pill tone="g">Thank you</Pill>}
          />
        ) : (
          <ListRow>
            <span style={{ color: 'var(--muted)' }}>Tell the manager what we got right or wrong.</span>
            <button className="btn sm" style={{ marginLeft: 'auto', width: 'auto', padding: '8px 14px' }}
              onClick={() => openSheet('feedback')}>
              Rate us
            </button>
          </ListRow>
        )}
      </Card>}

      <button className="btn" onClick={actions.signOut}>
        {db.stay ? 'Sign out' : 'Back to sign-in'}
      </button>

      <p style={{ fontSize: 11, color: 'var(--muted)', textAlign: 'center', margin: '14px 0 0' }}>
        {HOTEL.name} · Guest app<br />
        Built by MACROPAGE — MR Tech Solutions Pvt. Ltd.
      </p>
    </>
  );
}
