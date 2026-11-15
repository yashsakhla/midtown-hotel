import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { mapFolio, STATUS_LABEL } from '../lib/mappers';
import RoomPicker from '../components/RoomPicker';
import { foodImg, ROOM_IMG } from '../assets';
import Field, { Row2 } from '../components/Field';
import ListRow from '../components/ListRow';
import Pill from '../components/Pill';
import Sheet from '../components/Sheet';
import Stepper from '../components/Stepper';
import { HOTEL } from '../data/seed';
import { addDays, money, today as todayISO } from '../lib/format';
import { roomRate } from '../lib/pricing';
import { MAX_NIGHTS, MAX_ROOMS, validateBooking } from '../lib/validate';
import { activeBookings, activeRooms, cartSubtotal, cartTax, cartTotal, folioTotal, signedMoney } from '../lib/selectors';
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
  const rooms = activeRooms(db);
  const [billTo, setBillTo] = useState('room');
  const [stayId, setStayId] = useState(rooms[0]?.stayId || '');
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
          <button className="btn p" disabled={busy} onClick={() => actions.placeOrder(billTo, note, stayId)}>
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
      <Field as="select" label="Deliver to" value={stayId} onChange={(e) => setStayId(e.target.value)}>
        {rooms.map((r) => (
          <option key={r.stayId} value={r.stayId}>Room {r.number}{r.type ? ` · ${r.type}` : ''}</option>
        ))}
      </Field>
      <Field as="select" label="How would you like to pay?" value={billTo} onChange={(e) => setBillTo(e.target.value)}>
        <option value="room">Add to that room's bill — pay at check-out</option>
        <option value="pay">Pay on delivery — cash or UPI</option>
      </Field>
      <Field
        label="Anything else?" placeholder="Extra plates, no cutlery…"
        value={note} onChange={(e) => setNote(e.target.value)}
      />
    </Sheet>
  );
}

/* ------------------------------------------------------------ bills */

/** Bill for one booking (all its rooms). Works for current and past bookings. */
function FolioSheet({ bookingId }) {
  const { db, openSheet, toast } = useGuest();
  const booking = db.bookings.find((b) => b.id === bookingId);
  const [folio, setFolio] = useState(null);

  useEffect(() => {
    let live = true;
    api.bookingFolio(bookingId)
      .then((d) => { if (live) setFolio(mapFolio(d)); })
      .catch(() => {
        if (!live) return;
        setFolio({ lines: [], balance: booking?.balance || 0, paid: 0, invoiceUrl: '' });
        toast('Could not load the bill lines');
      });
    return () => { live = false; };
  }, [bookingId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!booking) {
    return <Sheet title="Bill"><ListRow><span style={{ color: 'var(--muted)' }}>Booking not found.</span></ListRow></Sheet>;
  }

  const isLive = booking.status === 'CHECKED_IN';
  const multi = booking.rooms.length > 1;
  const invoice = folio?.invoiceUrl || booking.invoiceUrl;

  return (
    <Sheet
      title={`Bill — ${booking.ref || 'booking'}`}
      footer={
        <>
          {invoice && (
            <a className="btn p" style={{ textDecoration: 'none', display: 'block', textAlign: 'center' }}
              href={invoice} target="_blank" rel="noreferrer">Download invoice</a>
          )}
          {isLive && (
            <>
              {invoice && <div style={{ height: 8 }} />}
              <button className="btn p" onClick={() => openSheet('checkOut')}>Request check-out</button>
            </>
          )}
        </>
      }
    >
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <Pill tone="b">{booking.arrival} → {booking.departure}</Pill>
        <Pill tone="n">{booking.nights} night{booking.nights === 1 ? '' : 's'}</Pill>
        <Pill tone={isLive ? 'o' : 'g'}>{STATUS_LABEL[booking.status]}</Pill>
      </div>

      {booking.rooms.map((r) => (
        <p key={r.stayId} className="gd" style={{ margin: '8px 0 0' }}>
          Room {r.number}{r.type ? ` · ${r.type}` : ''}{r.rate ? ` · ${money(r.rate)}/night` : ''}
        </p>
      ))}

      {folio === null ? (
        <p className="gd" style={{ marginTop: 12 }}>Loading bill…</p>
      ) : (
        <table style={{ marginTop: 12 }}>
          <tbody>
            {folio.lines.map((f) => (
              <tr key={f.id}>
                <td>{multi && f.room ? `Room ${f.room} · ` : ''}{f.head}</td>
                <td className="rt num" style={{ color: f.amount < 0 ? 'var(--green)' : 'var(--ink)' }}>
                  {signedMoney(f.amount)}
                </td>
              </tr>
            ))}
            <tr>
              <td><b>{isLive ? 'Balance due' : 'Balance'}</b></td>
              <td className="rt num" style={{ fontSize: 17, color: 'var(--ink)' }}>{money(folio.balance)}</td>
            </tr>
          </tbody>
        </table>
      )}
      <p style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 10 }}>
        {isLive
          ? 'This is a running statement. The front desk issues the final GST invoice when you check out.'
          : 'Final statement for this booking.'}
      </p>
    </Sheet>
  );
}

