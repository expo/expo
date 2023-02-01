/**
 * Fetches the number currently set as the badge of the app icon on device's home screen. A `0` value means that the badge is not displayed.
 * > **Note:** Not all Android launchers support application badges. If the launcher does not support icon badges, the method will always resolve to `0`.
 * @return Returns a Promise resolving to a number that represents the current badge of the app icon.
 * @header badge
 */
export default function getBadgeCountAsync(): Promise<number>;
//# sourceMappingURL=getBadgeCountAsync.d.ts.map