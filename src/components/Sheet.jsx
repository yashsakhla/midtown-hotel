import { useEffect, useRef } from 'react';
import { useGuest } from '../store/GuestContext';

/**
 * Bottom sheet. Children are the body; `footer` is pinned under it,
 * matching the original layout.
 */
export default function Sheet({ title, footer, children }) {
  const { closeSheet } = useGuest();
  const ref = useRef(null);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') closeSheet(); };
    window.addEventListener('keydown', onKey);
    ref.current?.scrollTo(0, 0);
    return () => window.removeEventListener('keydown', onKey);
  }, [closeSheet]);

  return (
    <div className="sheet on" ref={ref} role="dialog" aria-modal="true" aria-label={title}>
      <div className="grab" />
      <div className="sh">
        <h3 style={{ flex: 1 }}>{title}</h3>
        <button className="btn sm" onClick={closeSheet}>Close</button>
      </div>
      <div className="sb">
        {children}
        {footer && <div style={{ marginTop: 6 }}>{footer}</div>}
      </div>
    </div>
  );
}
