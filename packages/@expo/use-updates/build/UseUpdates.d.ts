import type { UseUpdatesCallbacksType, UseUpdatesReturnType } from './UseUpdates.types';
/**
 * Hook that obtains the Updates info structure and functions.
 *
 * @param callbacks Optional set of callbacks that will be called when `checkForUpdate()`, `downloadUpdate()`, `downloadAndRunUpdate()`, or `runUpdate()`, start, complete, or have errors.
 *
 * @return the structures with information on currently running and available updates, and associated methods.
 * When using this hook, the methods returned should be used instead of `expo-updates` methods (
 * [`checkForUpdateAsync()`](https://docs.expo.dev/versions/latest/sdk/updates/#updatescheckforupdateasync),
 * [`fetchUpdateAsync()`](https://docs.expo.dev/versions/latest/sdk/updates/#updatesfetchupdateasync)),
 * [`reloadAsync()`](https://docs.expo.dev/versions/latest/sdk/updates/#updatesreloadasync))).
 *
 * @example
 * ```tsx UpdatesDemo.tsx
 * import { StatusBar } from 'expo-status-bar';
 * import React from 'react';
 * import { Pressable, Text, View } from 'react-native';
 *
 * import { useUpdates } from '@expo/use-updates';
 *
 * export default function UpdatesDemo() {
 *   const callback: UseUpdatesCallbacksType = {
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
declare const useUpdates: (callbacks?: UseUpdatesCallbacksType) => UseUpdatesReturnType;
export { useUpdates };
//# sourceMappingURL=UseUpdates.d.ts.map