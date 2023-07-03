import { createMachine, assign } from 'xstate';
export var UpdatesStateMachineEventTypes;
(function (UpdatesStateMachineEventTypes) {
    UpdatesStateMachineEventTypes["CHECK"] = "check";
    UpdatesStateMachineEventTypes["CHECK_COMPLETE_AVAILABLE"] = "checkCompleteAvailable";
    UpdatesStateMachineEventTypes["CHECK_COMPLETE_UNAVAILABLE"] = "checkCompleteUnavailable";
    UpdatesStateMachineEventTypes["CHECK_ERROR"] = "checkError";
    UpdatesStateMachineEventTypes["DOWNLOAD"] = "download";
    UpdatesStateMachineEventTypes["DOWNLOAD_COMPLETE"] = "downloadComplete";
    UpdatesStateMachineEventTypes["DOWNLOAD_ERROR"] = "downloadError";
    UpdatesStateMachineEventTypes["RESTART"] = "restart";
})(UpdatesStateMachineEventTypes || (UpdatesStateMachineEventTypes = {}));
/**
 * Actions that modify the context
 */
const checkCompleteAvailableAction = assign({
    latestManifest: (context, event) => event.body?.manifest || undefined,
    checkError: () => undefined,
    isChecking: () => false,
    isUpdateAvailable: () => true,
    isRollback: (context, event) => Boolean(event.body?.isRollBackToEmbedded),
});
const checkCompleteUnavailableAction = assign({
    latestManifest: () => undefined,
    checkError: () => undefined,
    isChecking: () => false,
    isUpdateAvailable: () => false,
    isRollback: () => false,
});
const checkErrorAction = assign({
    isChecking: () => false,
    checkError: (context, event) => new Error(event.body?.message || 'checkError'),
});
const downloadCompleteAction = assign({
    downloadedManifest: (context, event) => event.body?.manifest || context.downloadedManifest,
    latestManifest: (context, event) => event.body?.manifest || context.latestManifest,
    downloadError: () => undefined,
    isDownloading: () => false,
    isUpdatePending: (context, event) => !!(event.body?.manifest || context.downloadedManifest),
    isUpdateAvailable: (context, event) => event.body?.manifest !== undefined || context.isUpdateAvailable,
});
const downloadErrorAction = assign({
    downloadError: (context, event) => new Error(event.body?.message || 'downloadError'),
    isDownloading: () => false,
});
const check = assign({
    isChecking: (context) => true,
});
const download = assign({
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
        isRollback: false,
    },
    predictableActionArguments: true,
    states: {
        idle: {
            on: {
                check: {
                    target: 'checking',
                    actions: check,
                },
                download: {
                    target: 'downloading',
                    actions: download,
                },
                restart: {
                    target: 'restarting',
                },
            },
        },
        checking: {
            on: {
                checkCompleteAvailable: {
                    target: 'idle',
                    actions: [checkCompleteAvailableAction],
                },
                checkCompleteUnavailable: {
                    target: 'idle',
                    actions: [checkCompleteUnavailableAction],
                },
                checkError: {
                    target: 'idle',
                    actions: [checkErrorAction],
                },
            },
        },
        downloading: {
            on: {
                downloadComplete: {
                    target: 'idle',
                    actions: [downloadCompleteAction],
                },
                downloadError: {
                    target: 'idle',
                    actions: [downloadErrorAction],
                },
            },
        },
        restarting: {
            type: 'final',
        },
    },
});
//# sourceMappingURL=UpdatesStateMachine.js.map