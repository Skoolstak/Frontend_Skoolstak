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

reportWebVitals();
