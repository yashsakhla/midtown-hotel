import { useState } from 'react';
import Field from '../components/Field';
import { HOTEL } from '../data/seed';
import { useGuest } from '../store/GuestContext';

/** Sign in with room number + phone (OTP), or just browse rooms and menu. */
export default function LoginScreen() {
  const { busy, actions } = useGuest();
  const [room, setRoom] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [sent, setSent] = useState(false);

  const sendOtp = async () => {
    if (await actions.requestOtp(room.trim(), phone.trim())) setSent(true);
  };

  return (
    <main className="scr" style={{ display: 'block' }}>
      <div style={{ maxWidth: 420, margin: '0 auto', paddingTop: 24 }}>
        <div style={{ textAlign: 'center', marginBottom: 22 }}>
          <div style={{ color: 'var(--gold)', fontSize: 30 }} aria-hidden="true">&#10052;</div>
          <h2 style={{ fontSize: 24 }}>{HOTEL.name}</h2>
          <p style={{ color: 'var(--muted)', fontSize: 13, margin: '6px 0 0' }}>Guest app</p>
        </div>

        <div className="card"><div className="b">
          <h3 style={{ marginBottom: 12, fontSize: 15 }}>I am staying here</h3>
          <Field label="Room number" inputMode="numeric" placeholder="204" value={room}
            disabled={sent} onChange={(e) => setRoom(e.target.value)} />
          <Field label="Phone on the booking" type="tel" placeholder="Mobile number" value={phone}
            disabled={sent} onChange={(e) => setPhone(e.target.value)} />
          {sent && (
            <Field label="OTP sent by SMS" inputMode="numeric" maxLength={6} placeholder="6-digit code"
              value={otp} onChange={(e) => setOtp(e.target.value)} />
          )}

          {!sent ? (
            <button className="btn p" disabled={busy || !room.trim() || !phone.trim()} onClick={sendOtp}>
              {busy ? 'Sending…' : 'Send OTP'}
            </button>
          ) : (
            <>
              <button className="btn p" disabled={busy || otp.length < 4}
                onClick={() => actions.verifyOtp(room.trim(), phone.trim(), otp.trim())}>
                {busy ? 'Checking…' : 'Verify and continue'}
              </button>
              <div style={{ height: 8 }} />
              <button className="btn" disabled={busy} onClick={() => { setSent(false); setOtp(''); }}>
                Change room or phone
              </button>
            </>
          )}
        </div></div>

        <button className="btn" disabled={busy} onClick={actions.browseAsVisitor}>
          Just browsing — see rooms and book
        </button>
      </div>
    </main>
  );
}
