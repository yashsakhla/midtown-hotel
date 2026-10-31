/** White rounded panel with an optional header row. */
export default function Card({ title, action, children, body = false, style }) {
  return (
    <section className="card" style={style}>
      {title && (
        <div className="h">
          <h3>{title}</h3>
          {action && <span style={{ marginLeft: 'auto' }}>{action}</span>}
        </div>
      )}
      {body ? <div className="b">{children}</div> : children}
    </section>
  );
}
