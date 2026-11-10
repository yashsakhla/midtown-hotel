import { useState } from 'react';
import { foodImg, ROOM_IMG } from '../assets';
import Field, { Row2 } from '../components/Field';
import ListRow from '../components/ListRow';
import Pill from '../components/Pill';
import Sheet from '../components/Sheet';
import Stepper from '../components/Stepper';
import { HOTEL } from '../data/seed';
import { addDays, money, today as todayISO } from '../lib/format';
import { MAX_NIGHTS, MAX_ROOMS, validateBooking } from '../lib/validate';
import { cartSubtotal, cartTax, cartTotal, folioTotal, signedMoney } from '../lib/selectors';
import { useGuest } from '../store/GuestContext';

/* ------------------------------------------------------------- one dish */

function DishSheet({ id }) {
  const { db, actions } = useGuest();
  const dish = db.menu.find((m) => m.id === id);
  const inTray = db.cart.find((c) => c.id === id);
  const [qty, setQty] = useState(inTray?.q || 1);
  const [note, setNote] = useState(inTray?.note || '');
  if (!dish) return null;

  return (
    <Sheet
      title={dish.n}
      footer={
        <button className="btn p" onClick={() => actions.addToCart(dish, qty - (inTray?.q || 0) || qty, note)}>
          {inTray ? 'Update tray' : 'Add to tray'} · {money(dish.p * qty)}
        </button>
      }
    >
      <img
        src={dish.img || foodImg(dish.n)} alt={dish.n}
        style={{ width: '100%', height: 150, objectFit: 'cover', borderRadius: 12 }}
      />
      <p className="gd" style={{ marginTop: 10 }}>{dish.d}</p>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '12px 0' }}>
        <span className="num" style={{ color: 'var(--ink)', fontSize: 16 }}>{money(dish.p)}</span>
        <div style={{ marginLeft: 'auto' }}>
          <Stepper
            value={qty}
            onDecrease={() => setQty((q) => Math.max(1, q - 1))}
            onIncrease={() => setQty((q) => q + 1)}
          />
        </div>
      </div>

      <Field
        label="Note for the kitchen"
        placeholder="Less spicy, no onion…"
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />
    </Sheet>
  );
}

/* ------------------------------------------------------------- the tray */

function CartSheet() {
  const { db, actions, busy } = useGuest();
  const [billTo, setBillTo] = useState(db.stay ? 'room' : 'pay');
  const [note, setNote] = useState('');

  if (!db.cart.length) {
    return (
      <Sheet title="Your tray">
        <ListRow><span style={{ color: 'var(--muted)' }}>Nothing in the tray yet.</span></ListRow>
      </Sheet>
    );
  }

  return (
    <Sheet
      title="Your tray"
      footer={
        <>
          <button className="btn p" disabled={busy} onClick={() => actions.placeOrder(billTo, note)}>
            Place order · {money(cartTotal(db))}
          </button>
          <div style={{ height: 8 }} />
          <button className="btn" onClick={actions.clearCart}>Empty the tray</button>
        </>
      }
    >
      {db.cart.map((c) => (
        <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <b style={{ color: 'var(--ink)', fontSize: 13.5 }}>{c.n}</b>
            <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>
              {money(c.p)} each{c.note ? ` · ${c.note}` : ''}
            </div>
          </div>
          <Stepper
            value={c.q}
            onDecrease={() => actions.changeQty(c.id, -1)}
            onIncrease={() => actions.changeQty(c.id, 1)}
          />
          <span className="num" style={{ width: 62, textAlign: 'right', color: 'var(--ink)' }}>
            {money(c.p * c.q)}
          </span>
        </div>
      ))}

      <table>
        <tbody>
          <tr><td>Subtotal</td><td className="rt num">{money(cartSubtotal(db))}</td></tr>
          <tr><td>CGST 2.5% + SGST 2.5%</td><td className="rt num">{money(cartTax(db))}</td></tr>
          <tr>
            <td><b>Total</b></td>
            <td className="rt num" style={{ fontSize: 16, color: 'var(--ink)' }}>{money(cartTotal(db))}</td>
          </tr>
        </tbody>
      </table>

      <div style={{ height: 12 }} />
      <Field as="select" label="How would you like to pay?" value={billTo} onChange={(e) => setBillTo(e.target.value)}>
        {db.stay && <option value="room">Add to my room bill — pay at check-out</option>}
        <option value="pay">Pay on delivery — cash or UPI</option>
      </Field>
      <Field
        label="Anything else?" placeholder="Extra plates, no cutlery…"
        value={note} onChange={(e) => setNote(e.target.value)}
      />
    </Sheet>
  );
}

/* ------------------------------------------------------------ room bill */

