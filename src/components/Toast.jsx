import { useGuest } from '../store/GuestContext';

export default function Toast() {
  const { toastMsg } = useGuest();
  return (
    <div className={`toast${toastMsg ? ' on' : ''}`} role="status" aria-live="polite">
      {toastMsg}
    </div>
  );
}
