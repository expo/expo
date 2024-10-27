import { useEffect, useState } from 'react';

import { addUpdatesStateChangeListener, latestContext } from './UpdatesEmitter';
import type { UseUpdatesReturnType } from './UseUpdates.types';
import { currentlyRunning, updatesStateFromContext } from './UseUpdatesUtils';
import type { UseUpdatesStateType } from './UseUpdatesUtils';

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
 *       // Update has successfully downloaded; apply it now
 *       Updates.reloadAsync();
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
export const useUpdates: () => UseUpdatesReturnType = () => {
  const [updatesState, setUpdatesState] = useState<UseUpdatesStateType>(latestContext);

  // Change the state based on native state machine context changes
  useEffect(() => {
    const subscription = addUpdatesStateChangeListener((event) => {
      setUpdatesState(updatesStateFromContext(event.context));
    });
    return () => subscription.remove();
  }, []);

  // Return the updates info and the user facing functions
  return {
    currentlyRunning,
    ...updatesState,
  };
};
