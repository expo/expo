import { createMachine, assign } from 'xstate';
/**
 * Actions that modify the context
 */
const newManifestOnServer = assign({
    latestUpdateId: (context, event) => event.updateId || (context?.latestUpdateId || 0) + 1,
    checkError: () => undefined,
    isChecking: () => false,
    isUpdateAvailable: () => true,
});
const sameManifestOnServer = assign({
    latestUpdateId: (context) => context?.latestUpdateId || 0,
    checkError: () => undefined,
    isChecking: () => false,
    isUpdateAvailable: () => true,
});
const manifestDownloaded = assign({
    downloadedUpdateId: (context, event) => event.updateId || context?.latestUpdateId || 0,
    downloadError: () => undefined,
    isDownloading: () => false,
    isUpdatePending: () => true,
});
const noManifestOnServer = assign({
    latestUpdateId: (context) => undefined,
    checkError: () => undefined,
    isChecking: () => false,
    isUpdateAvailable: () => false,
});
const checkErrorOccurred = assign({
    checkError: () => new Error('checkError'),
    isChecking: () => false,
});
const downloadErrorOccurred = assign({
    downloadError: () => new Error('downloadError'),
    isDownloading: () => false,
});
const checkNow = assign({
    isChecking: (context) => true,
});
const downloadNow = assign({
    isDownloading: (context) => true,
});
/**
 * Model of the expo-updates state machine, written in Typescript.
 * The actual implementations of this state machine will be in Swift on iOS and Kotlin on Android.
 */
export const UpdatesStateMachine = createMachine({
    id: 'Updates',
    initial: 'idle',
    context: {
        isChecking: false,
        isDownloading: false,
        isUpdateAvailable: false,
        isUpdatePending: false,
    },
    predictableActionArguments: true,
    states: {
        idle: {
            on: {
                CHECK: {
                    target: 'checking',
                    actions: checkNow,
                },
                DOWNLOAD: {
                    target: 'downloading',
                    actions: downloadNow,
                },
                RESTART: {
                    target: 'restarting',
                },
            },
        },
        checking: {
            on: {
                CHECK_COMPLETE_AVAILABLE_NEW: {
                    target: 'idle',
                    actions: [newManifestOnServer],
                },
                CHECK_COMPLETE_AVAILABLE_UNCHANGED: {
                    target: 'idle',
                    actions: [sameManifestOnServer],
                },
                CHECK_COMPLETE_UNAVAILABLE: {
                    target: 'idle',
                    actions: [noManifestOnServer],
                },
                CHECK_ERROR: {
                    target: 'idle',
                    actions: [checkErrorOccurred],
                },
            },
        },
        downloading: {
            on: {
                DOWNLOAD_COMPLETE_NEW: {
                    target: 'idle',
                    actions: [newManifestOnServer, manifestDownloaded],
                },
                DOWNLOAD_COMPLETE_UNCHANGED: {
                    target: 'idle',
                    actions: [manifestDownloaded],
                },
                DOWNLOAD_ERROR: {
                    target: 'idle',
                    actions: [downloadErrorOccurred],
                },
            },
        },
        restarting: {
            type: 'final',
        },
    },
});
//# sourceMappingURL=UpdatesStateMachine.js.map