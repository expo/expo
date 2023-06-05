import { useEffect, useRef, useState } from 'react';

import * as Updates from './Updates';
import { UpdateEvent } from './Updates.types';

/**
 * React hook to create an [`UpdateEvent`](#updateevent) listener subscription on mount, using
 * [`addListener`](#updatesaddlistenerlistener). It calls `remove()` on the subscription during unmount.
 *
 * @param listener A function that will be invoked with an [`UpdateEvent`](#updateevent) instance
 * and should not return any value.
 *
 * @example
 * ```ts
 * function App() {
 *   const eventListener = (event) => {
 *     if (event.type === Updates.UpdateEventType.ERROR) {
 *       // Handle error
 *     } else if (event.type === Updates.UpdateEventType.NO_UPDATE_AVAILABLE) {
 *       // Handle no update available
 *     } else if (event.type === Updates.UpdateEventType.UPDATE_AVAILABLE) {
 *       // Handle update available
 *     }
 *   };
 *   Updates.useUpdateEvents(eventListener);
 *   // React Component...
 * }
 * ```
 */
export const useUpdateEvents = (listener: (event: UpdateEvent) => void) => {
  const listenerRef = useRef<typeof listener>();

  useEffect(() => {
    listenerRef.current = listener;
  }, [listener]);

  useEffect(() => {
    if (listenerRef.current) {
      const subscription = Updates.addListener(listenerRef.current);
      return () => {
        subscription.remove();
      };
    }
    return undefined;
  }, []);
};

export const useUpdatesState: () => { [key: string]: any } = () => {
  const [localState, setLocalState] = useState<{ [key: string]: any }>({
    isUpdateAvailable: false,
    isUpdatePending: false,
    isRollback: false,
    isChecking: false,
    isDownloading: false,
    isRestarting: false,
    checkError: null,
    downloadError: null,
    latestManifest: null,
    downloadedManifest: null,
  });
  useEffect(() => {
    const subscription = Updates.addUpdatesStateChangeListener((event) => {
      const state: { [key: string]: any } = {};
      for (const key of event.fields) {
        state[key] = event.values[key];
      }
      setLocalState((localState) => ({ ...localState, ...state }));
    });
    return () => subscription.remove();
  }, []);
  return localState;
};
