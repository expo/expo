/**
 * The context structure (analogous to what is exposed in @expo/use-updates)
 */
export interface UpdatesContext {
    isUpdateAvailable: boolean;
    isUpdatePending: boolean;
    latestUpdateId?: number;
    isChecking: boolean;
    isDownloading: boolean;
    downloadedUpdateId?: number;
    checkError?: Error;
    downloadError?: Error;
}
/**
 * Model of the expo-updates state machine, written in Typescript.
 * The actual implementations of this state machine will be in Swift on iOS and Kotlin on Android.
 */
export declare const UpdatesStateMachine: import("xstate").StateMachine<UpdatesContext, any, import("xstate").AnyEventObject, {
    value: any;
    context: UpdatesContext;
}, import("xstate").BaseActionObject, import("xstate").ServiceMap, import("xstate").ResolveTypegenMeta<import("xstate").TypegenDisabled, import("xstate").AnyEventObject, import("xstate").BaseActionObject, import("xstate").ServiceMap>>;
//# sourceMappingURL=UpdatesStateMachine.d.ts.map