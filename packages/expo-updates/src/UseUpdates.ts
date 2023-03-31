import { useEffect, useRef, useState } from 'react';

import * as Updates from './Updates';
import { useUpdateEvents } from './UpdatesHooks';
import type {
  UpdatesInfo,
  UseUpdatesCallbacksType,
  UseUpdatesReturnType,
} from './UseUpdates.types';
import { currentlyRunning } from './UseUpdatesConstants';
import {
  checkForUpdateAndReturnAvailableAsync,
  downloadUpdateAsync,
  downloadAndRunUpdateAsync,
  runUpdateAsync,
  updatesInfoFromEvent,
} from './UseUpdatesUtils';

/**
 * Hook that obtains the Updates info structure and functions.
 *
 * @param callbacks Optional set of callbacks that will be called when `checkForUpdate()`, `downloadUpdate()`, `downloadAndRunUpdate()`, or `runUpdate()`, start, complete, or have errors.
 *
 * @return the [`UpdatesInfo`](#updatesinfo) structure and associated methods. When using this hook, the methods returned should be used instead of [`checkForUpdateAsync`](#updatescheckforupdateasync), [`fetchUpdateAsync`](#updatesfetchupdateasync), [`readLogEntriesAsync`](#updatesreadlogentriesasync), and [`reloadAsync`](#updatesreloadasync).
 *
 * @example
 * ```jsx UpdatesDemo.tsx
 * import { StatusBar } from 'expo-status-bar';
 * import React from 'react';
 * import { Pressable, Text, View } from 'react-native';
 * import * as Updates from 'expo-updates';
 *
 * export default function UpdatesDemo() {
 *   const { updatesInfo, checkForUpdate, downloadAndRunUpdate } = Updates.useUpdates();
 *
 *   const { currentlyRunning, availableUpdate } = updatesInfo;
 *
 *   // If true, we show the button to download and run the update
 *   const showDownloadButton = availableUpdate !== undefined;
 *
 *   // Show whether or not we are running embedded code or an update
 *   const runTypeMessage = updatesInfo.currentlyRunning.isEmbeddedLaunch
 *     ? 'This app is running from built-in code'
 *     : 'This app is running an update';
 *
 *   return (
 *     <View style={styles.container}>
 *       <Text style={styles.headerText}>Updates Demo</Text>
 *       <Text>{runTypeMessage}</Text>
 *       <Button pressHandler={checkForUpdate} text="Check manually for updates" />
 *       {showDownloadButton ? (
 *         <Button pressHandler={downloadAndRunUpdate} text="Download and run update" />
 *       ) : null}
 *       <StatusBar style="auto" />
 *     </View>
 *   );
 * }
 *
 */
const useUpdates: (callbacks?: UseUpdatesCallbacksType) => UseUpdatesReturnType = (callbacks) => {
  const [updatesInfo, setUpdatesInfo] = useState({
    currentlyRunning,
  });

  const callbacksRef = useRef<UseUpdatesCallbacksType | undefined>();

  useEffect(() => {
    callbacksRef.current = callbacks;
  }, [callbacks]);

  // Set up listener for events from automatic update requests
  // that happen on startup, and use events to refresh the updates info
  // context
  useUpdateEvents((event) => {
    setUpdatesInfo((updatesInfo: UpdatesInfo) => updatesInfoFromEvent(updatesInfo, event));
  });

  const checkForUpdate = () => {
    checkForUpdateAndReturnAvailableAsync(callbacksRef.current)
      .then((availableUpdate) =>
        setUpdatesInfo((updatesInfo: UpdatesInfo) => ({
          ...updatesInfo,
          lastCheckForUpdateTimeSinceRestart: new Date(),
          availableUpdate,
        }))
      )
      .catch((error) =>
        setUpdatesInfo((updatesInfo: UpdatesInfo) => ({
          ...updatesInfo,
          lastCheckForUpdateTimeSinceRestart: new Date(),
          error,
        }))
      );
  };
  const downloadAndRunUpdate = () => {
    downloadAndRunUpdateAsync(callbacksRef.current).catch((error) => {
      setUpdatesInfo((updatesInfo: UpdatesInfo) => ({
        ...updatesInfo,
        error,
      }));
    });
  };
  const downloadUpdate = () => {
    downloadUpdateAsync(callbacksRef.current).catch((error) => {
      setUpdatesInfo((updatesInfo: UpdatesInfo) => ({
        ...updatesInfo,
        error,
      }));
    });
  };
  const runUpdate = () => {
    runUpdateAsync(callbacksRef.current).catch((error) => {
      setUpdatesInfo((updatesInfo: UpdatesInfo) => ({
        ...updatesInfo,
        error,
      }));
    });
  };
  const readLogEntries = (maxAge: number = 3600000) => {
    Updates.readLogEntriesAsync(maxAge)
      .then((logEntries) =>
        setUpdatesInfo((updatesInfo: UpdatesInfo) => ({
          ...updatesInfo,
          logEntries,
        }))
      )
      .catch((error) => setUpdatesInfo((updatesInfo: UpdatesInfo) => ({ ...updatesInfo, error })));
  };
  // Return the updates info and the user facing functions
  return {
    updatesInfo,
    checkForUpdate,
    downloadAndRunUpdate,
    downloadUpdate,
    runUpdate,
    readLogEntries,
  };
};

export { useUpdates };
