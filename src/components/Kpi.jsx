/** Two-up grid of headline figures. */
export function KpiGrid({ children }) {
  return <div className="kpi">{children}</div>;
}

export function Kpi({ value, label }) {
  return (
    <div className="k">
      <b>{value}</b>
      <span>{label}</span>
    </div>
  );
}
