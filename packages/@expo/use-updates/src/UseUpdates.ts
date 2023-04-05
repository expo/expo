import * as Updates from 'expo-updates';
import type { UpdatesLogEntry } from 'expo-updates';
import { useEffect, useRef, useState } from 'react';

import type {
  AvailableUpdateInfo,
  CurrentlyRunningInfo,
  UseUpdatesCallbacksType,
  UseUpdatesStateType,
} from './UseUpdates.types';
import {
  checkForUpdateAndReturnAvailableAsync,
  currentlyRunning,
  downloadUpdateAsync,
  runUpdateAsync,
  availableUpdateFromEvent,
} from './UseUpdatesUtils';

/**
 * Hook that obtains the Updates info structure and functions.
 *
 * @param callbacks Optional set of callbacks that will be called when `checkForUpdate()`, `downloadUpdate()`, `downloadAndRunUpdate()`, or `runUpdate()`, start, complete, or have errors.
 *
 * @return the structures with information on currently running and available updates, and associated methods.
 * When using this hook, the methods returned should be used instead of `expo-updates` methods (`checkForUpdateAsync()`, `fetchUpdateAsync()`, `reloadAsync()).
 *
 * @example
 * ```jsx UpdatesDemo.tsx
 * import { StatusBar } from 'expo-status-bar';
 * import React from 'react';
 * import { Pressable, Text, View } from 'react-native';
 *
 * import { useUpdates } from '@expo/use-updates';
 * import type { UseUpdatesCallbacksType } from '@expo/use-updates';
 *
 * export default function UpdatesDemo() {
 *   const callbacks = {
 *     onDownloadUpdateComplete: () => {
 *       runUpdate();
 *     },
 *   };
 *
 *   const { currentlyRunning, availableUpdate, checkForUpdate, downloadUpdate, runUpdate } = useUpdates();
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
const useUpdates: (callbacks?: {
  onCheckForUpdateStart?(): void;
  onCheckForUpdateComplete?(): void;
  onCheckForUpdateError?(error?: Error): void;
  onDownloadUpdateStart?(): void;
  onDownloadUpdateComplete?(): void;
  onDownloadUpdateError?(error?: Error): void;
  onRunUpdateStart?(): void;
  onRunUpdateError?(error?: Error): void;
}) => {
  /**
   * Information on the currently running app
   */
  currentlyRunning: CurrentlyRunningInfo;
  /**
   * If a new available update has been found, either by using checkForUpdate(),
   * or by the `UpdateEvent` listener in `useUpdates()`,
   * this will contain the information for that update.
   */
  availableUpdate?: AvailableUpdateInfo;
  /**
   * If an error is returned by any of the APIs to check for, download, or launch updates,
   * the error description will appear here.
   */
  error?: Error;
  /**
   * A `Date` object representing the last time this client checked for an available update,
   * or undefined if no check has yet occurred since the app started. Does not persist across
   * app reloads or restarts.
   */
  lastCheckForUpdateTimeSinceRestart?: Date;
  /**
   * If present, contains expo-updates log entries returned by the `getLogEntries()` method.
   */
  logEntries?: UpdatesLogEntry[];
  /**
   * Calls `Updates.checkForUpdateAsync()` and refreshes the `availableUpdate` property with the result.
   * If an error occurs, the `error` property will be set.
   */
  checkForUpdate(): void;
  /**
   * Downloads an update, if one is available, using `Updates.fetchUpdateAsync()`.
   * If an error occurs, the `error` property will be set.
   */
  downloadUpdate(): void;
  /**
   * Runs an update by calling `Updates.reloadAsync()`. This should not be called unless there is an available update
   * that has already been successfully downloaded using `downloadUpdate()`.
   * If an error occurs, the `error` property will be set.
   */
  runUpdate(): void;
  /**
   * Calls `Updates.readLogEntriesAsync()` and sets the `logEntries` property in the `updatesInfo` structure to the results.
   * If an error occurs, the `error` property will be set.
   */
  readLogEntries(maxAge?: number): void;
} = (callbacks) => {
  const [updatesState, setUpdatesState] = useState<UseUpdatesStateType>({});

  const callbacksRef = useRef<UseUpdatesCallbacksType>();

  useEffect(() => {
    callbacksRef.current = callbacks;
  }, [callbacks]);

  // Set up listener for events from automatic update requests
  // that happen on startup, and use events to refresh the updates info
  // context
  Updates.useUpdateEvents((event) => {
    const { availableUpdate, error } = availableUpdateFromEvent(event);
    setUpdatesState((updatesState) => ({
      ...updatesState,
      availableUpdate,
      error,
      lastCheckForUpdateTimeSinceRestart: new Date(),
    }));
  });

  const checkForUpdate = () => {
    checkForUpdateAndReturnAvailableAsync(callbacksRef.current)
      .then((availableUpdate) =>
        setUpdatesState((updatesState) => ({
          ...updatesState,
          lastCheckForUpdateTimeSinceRestart: new Date(),
          availableUpdate,
        }))
      )
      .catch((error) =>
        setUpdatesState((updatesState) => ({
          ...updatesState,
          lastCheckForUpdateTimeSinceRestart: new Date(),
          error,
        }))
      );
  };
  const downloadUpdate = () => {
    downloadUpdateAsync(callbacksRef.current).catch((error) => {
      setUpdatesState((updatesState) => ({
        ...updatesState,
        error,
      }));
    });
  };
  const runUpdate = () => {
    runUpdateAsync(callbacksRef.current).catch((error) => {
      setUpdatesState((updatesState) => ({
        ...updatesState,
        error,
      }));
    });
  };
  const readLogEntries = (maxAge: number = 3600000) => {
    Updates.readLogEntriesAsync(maxAge)
      .then((logEntries) =>
        setUpdatesState((updatesState) => ({
          ...updatesState,
          logEntries,
        }))
      )
      .catch((error) => setUpdatesState((updatesState) => ({ ...updatesState, error })));
  };
  // Return the updates info and the user facing functions
  return {
    currentlyRunning,
    ...updatesState,
    checkForUpdate,
    downloadUpdate,
    runUpdate,
    readLogEntries,
  };
};

export { useUpdates };