/** When several bookings are active at once, pick which bill to open. */
function BillsSheet() {
  const { db, openSheet } = useGuest();
  const list = activeBookings(db);
  return (
    <Sheet title="Your bills">
      {list.map((b) => (
        <ListRow
          key={b.id}
          title={`${b.ref || 'Booking'} · Room ${b.rooms.map((r) => r.number).join(', ')}`}
          sub={`${b.arrival} → ${b.departure}`}
          right={<span className="num" style={{ color: 'var(--ink)' }}>{money(b.balance)}</span>}
          onClick={() => openSheet('folio', { bookingId: b.id })}
        />
      ))}
      <table style={{ marginTop: 8 }}>
        <tbody>
          <tr>
            <td><b>Total due</b></td>
            <td className="rt num" style={{ fontSize: 16, color: 'var(--ink)' }}>{money(folioTotal(db))}</td>
          </tr>
        </tbody>
      </table>
    </Sheet>
  );
}

/* --------------------------------------------------------- book a room */

function BookSheet({ type }) {
  const { db, auth, actions, busy, toast } = useGuest();
  const needOtp = auth === 'visitor';
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const firstType = type || db.roomTypes[0]?.type || '';
  const [form, setForm] = useState({
    guest: db.customer?.name || '', phone: db.customer?.phone || '',
    lines: [{ type: firstType, guests: '1' }], // one line per room
    nights: '1', inD: db.date, outD: addDays(db.date, 1), note: ''
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

  const setLine = (i, patch) =>
    setForm((f) => ({ ...f, lines: f.lines.map((l, j) => (j === i ? { ...l, ...patch } : l)) }));
  const addLine = () => {
    if (form.lines.length >= MAX_ROOMS) { toast('For bulk booking, please contact the front desk.'); return; }
    const last = form.lines[form.lines.length - 1];
    setForm((f) => ({ ...f, lines: [...f.lines, { type: last?.type || firstType, guests: '1' }] }));
  };
  const removeLine = (i) => setForm((f) => ({ ...f, lines: f.lines.filter((_, j) => j !== i) }));

  const errors = validateBooking(form, db.roomTypes, todayISO());
  const err = (k) => (touched[k] ? errors[k] : undefined);
  const lineErr = (i) => (touched.lines ? errors.lines?.[i] : undefined);
  const submit = () => {
    if (Object.keys(errors).length) {
      setTouched({ guest: true, phone: true, inD: true, nights: true, lines: true });
      toast(errors.lines?.find(Boolean) || errors.rooms || 'Please fix the highlighted fields');
      return;
    }
    if (needOtp && !otpSent) {
      actions.sendBookingOtp(form.phone).then((ok) => { if (ok) setOtpSent(true); });
      return;
    }
    if (needOtp && otp.trim().length < 4) { toast('Enter the OTP sent to your mobile'); return; }
    actions.requestBooking(form, otp.trim());
  };

  const nights = Number(form.nights) || 0;
  const perNight = form.lines.reduce((t, l) => t + roomRate(db.roomTypes.find((r) => r.type === l.type), l.guests), 0);
  const estimate = errors.nights ? 0 : perNight * nights;
  const totalGuests = form.lines.reduce((t, l) => t + (Number(l.guests) || 0), 0);

  return (
    <Sheet
      title="Book a room"
      footer={<button className="btn p" disabled={busy} onClick={submit}>
        {!needOtp ? 'Send booking request' : otpSent ? 'Verify OTP and book' : 'Send OTP to confirm'}
      </button>}
    >
      {db.customer && (
        <div style={{ background: 'var(--wash)', color: 'var(--blue)', borderRadius: 11, padding: '11px 12px', fontSize: 12.5, marginBottom: 12 }}>
          Book as many rooms as you need in one go — for family or friends, or for another stay. We have filled in
          your name and number; change the name if the booking is for someone else.
        </div>
      )}

      <fieldset disabled={otpSent} style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}>
      {form.lines.map((line, i) => {
        const room = db.roomTypes.find((r) => r.type === line.type);
        const sleeps = room?.sleeps || 2;
        return (
          <div className="roomline" key={i}>
            <div className="rl-h">
              <b>Room {i + 1}</b>
              {form.lines.length > 1 && (
                <button type="button" className="btn sm" onClick={() => removeLine(i)}>Remove</button>
              )}
            </div>
            {i === 0 && (
              <img
                src={room?.img || ROOM_IMG[line.type]} alt={line.type}
                style={{ width: '100%', height: 110, objectFit: 'cover', borderRadius: 12, marginBottom: 10 }}
              />
            )}
            <Row2>
              <Field as="select" label="Room type" value={line.type}
                onChange={(e) => {
                  const t = db.roomTypes.find((r) => r.type === e.target.value);
                  setLine(i, { type: e.target.value, guests: String(Math.min(Number(line.guests) || 1, t?.sleeps || 2)) });
                }}>
                {db.roomTypes.map((r) => (
                  <option key={r.type} value={r.type}>{r.type}</option>
                ))}
              </Field>
              <Field label={`Guests (max ${sleeps})`} type="number" inputMode="numeric" min={1} max={sleeps}
                value={line.guests} error={lineErr(i)}
                onChange={(e) => setLine(i, { guests: e.target.value })} onBlur={touch('lines')} />
            </Row2>
            {room && (
              <p className="gd" style={{ margin: '-4px 0 0' }}>
                {room.beds ? `${room.beds} · ` : ''}sleeps {sleeps} · {money(roomRate(room, line.guests))}/night for {Number(line.guests) || 1} guest{Number(line.guests) > 1 ? 's' : ''}
              </p>
            )}
          </div>
        );
      })}
      <button type="button" className="btn" style={{ marginBottom: 12 }} onClick={addLine}>+ Add another room</button>
      {errors.rooms && touched.lines && <p style={{ color: 'var(--red)', fontSize: 11.5 }}>{errors.rooms}</p>}

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
          <tr><td>Rooms · guests</td><td className="rt num">{form.lines.length} · {totalGuests}</td></tr>
          <tr><td>Per night</td><td className="rt num">{money(perNight)}</td></tr>
          <tr><td>Leaving on</td><td className="rt num">{form.outD}</td></tr>
          <tr>
            <td><b>Estimated tariff</b></td>
            <td className="rt num" style={{ fontSize: 16, color: 'var(--ink)' }}>{money(estimate)}</td>
          </tr>
        </tbody>
      </table>
      <p style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 8 }}>
        GST extra. Price depends on guests per room. No payment now — the hotel calls you on {form.phone || 'your number'} to confirm.
      </p>
    </Sheet>
  );
}

