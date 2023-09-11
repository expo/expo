export declare enum UpdatesStateMachineEventTypes {
    CHECK = "check",
    CHECK_COMPLETE_AVAILABLE = "checkCompleteAvailable",
    CHECK_COMPLETE_UNAVAILABLE = "checkCompleteUnavailable",
    CHECK_ERROR = "checkError",
    DOWNLOAD = "download",
    DOWNLOAD_COMPLETE = "downloadComplete",
    DOWNLOAD_ERROR = "downloadError",
    RESTART = "restart"
}
/**
 * Simplified model for an update manifest
 */
export type Manifest = {
    updateId: string;
};
/**
 * Model for an update event
 */
export type UpdatesStateMachineEvent = {
    type: UpdatesStateMachineEventTypes;
    body: {
        message?: string;
        manifest?: Manifest;
        isRollBackToEmbedded?: boolean;
    };
};
/**
 * The context structure
 */
export interface UpdatesStateMachineContext {
    isUpdateAvailable: boolean;
    isUpdatePending: boolean;
    latestManifest?: Manifest;
    isChecking: boolean;
    isDownloading: boolean;
    isRollback: boolean;
    downloadedManifest?: Manifest;
    checkError?: Error;
    downloadError?: Error;
}
/**
 * Model of the expo-updates state machine, written in Typescript.
 * The actual implementations of this state machine will be in Swift on iOS and Kotlin on Android.
 */
export declare const UpdatesStateMachine: import("xstate").StateMachine<UpdatesStateMachineContext, any, import("xstate").AnyEventObject, {
    value: any;
    context: UpdatesStateMachineContext;
}, import("xstate").BaseActionObject, import("xstate").ServiceMap, import("xstate").ResolveTypegenMeta<import("xstate").TypegenDisabled, import("xstate").AnyEventObject, import("xstate").BaseActionObject, import("xstate").ServiceMap>>;
//# sourceMappingURL=UpdatesStateMachine.d.ts.map