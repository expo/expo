import type { UpdatesInfo, UpdatesProviderCallbacksType } from './UpdatesProvider.types';
/**
 * Downloads and runs an update, if one is available.
 * Provided to application code from the [`useUpdates`](#useupdatesprovidereventhandler) hook.
 */
declare const downloadAndRunUpdate: () => never;
/**
 * Downloads an update, if one is available, using `Updates.fetchUpdateAsync()`.
 * Provided to application code from the [`useUpdates`](#useupdatesprovidereventhandler) hook.
 */
declare const downloadUpdate: () => never;
/**
 * Runs an update by calling `Updates.reloadAsync()`. This should not be called unless there is an available update
 * that has already been successfully downloaded using [`downloadUpdate()`](#downloadupdate).
 * Provided to application code from the [`useUpdates`](#useupdatesprovidereventhandler) hook.
 */
declare const runUpdate: () => never;
/**
 * Calls `Updates.checkForUpdateAsync()` and uses the passed in setter
 * to refresh the [`UpdatesInfo`](#updatesinfo).
 * Provided to application code from the [`useUpdates`](#useupdatesprovidereventhandler) hook.
 */
declare const checkForUpdate: () => never;
/**
 * Calls `Updates.readLogEntriesAsync()` and sets the `logEntries` property in the [`UpdatesInfo`](#updatesinfo) structure to the results.
 * Provided to application code from the [`useUpdates`](#useupdatesprovidereventhandler) hook.
 *
 * @param maxAge Sets the max age of retrieved log entries in milliseconds. Default to 3600000 ms (1 hour).
 */
declare const readLogEntries: (maxAge?: number) => never;
/**
 * Provides the Updates React context. Includes an [`UpdateEvent`](#updateevent) listener
 * that will set the context automatically, if automatic updates are enabled and a new
 * update is available. This is required if application code uses the [`useUpdates`](#useupdatesprovidereventhandler) hook.
 * @param props Context will be provided to `props.children`
 * @return the provider.
 * @example
 * ```jsx App.tsx
 * import * as Updates from 'expo-updates';
 *
 * const { UpdatesProvider } = Updates.Provider;
 *
 * import UpdatesDemo from './src/UpdatesDemo';
 *
 * export default function App() {
 *   return (
 *     <UpdatesProvider>
 *       <UpdatesDemo />
 *     </UpdatesProvider>
 *   );
 * }
 * ```
 */
declare const UpdatesProvider: (props: {
    children: any;
}) => JSX.Element;
/**
 * Hook that obtains the Updates info structure and functions.
 * Requires that application code be inside an [`UpdatesProvider`](#updatesproviderprops).
 * @param callbacks Optional set of callbacks that will be called when Updates.Provider methods [`checkForUpdate()`](#checkforupdate), [`downloadUpdate()`](#downloadupdate), [`runUpdate()](#runupdate), or [`downloadAndRunUpdate()`](#downloadandrunupdate) start, complete, or have errors.
 * @return the [`UpdatesInfo`](#updatesinfo) structure and associated methods. When using the provider, the methods returned by this hook should be used instead of [`checkForUpdateAsync`](#updatescheckforupdateasync), [`fetchUpdateAsync`](#updatesfetchupdateasync), [`readLogEntriesAsync`](#updatesreadlogentriesasync), and [`reloadAsync`](#updatesreloadasync).
 * @example
 * ```jsx UpdatesDemo.tsx
 * import { StatusBar } from 'expo-status-bar';
 * import React from 'react';
 * import { Pressable, Text, View } from 'react-native';
 * import * as Updates from 'expo-updates';
 *
 * const { useUpdates } = Updates.Provider;
 *
 * export default function UpdatesDemo() {
 *   const { updatesInfo, checkForUpdate, downloadAndRunUpdate } = useUpdates();
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
 */
declare const useUpdates: (callbacks?: UpdatesProviderCallbacksType) => {
    updatesInfo: UpdatesInfo;
    checkForUpdate: () => void;
    downloadAndRunUpdate: () => void;
    downloadUpdate: () => void;
    runUpdate: () => void;
    readLogEntries: (maxAge?: number) => void;
};
export { UpdatesProvider, useUpdates, checkForUpdate, downloadUpdate, downloadAndRunUpdate, runUpdate, readLogEntries, };
//# sourceMappingURL=UpdatesProvider.d.ts.map