/** Small status chip. tone: g (green) r (red) o (orange) b (blue) n (neutral) */
export default function Pill({ tone = 'n', children }) {
  return <span className={`pill ${tone}`}>{children}</span>;
}
