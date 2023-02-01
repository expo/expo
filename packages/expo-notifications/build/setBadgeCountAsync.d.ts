import { WebSetBadgeCountOptions } from './BadgeModule.types';
export interface SetBadgeCountOptions {
    /**
     * A configuration object described [in the `badgin` documentation](https://github.com/jaulz/badgin#options).
     */
    web?: WebSetBadgeCountOptions;
}
/**
 * Sets the badge of the app's icon to the specified number. Setting it to `0` clears the badge. On iOS, this method requires that you have requested
 * the user's permission for `allowBadge` via [`requestPermissionsAsync`](#notificationsrequestpermissionsasyncpermissions),
 * otherwise it will automatically return `false`.
 * > **Note:** Not all Android launchers support application badges. If the launcher does not support icon badges, the method will resolve to `false`.
 * @param badgeCount The count which should appear on the badge. A value of `0` will clear the badge.
 * @param options An object of options configuring behavior applied in Web environment.
 * @return It returns a Promise resolving to a boolean representing whether the setting of the badge succeeded.
 * @header badge
 */
export default function setBadgeCountAsync(badgeCount: number, options?: SetBadgeCountOptions): Promise<boolean>;
//# sourceMappingURL=setBadgeCountAsync.d.ts.map