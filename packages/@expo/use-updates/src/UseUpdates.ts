import * as Updates from 'expo-updates';
import { useEffect, useRef, useState } from 'react';

import {
  UseUpdatesStateType,
  UseUpdatesReturnType,
  UseUpdatesEventType,
  UseUpdatesEvent,
} from './UseUpdates.types';
import { emitEvent, useUpdateEvents } from './UseUpdatesEmitter';
import { currentlyRunning, availableUpdateFromEvent } from './UseUpdatesUtils';

/**
 * Calls `Updates.checkForUpdateAsync()` and refreshes the `availableUpdate` property with the result.
 * If an error occurs, the `error` property will be set.
 */
export const checkForUpdate = () => {
  Updates.checkForUpdateAsync()
    .then((result) => {
      if (result.isAvailable) {
        emitEvent({
          type: UseUpdatesEventType.UPDATE_AVAILABLE,
          manifest: result?.manifest || undefined,
        });
      } else {
        emitEvent({
          type: UseUpdatesEventType.NO_UPDATE_AVAILABLE,
        });
      }
    })
    .catch((error) => {
      emitEvent({
        type: UseUpdatesEventType.ERROR,
        error,
      });
    });
};
/**
 * Downloads an update, if one is available, using `Updates.fetchUpdateAsync()`.
 * If an error occurs, the `error` property will be set.
 */
export const downloadUpdate = () => {
  emitEvent({
    type: UseUpdatesEventType.DOWNLOAD_START,
  });
  Updates.fetchUpdateAsync()
    .then(() => {
      emitEvent({
        type: UseUpdatesEventType.DOWNLOAD_COMPLETE,
      });
    })
    .catch((error) => {
      emitEvent({
        type: UseUpdatesEventType.ERROR,
        error,
      });
    });
};

/**
 * Runs an update by calling `Updates.reloadAsync()`. This should not be called unless there is an available update
 * that has already been successfully downloaded using `downloadUpdate()`.
 * If an error occurs, the `error` property will be set.
 */
export const runUpdate = () => {
  Updates.reloadAsync().catch((error) => {
    emitEvent({
      type: UseUpdatesEventType.ERROR,
      error,
    });
  });
};

/**
 * Calls `Updates.readLogEntriesAsync()` and sets the `logEntries` property to the results.
 * If an error occurs, the `error` property will be set.
 *
 * @param maxAge Max age of log entries to read, in ms. Defaults to 3600000 (1 hour).
 */
export const readLogEntries: (maxAge?: number) => void = (maxAge: number = 3600000) => {
  Updates.readLogEntriesAsync(maxAge)
    .then((logEntries) => {
      emitEvent({
        type: UseUpdatesEventType.READ_LOG_ENTRIES_COMPLETE,
        logEntries,
      });
    })
    .catch((error) => {
      emitEvent({
        type: UseUpdatesEventType.ERROR,
        error,
      });
    });
};

/**
 * Hook that obtains the Updates info structure and functions.
 *
 * @param eventListener Optional event listener that will receive events from the `UseUpdatesEvent` emitter.
 *
 * @return the structures with information on currently running and available updates.
 *
 * @example
 * ```tsx UpdatesDemo.tsx
 * import { StatusBar } from 'expo-status-bar';
 * import React from 'react';
 * import { Pressable, Text, View } from 'react-native';
 *
 * import type { UseUpdatesEvent } from '@expo/use-updates';
 * import {
 *   useUpdates,
 *   checkForUpdate,
 *   downloadUpdate,
 *   runUpdate,
 *   UseUpdatesEventType,
 * } from '@expo/use-updates';
 *
 * export default function UpdatesDemo() {
 *   const eventListener = (event: UseUpdatesEvent) => {
 *     if (event.type === UseUpdatesEventType.DOWNLOAD_COMPLETE) {
 *       runUpdate();
 *     }
 *   };
 *
 *   const { currentlyRunning, availableUpdate } = useUpdates(eventListener);
 *
 *   // If true, we show the button to download and run the update
 *   const showDownloadButton = availableUpdate !== undefined;
 *
 *   // Show whether or not we are running embedded code or an update
 *   const runTypeMessage = currentlyRunning.isEmbeddedLaunch
 *     ? 'This app is running from built-in code'
 *     : 'This app is running an update';
 *
 *   return (
 *     <View style={styles.container}>
 *       <Text style={styles.headerText}>Updates Demo</Text>
 *       <Text>{runTypeMessage}</Text>
 *       <Button pressHandler={checkForUpdate} text="Check manually for updates" />
 *       {showDownloadButton ? (
 *         <Button pressHandler={downloadUpdate} text="Download and run update" />
 *       ) : null}
 *       <StatusBar style="auto" />
 *     </View>
 *   );
 * }
 * ```
 */
export const useUpdates: (
  eventListener?: (event: UseUpdatesEvent) => void
) => UseUpdatesReturnType = (eventListener) => {
  const [updatesState, setUpdatesState] = useState<UseUpdatesStateType>({});

  const eventListenerRef = useRef<((event: UseUpdatesEvent) => void) | undefined>();

  useEffect(() => {
    eventListenerRef.current = eventListener;
  }, [eventListener]);

  // Set up listener for events from automatic update requests
  // that happen on startup, and use events to refresh the updates info
  // context
  useUpdateEvents((event) => {
    eventListenerRef?.current && eventListenerRef?.current(event);

    const { availableUpdate, error } = availableUpdateFromEvent(event);
    switch (event.type) {
      case UseUpdatesEventType.UPDATE_AVAILABLE:
      case UseUpdatesEventType.NO_UPDATE_AVAILABLE:
      case UseUpdatesEventType.ERROR:
        setUpdatesState((updatesState) => ({
          ...updatesState,
          availableUpdate,
          error,
          lastCheckForUpdateTimeSinceRestart: new Date(),
        }));
        break;
      case UseUpdatesEventType.READ_LOG_ENTRIES_COMPLETE:
        setUpdatesState((updatesState) => ({
          ...updatesState,
          logEntries: event?.logEntries,
        }));
        break;
      default:
        break;
    }
  });

  // Return the updates info and the user facing functions
  return {
    currentlyRunning,
    ...updatesState,
  };
};
