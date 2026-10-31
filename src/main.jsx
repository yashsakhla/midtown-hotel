import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import { GuestProvider } from './store/GuestContext';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GuestProvider>
      <App />
    </GuestProvider>
  </StrictMode>
);
