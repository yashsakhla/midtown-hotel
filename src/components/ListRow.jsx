/** One row of a list inside a Card. */
export default function ListRow({ title, sub, right, onClick, children }) {
  const Tag = onClick ? 'div' : 'div';
  return (
    <Tag
      className="li"
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter') onClick(e); } : undefined}
      style={onClick ? { cursor: 'pointer' } : undefined}
    >
      {children || (
        <>
          <div className="t">
            <b>{title}</b>
            {sub && <span>{sub}</span>}
          </div>
          {right}
        </>
      )}
    </Tag>
  );
}
