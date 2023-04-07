import { UseUpdatesReturnType, UseUpdatesEvent } from './UseUpdates.types';
/**
 * Calls `Updates.checkForUpdateAsync()` and refreshes the `availableUpdate` property with the result.
 * If an error occurs, the `error` property will be set.
 */
export declare const checkForUpdate: () => void;
/**
 * Downloads an update, if one is available, using `Updates.fetchUpdateAsync()`.
 * If an error occurs, the `error` property will be set.
 */
export declare const downloadUpdate: () => void;
/**
 * Runs an update by calling `Updates.reloadAsync()`. This should not be called unless there is an available update
 * that has already been successfully downloaded using `downloadUpdate()`.
 * If an error occurs, the `error` property will be set.
 */
export declare const runUpdate: () => void;
/**
 * Calls `Updates.readLogEntriesAsync()` and sets the `logEntries` property to the results.
 * If an error occurs, the `error` property will be set.
 *
 * @param maxAge Max age of log entries to read, in ms. Defaults to 3600000 (1 hour).
 */
export declare const readLogEntries: (maxAge?: number) => void;
/**
 * Hook that obtains information on available updates and on the currently running update.
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
 * } from '@expo/use-updates';
 *
 * export default function UpdatesDemo() {
 *   const { currentlyRunning, availableUpdate, isUpdateAvailable, isUpdatePending } = useUpdates();
 *
 *   React.useEffect(() => {
 *     if (isUpdatePending) {
 *       // Update has successfully downloaded
 *       runUpdate();
 *     }
 *   }, [isUpdatePending]);
 *
 *   // If true, we show the button to download and run the update
 *   const showDownloadButton = isUpdateAvailable;
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
export declare const useUpdates: (eventListener?: (event: UseUpdatesEvent) => void) => UseUpdatesReturnType;
//# sourceMappingURL=UseUpdates.d.ts.map