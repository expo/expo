/**
 * Reloads the app.
 *
 * This function works for both release and debug builds.
 *
 * Unlike [`Updates.reloadAsync()`](https://docs.expo.dev/versions/latest/sdk/updates/#updatesreloadasync),
 * this function does not use a new update even if one is available. It only reloads the app using the same JavaScript bundle that is currently running.
 *
 * @param reason The reason for reloading the app. This is used only for some platforms.
 */
export declare function reloadAppAsync(reason?: string): Promise<void>;
//# sourceMappingURL=reload.d.ts.map