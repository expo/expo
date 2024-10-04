import type { UseUpdatesReturnType } from './UseUpdates.types';
/**
 * Hook that obtains information on available updates and on the currently running update.
 *
 * @return the structures with information on currently running and available updates.
 *
 * @example
 * ```tsx UpdatesDemo.tsx
 * import { StatusBar } from 'expo-status-bar';
 * import * as Updates from 'expo-updates';
 * import { useEffect } from 'react';
 * import { Button, Text, View } from 'react-native';
 *
 * export default function UpdatesDemo() {
 *   const {
 *     currentlyRunning,
 *     isUpdateAvailable,
 *     isUpdatePending
 *   } = Updates.useUpdates();
 *
 *   useEffect(() => {
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
 *       <Button onPress={() => Updates.checkForUpdateAsync()} title="Check manually for updates" />
 *       {showDownloadButton ? (
 *         <Button onPress={() => Updates.fetchUpdateAsync()} title="Download and run update" />
 *       ) : null}
 *       <StatusBar style="auto" />
 *     </View>
 *   );
 * }
 * ```
 */
export declare const useUpdates: () => UseUpdatesReturnType;
//# sourceMappingURL=UseUpdates.d.ts.map