/**
 * Reloads the app.
 * @param reason The reason for reloading the app. This is used only for some platforms.
 */
export async function reloadAsync(reason: string = 'Reloaded from JS call'): Promise<void> {
  await globalThis.expo?.reloadAsync(reason);
}
