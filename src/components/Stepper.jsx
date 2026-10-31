/** − value + control. */
export default function Stepper({ value, onDecrease, onIncrease, valueStyle }) {
  return (
    <div className="stepper">
      <button type="button" onClick={onDecrease} aria-label="Decrease">−</button>
      <span className="num" style={valueStyle}>{value}</span>
      <button type="button" onClick={onIncrease} aria-label="Increase">+</button>
    </div>
  );
}
