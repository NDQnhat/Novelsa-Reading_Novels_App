/**
 * useOfflineState Hook
 * Quản lý online/offline detection + Service Worker
 */

import { useEffect, useState, useCallback } from 'react';

export interface OfflineState {
  isOnline: boolean;
  isSupported: boolean; // SW supported
  isReady: boolean; // SW registered
  needsUpdate: boolean; // New version available
}

export function useOfflineState(): OfflineState & {
  registerSW: () => Promise<void>;
  updateApp: () => void;
} {
  const [state, setState] = useState<OfflineState>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isSupported: typeof navigator !== 'undefined' && 'serviceWorker' in navigator,
    isReady: false,
    needsUpdate: false,
  });

  const [swReg, setSwReg] = useState<ServiceWorkerRegistration | null>(null);
  let swWaitingWorker: ServiceWorker | null = null;

  const registerSW = useCallback(async () => {
    if (!state.isSupported) {
      console.warn('[Offline] Service Worker not supported');
      return;
    }

    try {
      const reg = await navigator.serviceWorker.register(
        '/service-worker.js',
        {
          scope: '/',
        }
      );

      console.log('[Offline] Service Worker registered', reg);
      setSwReg(reg);

      // Check for updates periodically
      setInterval(async () => {
        try {
          await reg.update();
        } catch (err) {
          console.error('[Offline] Update check failed:', err);
        }
      }, 60000); // Check every 60 seconds

      // Listen for waiting worker
      if (reg.waiting) {
        swWaitingWorker = reg.waiting;
        setState((prev) => ({ ...prev, needsUpdate: true, isReady: true }));
      }

      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New version available
              console.log('[Offline] New version available');
              swWaitingWorker = newWorker;
              setState((prev) => ({
                ...prev,
                needsUpdate: true,
                isReady: true,
              }));
            }
          });
        }
      });

      setState((prev) => ({ ...prev, isReady: true }));
    } catch (err) {
      console.error('[Offline] SW registration failed:', err);
    }
  }, [state.isSupported]);

  const updateApp = useCallback(() => {
    if (swWaitingWorker) {
      swWaitingWorker.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  }, []);

  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => {
      console.log('[Offline] Back online');
      setState((prev) => ({ ...prev, isOnline: true }));
      
      // Sync any pending operations
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'SYNC_PENDING',
        });
      }
    };

    const handleOffline = () => {
      console.log('[Offline] Went offline');
      setState((prev) => ({ ...prev, isOnline: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { ...state, registerSW, updateApp };
}

/**
 * Offline indicator component
 */
import React from 'react';
import { Wifi, WifiOff, Download } from 'lucide-react';

interface OfflineIndicatorProps {
  state: OfflineState & { updateApp: () => void };
  className?: string;
}

export function OfflineIndicator({
  state,
  className = '',
}: OfflineIndicatorProps) {
  if (state.isOnline && !state.needsUpdate) {
    return null;
  }

  if (!state.isOnline) {
    return (
      <div
        className={`
          flex items-center gap-2 px-3 py-2 bg-orange-900 text-orange-100 
          rounded-lg text-sm font-medium ${className}
        `}
      >
        <WifiOff size={16} />
        <span>Bạn đang ngoại tuyến</span>
      </div>
    );
  }

  if (state.needsUpdate) {
    return (
      <div
        className={`
          flex items-center justify-between gap-3 px-3 py-2 
          bg-blue-900 text-blue-100 rounded-lg text-sm font-medium ${className}
        `}
      >
        <div className="flex items-center gap-2">
          <Download size={16} />
          <span>Phiên bản mới có sẵn</span>
        </div>
        <button
          onClick={state.updateApp}
          className="
            px-3 py-1 bg-blue-700 hover:bg-blue-600 rounded 
            font-semibold text-xs transition-colors
          "
        >
          Cập nhật ngay
        </button>
      </div>
    );
  }

  return null;
}
