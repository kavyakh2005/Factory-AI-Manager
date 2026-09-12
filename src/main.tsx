import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { registerSW } from 'virtual:pwa-register';
import { App } from './App';
import './index.css';
import { purgeExpiredLocalData } from './services/storage/localDb';
import { SyncManager } from './services/sync/syncManager';

// Automatically register service worker for native browser PWA installability
registerSW({ immediate: true });

// Purge any local storage / IndexedDB entries older than 7 days
purgeExpiredLocalData();

// Initialize sync manager (active only when remote Supabase is configured on production)
SyncManager.init();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 10000,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