function FolioSheet() {
  const { db, openSheet } = useGuest();
  const stay = db.stay;
  if (!stay) {
    return (
      <Sheet title="Your bill">
        <ListRow><span style={{ color: 'var(--muted)' }}>No active stay.</span></ListRow>
      </Sheet>
    );
  }

  return (
    <Sheet
      title={`Bill — room ${stay.room}`}
      footer={<button className="btn p" onClick={() => openSheet('checkOut')}>Request check-out</button>}
    >
      <Pill tone="b">{stay.type} · {stay.nights} nights · {money(stay.rate)}/night</Pill>
      <table style={{ marginTop: 12 }}>
        <tbody>
          {stay.folio.map((f) => (
            <tr key={f.id}>
              <td>{f.head}</td>
              <td className="rt num" style={{ color: f.amount < 0 ? 'var(--green)' : 'var(--ink)' }}>
                {signedMoney(f.amount)}
              </td>
            </tr>
          ))}
          <tr>
            <td><b>Balance due</b></td>
            <td className="rt num" style={{ fontSize: 17, color: 'var(--ink)' }}>{money(folioTotal(db))}</td>
          </tr>
        </tbody>
      </table>
      <p style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 10 }}>
        This is a running statement. The front desk issues the final GST
        invoice when you check out.
      </p>
    </Sheet>
  );
}

/* --------------------------------------------------------- book a room */

function BookSheet({ type }) {
  const { db, auth, actions, busy, toast } = useGuest();
  const needOtp = auth === 'visitor';
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [form, setForm] = useState({
    guest: db.stay?.guest || '', phone: db.stay?.phone || '', type: type || db.roomTypes[0]?.type || '',
    rooms: '1', pax: '2', nights: '1',
    inD: db.date, outD: addDays(db.date, 1), note: ''
  });
  const [touched, setTouched] = useState({});
  const touch = (k) => () => setTouched((t) => ({ ...t, [k]: true }));
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const setIn = (e) => {
    const inD = e.target.value;
    setForm((f) => ({ ...f, inD, outD: addDays(inD, Number(f.nights) || 1) }));
  };
  const setNights = (e) => {
    const nights = e.target.value;
    setForm((f) => ({ ...f, nights, outD: addDays(f.inD, Number(nights) || 1) }));
  };

  const room = db.roomTypes.find((r) => r.type === form.type);
  const errors = validateBooking(form, room, todayISO());
  const err = (k) => (touched[k] ? errors[k] : undefined);
  const submit = () => {
    if (Object.keys(errors).length) {
      setTouched({ guest: true, phone: true, inD: true, nights: true, rooms: true, pax: true });
      toast(errors.rooms || 'Please fix the highlighted fields');
      return;
    }
    if (needOtp && !otpSent) {
      actions.sendBookingOtp(form.phone).then((ok) => { if (ok) setOtpSent(true); });
      return;
    }
    if (needOtp && otp.trim().length < 4) { toast('Enter the OTP sent to your mobile'); return; }
    actions.requestBooking(form, otp.trim());
  };
  const estimate = errors.nights || errors.rooms ? 0 : (room?.tariff || 0) * (Number(form.nights) || 1) * (Number(form.rooms) || 1);

  return (
    <Sheet
      title="Book a room"
      footer={<button className="btn p" disabled={busy} onClick={submit}>
        {!needOtp ? 'Send booking request' : otpSent ? 'Verify OTP and book' : 'Send OTP to confirm'}
      </button>}
    >
      {db.stay && (
        <div style={{ background: 'var(--wash)', color: 'var(--blue)', borderRadius: 11, padding: '11px 12px', fontSize: 12.5, marginBottom: 12 }}>
          You are staying in room {db.stay.room}. Book other rooms as well — for family or friends, or for
          another stay. We have filled in your name and number; change them if the booking is for someone else.
        </div>
      )}

      <img
        src={room?.img || ROOM_IMG[form.type]} alt={form.type}
        style={{ width: '100%', height: 130, objectFit: 'cover', borderRadius: 12, marginBottom: 12 }}
      />

      <Field as="select" label="Room type" value={form.type} onChange={set('type')}>
        {db.roomTypes.map((r) => (
          <option key={r.type} value={r.type}>{r.type} — {money(r.tariff)}/night</option>
        ))}
      </Field>
      {room && <p className="gd" style={{ marginTop: -6, marginBottom: 10 }}>{room.beds} · sleeps {room.sleeps}</p>}

      <fieldset disabled={otpSent} style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}>
      <Field label="Your name" maxLength={60} value={form.guest} error={err('guest')}
        onChange={set('guest')} onBlur={touch('guest')} />
      <Field label="Phone" type="tel" inputMode="numeric" maxLength={14} placeholder="10-digit mobile number"
        value={form.phone} error={err('phone')} onChange={set('phone')} onBlur={touch('phone')} />

      <Row2>
        <Field label="Arrival" type="date" min={todayISO()} value={form.inD} error={err('inD')}
          onChange={setIn} onBlur={touch('inD')} />
        <Field label="Nights" type="number" inputMode="numeric" min={1} max={MAX_NIGHTS} value={form.nights}
          error={err('nights')} onChange={setNights} onBlur={touch('nights')} />
      </Row2>
      <Row2>
        <Field label={`Rooms (max ${MAX_ROOMS})`} type="number" inputMode="numeric" min={1} value={form.rooms}
          error={errors.rooms && (touched.rooms || Number(form.rooms) > MAX_ROOMS) ? errors.rooms : undefined}
          onChange={set('rooms')} onBlur={touch('rooms')} />
        <Field label="Guests" type="number" inputMode="numeric" min={1} value={form.pax}
          error={err('pax')} onChange={set('pax')} onBlur={touch('pax')} />
      </Row2>

      <Field label="Anything we should know?" maxLength={200} placeholder="Late arrival, extra bed…" value={form.note} onChange={set('note')} />
      </fieldset>

      {otpSent && (
        <>
          <Field label={`OTP sent to ${form.phone}`} inputMode="numeric" maxLength={6} placeholder="6-digit code"
            value={otp} onChange={(e) => setOtp(e.target.value)} />
          <button className="btn sm" style={{ marginBottom: 12 }} disabled={busy}
            onClick={() => { setOtpSent(false); setOtp(''); }}>
            Change details
          </button>
        </>
      )}

      <table>
        <tbody>
          <tr><td>Leaving on</td><td className="rt num">{form.outD}</td></tr>
          <tr>
            <td><b>Estimated tariff</b></td>
            <td className="rt num" style={{ fontSize: 16, color: 'var(--ink)' }}>{money(estimate)}</td>
          </tr>
        </tbody>
      </table>
      <p style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 8 }}>
        GST extra. No payment now — the hotel calls you on {form.phone || 'your number'} to confirm.
      </p>
    </Sheet>
  );
}

