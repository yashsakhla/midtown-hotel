import { useState } from 'react';
import Field from '../components/Field';
import { HOTEL } from '../data/seed';
import { useGuest } from '../store/GuestContext';

/** Sign in with just a mobile number (OTP). Rooms and bookings are found from the number. */
export default function LoginScreen() {
  const { busy, actions } = useGuest();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [sent, setSent] = useState(false);

  const sendOtp = async () => { if (await actions.requestOtp(phone)) setSent(true); };
  const submit = (e) => {
    e.preventDefault();
    if (busy) return;
    if (!sent) { if (phone.trim()) sendOtp(); }
    else if (otp.trim().length >= 4) actions.verifyOtp(phone, otp.trim());
  };

  return (
    <main className="scr login">
      <div className="login-box">
        <div style={{ textAlign: 'center', marginBottom: 22 }}>
          <div style={{ color: 'var(--gold)', fontSize: 30 }} aria-hidden="true">&#10052;</div>
          <h2 style={{ fontSize: 24 }}>{HOTEL.name}</h2>
          <p style={{ color: 'var(--muted)', fontSize: 13, margin: '6px 0 0' }}>Guest app</p>
        </div>

        <form className="card" onSubmit={submit}><div className="b">
          <h3 style={{ marginBottom: 4, fontSize: 15 }}>Sign in with your mobile number</h3>
          <p style={{ color: 'var(--muted)', fontSize: 12, margin: '0 0 12px' }}>
            See your bookings, your room and your bills.
          </p>
          <Field label="Mobile number" type="tel" inputMode="numeric" maxLength={14} autoFocus
            placeholder="10-digit mobile number" value={phone} disabled={sent}
            onChange={(e) => setPhone(e.target.value)} />
          {sent && (
            <Field label={`OTP sent to ${phone}`} inputMode="numeric" maxLength={6} placeholder="6-digit code"
              autoFocus value={otp} onChange={(e) => setOtp(e.target.value)} />
          )}

          {!sent ? (
            <button type="submit" className="btn p" disabled={busy || !phone.trim()}>
              {busy ? 'Sending…' : 'Send OTP'}
            </button>
          ) : (
            <>
              <button type="submit" className="btn p" disabled={busy || otp.trim().length < 4}>
                {busy ? 'Checking…' : 'Verify and continue'}
              </button>
              <div style={{ height: 8 }} />
              <button type="button" className="btn" disabled={busy} onClick={() => { setSent(false); setOtp(''); }}>
                Change number
              </button>
            </>
          )}
        </div></form>

        <button className="btn" disabled={busy} onClick={actions.browseAsVisitor}>
          Just browsing — see rooms and book
        </button>
      </div>
    </main>
  );
}
