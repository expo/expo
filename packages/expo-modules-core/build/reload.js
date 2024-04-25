/**
 * Reloads the app.
 * @param reason The reason for reloading the app. This is used only for some platforms.
 */
export async function reloadAppAsync(reason = 'Reloaded from JS call') {
    await globalThis.expo?.reloadAppAsync(reason);
}
//# sourceMappingURL=reload.js.map