/* -------------------------------------------------------- service asks */

function ServiceSheet({ service }) {
  const { actions, busy } = useGuest();
  const [note, setNote] = useState('');
  if (!service) return null;

  return (
    <Sheet
      title={service.label}
      footer={<button className="btn p" disabled={busy} onClick={() => actions.requestService(service, note)}>Send request</button>}
    >
      <p className="gd">{service.sub}</p>
      <Field
        label="Add a detail (optional)"
        placeholder={service.key === 'taxi' ? 'Railway station at 6 am' : 'Anything we should know'}
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />
      <div style={{ background: 'var(--wash)', color: 'var(--blue)', borderRadius: 11, padding: '11px 12px', fontSize: 12.5 }}>
        The front desk sees this straight away. Urgent? Call {HOTEL.phone}.
      </div>
      <div style={{ height: 12 }} />
    </Sheet>
  );
}

function CheckOutSheet() {
  const { db, actions, busy } = useGuest();
  const [note, setNote] = useState('');

  return (
    <Sheet
      title="Request check-out"
      footer={<button className="btn p" disabled={busy} onClick={() => actions.requestCheckOut(note)}>Tell the front desk</button>}
    >
      <table>
        <tbody>
          <tr><td>Room</td><td className="rt num">{db.stay?.room || '—'}</td></tr>
          <tr><td>Check-out by</td><td className="rt num">{HOTEL.checkOutTime}</td></tr>
          <tr>
            <td><b>Balance due</b></td>
            <td className="rt num" style={{ fontSize: 16, color: 'var(--ink)' }}>{money(folioTotal(db))}</td>
          </tr>
        </tbody>
      </table>
      <div style={{ height: 12 }} />
      <Field
        label="When would you like to leave?" placeholder="Around 10 am"
        value={note} onChange={(e) => setNote(e.target.value)}
      />
      <div style={{ background: 'var(--ow)', color: '#A55A00', borderRadius: 11, padding: '11px 12px', fontSize: 12.5 }}>
        Your bill will be ready at the desk. Settle by cash, UPI, card or bank
        transfer, and collect your GST invoice there.
      </div>
      <div style={{ height: 12 }} />
    </Sheet>
  );
}

function FeedbackSheet() {
  const { actions, busy } = useGuest();
  const [rating, setRating] = useState(5);
  const [text, setText] = useState('');

  return (
    <Sheet
      title="How was your stay?"
      footer={<button className="btn p" disabled={busy} onClick={() => actions.saveFeedback(rating, text)}>Send feedback</button>}
    >
      <div className="stars">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            className={n <= rating ? 'on' : ''}
            aria-label={`${n} star${n > 1 ? 's' : ''}`}
            onClick={() => setRating(n)}
          >
            ★
          </button>
        ))}
      </div>
      <p style={{ fontSize: 12, color: 'var(--muted)', margin: '0 0 10px' }}>
        {['Sorry to hear that', 'We can do better', 'Thank you', 'Glad you liked it', 'Wonderful — thank you'][rating - 1]}
      </p>
      <Field
        as="textarea" label="Tell us more" rows={4}
        placeholder="The room, the food, the staff…"
        value={text} onChange={(e) => setText(e.target.value)}
      />
    </Sheet>
  );
}

/* ------------------------------------------------------------------ host */

const SHEETS = {
  dish: DishSheet,
  cart: CartSheet,
  folio: FolioSheet,
  book: BookSheet,
  service: ServiceSheet,
  checkOut: CheckOutSheet,
  feedback: FeedbackSheet
};

export default function SheetHost() {
  const { sheet } = useGuest();
  if (!sheet) return null;

  const Component = SHEETS[sheet.type];
  if (!Component) return null;

  return <Component key={`${sheet.type}:${JSON.stringify(sheet.props)}`} {...sheet.props} />;
}
