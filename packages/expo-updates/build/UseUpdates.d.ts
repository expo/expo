import type { UseUpdatesCallbacksType, UseUpdatesReturnType } from './UseUpdates.types';
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
declare const useUpdates: (callbacks?: UseUpdatesCallbacksType) => UseUpdatesReturnType;
export { useUpdates };
//# sourceMappingURL=UseUpdates.d.ts.map