/**
 * Reloads the app.
 *
 * This function should work for both release and debug builds.
 *
 * Unlike the [`Updates.reloadAsync()`](https://docs.expo.dev/versions/latest/sdk/updates/#updatesreloadasync),
 * this function does not change the loading bundle. It only reloads with the same JavaScript bundle.
 *
 * @param reason The reason for reloading the app. This is used only for some platforms.
 */
export async function reloadAppAsync(reason = 'Reloaded from JS call') {
    await globalThis.expo?.reloadAppAsync(reason);
}
//# sourceMappingURL=reload.js.map