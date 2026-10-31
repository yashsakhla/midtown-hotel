import { useMemo, useState } from 'react';
import { foodImg } from '../assets';
import { money } from '../lib/format';
import { useGuest } from '../store/GuestContext';

/** Small green / red veg mark, as printed on Indian menus. */
function VegMark({ veg }) {
  const c = veg ? '#2E9E63' : '#C0392F';
  return (
    <span
      aria-label={veg ? 'Vegetarian' : 'Non-vegetarian'}
      style={{
        width: 13, height: 13, border: `1.5px solid ${c}`, borderRadius: 3,
        display: 'inline-grid', placeItems: 'center', flex: 'none'
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: c }} />
    </span>
  );
}

export default function MenuScreen() {
  const { db, openSheet, actions } = useGuest();
  const [cat, setCat] = useState('All');
  const [onlyVeg, setOnlyVeg] = useState(false);

  const cats = useMemo(() => ['All', ...new Set(db.menu.map((m) => m.c))], [db.menu]);
  const list = db.menu.filter(
    (m) => (cat === 'All' || m.c === cat) && (!onlyVeg || m.veg)
  );

  const qtyOf = (id) => db.cart.find((c) => c.id === id)?.q || 0;

  return (
    <>
      <div className="chips">
        <button className={onlyVeg ? 'on' : ''} onClick={() => setOnlyVeg((v) => !v)}>
          Veg only
        </button>
        {cats.map((c) => (
          <button key={c} className={cat === c ? 'on' : ''} onClick={() => setCat(c)}>{c}</button>
        ))}
      </div>

      {list.map((m) => {
        const q = qtyOf(m.id);
        return (
          <article className="gcard" key={m.id}>
            <div style={{ display: 'flex', gap: 12, padding: 12 }}>
              <img
                src={m.img || foodImg(m.n)} alt={m.n}
                style={{ width: 92, height: 92, objectFit: 'cover', borderRadius: 12, flex: 'none' }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <VegMark veg={m.veg} />
                  <h4 style={{ fontSize: 14.5 }}>{m.n}</h4>
                </div>
                <p className="gd" style={{ marginTop: 5 }}>{m.d}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 9 }}>
                  <span className="num" style={{ color: 'var(--ink)', fontSize: 14.5 }}>{money(m.p)}</span>
                  <button
                    className={q ? 'btn sm' : 'btn p sm'}
                    style={{ marginLeft: 'auto', width: 'auto', padding: '8px 14px' }}
                    onClick={() => openSheet('dish', { id: m.id })}
                  >
                    {q ? `In tray · ${q}` : 'Add'}
                  </button>
                </div>
              </div>
            </div>
          </article>
        );
      })}

      <p style={{ fontSize: 11.5, color: 'var(--muted)', textAlign: 'center' }}>
        Kitchen hours 7:00 am – 11:00 pm · Prices exclude 5% GST
      </p>
    </>
  );
}
