import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { registerSyncListener, syncOfflineData } from './services/syncService';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Register service worker for offline support
if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js')
      .then(reg => console.log('SW registered:', reg.scope))
      .catch(err => console.warn('SW registration failed:', err));
  });
}

// Register sync listener — fires on reconnect
registerSyncListener(summary => {
  if (summary && (summary.attendance + summary.grades + summary.payments) > 0) {
    console.log('Offline sync complete:', summary);
    // Dispatch a custom event so components can refresh
    window.dispatchEvent(new CustomEvent('offlineSyncComplete', { detail: summary }));
  }
});

// Try to sync any leftover data from previous offline session on startup
if (navigator.onLine) {
  syncOfflineData().catch(() => {});
}

// Free hosting puts the server to sleep when idle and the first request then takes up to a minute.
// Wake it as soon as the app opens, and again when the tab comes back after a long break, so it is
// already awake by the time someone has typed their password or opens a page.
const healthUrl = (process.env.REACT_APP_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '') + '/health';
let lastWarm = 0;
function warmServer() {
  if (Date.now() - lastWarm < 4 * 60 * 1000) return;
  lastWarm = Date.now();
  fetch(healthUrl, { mode: 'no-cors', cache: 'no-store' }).catch(() => {});
}
warmServer();
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') warmServer(); });

reportWebVitals();
