/** Labelled form control. Pass `as="select"` or `as="textarea"` to change the tag. */
export default function Field({ label, as = 'input', children, ...props }) {
  const Tag = as;
  return (
    <div className="f">
      {label && <label>{label}</label>}
      <Tag {...props}>{children}</Tag>
    </div>
  );
}

/** Two fields side by side. */
export function Row2({ children }) {
  return <div className="r2">{children}</div>;
}
