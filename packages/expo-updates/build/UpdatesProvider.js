import React, { createContext, useContext, useState } from 'react';
import * as Updates from './Updates';
import { useUpdateEvents } from './UpdatesHooks';
import { currentlyRunning } from './UpdatesProviderConstants';
import { checkForUpdateAndReturnAvailableAsync, downloadUpdateAsync, downloadAndRunUpdateAsync, runUpdateAsync, updatesInfoFromEvent, } from './UpdatesProviderUtils';
// The context provided to the app
const UpdatesContext = createContext({
    updatesInfo: {
        currentlyRunning,
    },
    setUpdatesInfo: (_) => { },
});
/////// Provider and hook ///////////
/**
 * Provides the Updates React context. Includes an [`UpdateEvent`](#updateevent) listener
 * that will set the context automatically, if automatic updates are enabled and a new
 * update is available. This is required if application code uses the [`useUpdates`](#useupdatescallbacks) hook.
 *
 * @param props Context will be provided to `props.children`
 *
 * @return the provider.
 *
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
const UpdatesProvider = (props) => {
    const [updatesInfo, setUpdatesInfo] = useState({
        currentlyRunning,
    });
    // Set up listener for events from automatic update requests
    // that happen on startup, and use events to refresh the updates info
    // context
    useUpdateEvents((event) => {
        setUpdatesInfo(updatesInfoFromEvent(event));
    });
    return (React.createElement(UpdatesContext.Provider, { value: { updatesInfo, setUpdatesInfo } }, props.children));
};
/**
 * Hook that obtains the Updates info structure and functions. Requires that application code be inside an [`UpdatesProvider`](#updatesproviderprops).
 *
 * @param callbacks Optional set of callbacks that will be called when `checkForUpdate()`, `downloadUpdate()`, `downloadAndRunUpdate()`, or `runUpdate()`, start, complete, or have errors.
 *
 * @return the [`UpdatesInfo`](#updatesinfo) structure and associated methods. When using the provider, the methods returned by this hook should be used instead of [`checkForUpdateAsync`](#updatescheckforupdateasync), [`fetchUpdateAsync`](#updatesfetchupdateasync), [`readLogEntriesAsync`](#updatesreadlogentriesasync), and [`reloadAsync`](#updatesreloadasync).
 *
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
 *
 */
const useUpdates = (callbacks) => {
    // Get updates info value and setter from provider
    const { updatesInfo, setUpdatesInfo } = useContext(UpdatesContext);
    const checkForUpdate = () => {
        checkForUpdateAndReturnAvailableAsync(callbacks)
            .then((availableUpdate) => setUpdatesInfo((updatesInfo) => ({
            ...updatesInfo,
            lastCheckForUpdateTimeSinceRestart: new Date(),
            availableUpdate,
        })))
            .catch((error) => setUpdatesInfo((updatesInfo) => ({
            ...updatesInfo,
            lastCheckForUpdateTimeSinceRestart: new Date(),
            error,
        })));
    };
    const downloadAndRunUpdate = () => {
        downloadAndRunUpdateAsync(callbacks).catch((error) => {
            setUpdatesInfo((updatesInfo) => ({
                ...updatesInfo,
                error,
            }));
        });
    };
    const downloadUpdate = () => {
        downloadUpdateAsync(callbacks).catch((error) => {
            setUpdatesInfo((updatesInfo) => ({
                ...updatesInfo,
                error,
            }));
        });
    };
    const runUpdate = () => {
        runUpdateAsync(callbacks).catch((error) => {
            setUpdatesInfo((updatesInfo) => ({
                ...updatesInfo,
                error,
            }));
        });
    };
    const readLogEntries = (maxAge = 3600000) => {
        Updates.readLogEntriesAsync(maxAge)
            .then((logEntries) => setUpdatesInfo((updatesInfo) => ({
            ...updatesInfo,
            logEntries,
        })))
            .catch((error) => setUpdatesInfo((updatesInfo) => ({ ...updatesInfo, error })));
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
export { UpdatesProvider, useUpdates };
//# sourceMappingURL=UpdatesProvider.js.map