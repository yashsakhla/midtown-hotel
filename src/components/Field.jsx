/** Labelled form control. Pass `as="select"` or `as="textarea"` to change the tag. */
export default function Field({ label, as = 'input', error, children, ...props }) {
  const Tag = as;
  return (
    <div className="f">
      {label && <label>{label}</label>}
      <Tag {...props} aria-invalid={error ? true : undefined}
        style={error ? { borderColor: 'var(--red)' } : undefined}>{children}</Tag>
      {error && <p style={{ color: 'var(--red)', fontSize: 11.5, margin: '5px 0 0', lineHeight: 1.35 }}>{error}</p>}
    </div>
  );
}

/** Two fields side by side. */
export function Row2({ children }) {
  return <div className="r2">{children}</div>;
}
