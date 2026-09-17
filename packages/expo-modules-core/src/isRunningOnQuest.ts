/**
 * Returns whether the app is running on a Meta Quest device.
 * Always returns `false` on iOS and web.
 */
export function isRunningOnQuest(): boolean {
  return globalThis.expo?.isRunningOnQuest?.() ?? false;
}
