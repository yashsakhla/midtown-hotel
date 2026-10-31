import TabBar from './components/TabBar';
import Toast from './components/Toast';
import TopBar from './components/TopBar';
import { money } from './lib/format';
import { cartCount, cartTotal } from './lib/selectors';
import LoginScreen from './screens/LoginScreen';
import HelpScreen from './screens/HelpScreen';
import MenuScreen from './screens/MenuScreen';
import OrdersScreen from './screens/OrdersScreen';
import RoomsScreen from './screens/RoomsScreen';
import StayScreen from './screens/StayScreen';
import SheetHost from './sheets';
import { useGuest } from './store/GuestContext';

const SCREENS = {
  stay: StayScreen,
  rooms: RoomsScreen,
  menu: MenuScreen,
  orders: OrdersScreen,
  help: HelpScreen
};

export default function App() {
  const { db, auth, tab, sheet, openSheet, closeSheet } = useGuest();

  const Screen = SCREENS[tab];
  const count = cartCount(db);

  if (auth === 'loading' || auth === 'out') {
    return (
      <div className="phone">
        {auth === 'out' ? <LoginScreen /> : <p style={{ margin: 'auto', color: 'var(--muted)' }}>Loading…</p>}
        <Toast />
      </div>
    );
  }

  return (
    <div className="phone">
      <TopBar />

      <main className="scr" key={tab}>
        <Screen />
      </main>

      {/* The tray bar replaces the FAB — it only appears when something is in it. */}
      {count > 0 && !sheet && (
        <button className="cartbar" onClick={() => openSheet('cart')}>
          <span className="cc">{count}</span>
          View tray
          <span className="ca">{money(cartTotal(db))}</span>
        </button>
      )}

      <div className={`scrim${sheet ? ' on' : ''}`} onClick={closeSheet} />
      <SheetHost />
      <Toast />
      <TabBar />
    </div>
  );
}
