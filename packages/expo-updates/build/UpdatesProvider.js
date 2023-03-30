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
///////////// Exported functions /////////////
/**
 * Downloads and runs an update, if one is available.
 * Provided to application code from the [`useUpdates`](#useupdatesprovidereventhandler) hook.
 */
const downloadAndRunUpdate = () => {
    throw new Error('This error occurs when an application directly imports this method from the module. To use this method, it must be provided by the useUpdates() hook.');
};
/**
 * Downloads an update, if one is available, using `Updates.fetchUpdateAsync()`.
 * Provided to application code from the [`useUpdates`](#useupdatesprovidereventhandler) hook.
 */
const downloadUpdate = () => {
    throw new Error('This error occurs when an application directly imports this method from the module. To use this method, it must be provided by the useUpdates() hook.');
};
/**
 * Runs an update by calling `Updates.reloadAsync()`. This should not be called unless there is an available update
 * that has already been successfully downloaded using [`downloadUpdate()`](#downloadupdate).
 * Provided to application code from the [`useUpdates`](#useupdatesprovidereventhandler) hook.
 */
const runUpdate = () => {
    throw new Error('This error occurs when an application directly imports this method from the module. To use this method, it must be provided by the useUpdates() hook.');
};
/**
 * Calls `Updates.checkForUpdateAsync()` and uses the passed in setter
 * to refresh the [`UpdatesInfo`](#updatesinfo).
 * Provided to application code from the [`useUpdates`](#useupdatesprovidereventhandler) hook.
 */
const checkForUpdate = () => {
    throw new Error('This error occurs when an application directly imports this method from the module. To use this method, it must be provided by the useUpdates() hook.');
};
/**
 * Calls `Updates.readLogEntriesAsync()` and sets the `logEntries` property in the [`UpdatesInfo`](#updatesinfo) structure to the results.
 * Provided to application code from the [`useUpdates`](#useupdatesprovidereventhandler) hook.
 *
 * @param maxAge Sets the max age of retrieved log entries in milliseconds. Default to 3600000 ms (1 hour).
 */
const readLogEntries = (maxAge) => {
    throw new Error('This error occurs when an application directly imports this method from the module. To use this method, it must be provided by the useUpdates() hook.');
};
/////// Provider and hook ///////////
/**
 * Provides the Updates React context. Includes an [`UpdateEvent`](#updateevent) listener
 * that will set the context automatically, if automatic updates are enabled and a new
 * update is available. This is required if application code uses the [`useUpdates`](#useupdatesprovidereventhandler) hook.
 * @param props Context will be provided to `props.children`
 * @returns the provider.
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
 * Hook that obtains the Updates info structure and functions.
 * Requires that application code be inside an [`UpdatesProvider`](#updatesproviderprops).
 * @param providerEventHandler Optional handler. If present, the handler will be called on
 * start, completion, and error in checkForUpdate, downloadUpdate, and downloadAndRunUpdate methods.
 * download starts, and again when download completes (successfully or not).
 * @returns the [`UpdatesInfo`](#updatesinfo) structure and associated methods. When using the provider,
 * the methods returned by this hook should be used instead of [`checkForUpdateAsync`](#updatescheckforupdateasync),
 * [`fetchUpdateAsync`](#updatesfetchupdateasync), [`readLogEntriesAsync`](#updatesreadlogentriesasync),
 * and [`reloadAsync`](#updatesreloadasync).
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
const useUpdates = (providerEventHandler) => {
    // Get updates info value and setter from provider
    const { updatesInfo, setUpdatesInfo } = useContext(UpdatesContext);
    const checkForUpdate = () => {
        checkForUpdateAndReturnAvailableAsync(providerEventHandler)
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
        downloadAndRunUpdateAsync(providerEventHandler).catch((error) => {
            setUpdatesInfo((updatesInfo) => ({
                ...updatesInfo,
                error,
            }));
        });
    };
    const downloadUpdate = () => {
        downloadUpdateAsync(providerEventHandler).catch((error) => {
            setUpdatesInfo((updatesInfo) => ({
                ...updatesInfo,
                error,
            }));
        });
    };
    const runUpdate = () => {
        runUpdateAsync(providerEventHandler).catch((error) => {
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
export { UpdatesProvider, useUpdates, checkForUpdate, downloadUpdate, downloadAndRunUpdate, runUpdate, readLogEntries, };
//# sourceMappingURL=UpdatesProvider.js.map