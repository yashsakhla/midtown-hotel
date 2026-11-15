/** Pick one or more of the rooms the guest is staying in. `rooms` come from activeRooms(db). */
export default function RoomPicker({ rooms, selected, onChange, label = 'Which rooms?' }) {
  const all = rooms.length > 1 && selected.length === rooms.length;
  const toggle = (id) =>
    onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);

  return (
    <fieldset className="picker">
      <legend>{label}</legend>
      {rooms.length > 1 && (
        <label className="pk all">
          <input type="checkbox" checked={all} onChange={() => onChange(all ? [] : rooms.map((r) => r.stayId))} />
          <span>All rooms</span>
        </label>
      )}
      {rooms.map((r) => (
        <label className="pk" key={r.stayId}>
          <input type="checkbox" checked={selected.includes(r.stayId)} onChange={() => toggle(r.stayId)} />
          <span><b>Room {r.number}</b>{r.type ? ` · ${r.type}` : ''}{r.guest ? ` · ${r.guest}` : ''}</span>
        </label>
      ))}
    </fieldset>
  );
}