/* -------------------------------------------------------- service asks */

function ServiceSheet({ service }) {
  const { db, actions, busy } = useGuest();
  const rooms = activeRooms(db);
  const [note, setNote] = useState('');
  const [picked, setPicked] = useState(rooms.length === 1 ? [rooms[0].stayId] : []);
  if (!service) return null;

  return (
    <Sheet
      title={service.label}
      footer={
        <button className="btn p" disabled={busy || !picked.length}
          onClick={() => actions.requestService(service, note, picked)}>
          {picked.length > 1 ? `Send request for ${picked.length} rooms` : 'Send request'}
        </button>
      }
    >
      <p className="gd">{service.sub}</p>
      <RoomPicker rooms={rooms} selected={picked} onChange={setPicked} label="Which rooms is this for?" />
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
  const rooms = activeRooms(db);
  const [note, setNote] = useState('');
  const [picked, setPicked] = useState(rooms.length === 1 ? [rooms[0].stayId] : []);
  const bookingIds = new Set(rooms.filter((r) => picked.includes(r.stayId)).map((r) => r.bookingId));
  const due = activeBookings(db).filter((b) => bookingIds.has(b.id)).reduce((t, b) => t + b.balance, 0);

  return (
    <Sheet
      title="Request check-out"
      footer={
        <button className="btn p" disabled={busy || !picked.length}
          onClick={() => actions.requestCheckOut(note, picked)}>
          Tell the front desk
        </button>
      }
    >
      <RoomPicker rooms={rooms} selected={picked} onChange={setPicked} label="Which rooms are checking out?" />
      <table>
        <tbody>
          <tr><td>Check-out by</td><td className="rt num">{HOTEL.checkOutTime}</td></tr>
          <tr>
            <td><b>Balance due</b></td>
            <td className="rt num" style={{ fontSize: 16, color: 'var(--ink)' }}>{money(due)}</td>
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

function FeedbackSheet({ bookingId }) {
  const { actions, busy } = useGuest();
  const [rating, setRating] = useState(5);
  const [text, setText] = useState('');

  return (
    <Sheet
      title="How was your stay?"
      footer={<button className="btn p" disabled={busy} onClick={() => actions.saveFeedback(rating, text, bookingId)}>Send feedback</button>}
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
  bills: BillsSheet,
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
