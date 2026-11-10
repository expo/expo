import { UnavailabilityError, Platform } from 'expo';

import BadgeModule from './BadgeModule';
import type { WebSetBadgeCountOptions } from './BadgeModule.types';

export interface SetBadgeCountOptions {
  /**
   * A configuration object described [in the `badgin` documentation](https://github.com/jaulz/badgin#options).
   */
  web?: WebSetBadgeCountOptions;
}

/**
 * Sets the app icon's badge count on iOS and web. Setting the count to `0` clears the badge.
 *
 * On Android, setting an app icon's badge count independently of notifications is not supported.
 * This method resolves to `false` for nonzero counts. Setting the count to `0` dismisses the app's
 * notifications and resolves to `true`; it does not send a separate badge update to the launcher.
 * To associate a count with a notification, set `badge` in [`NotificationContentInput`](#notificationcontentinput).
 * The launcher and the user's notification settings determine whether a badge appears and how it is displayed.
 *
 * On iOS, badge permission must be enabled. Request `allowBadge` through
 * [`requestPermissionsAsync`](#notificationsrequestpermissionsasyncpermissions). This method resolves to `false`
 * if badge permission is disabled. Clearing the badge does not dismiss notifications on iOS.
 * @param badgeCount The requested badge count. A value of `0` clears the badge on iOS and web, and dismisses notifications on Android.
 * @param options An object of options configuring behavior applied.
 * @return A Promise resolving to whether the platform-specific operation succeeded. This does not confirm that a badge is visible.
 * @header badge
 */
export async function setBadgeCountAsync(
  badgeCount: number,
  options?: SetBadgeCountOptions
): Promise<boolean> {
  if (!BadgeModule.setBadgeCountAsync) {
    throw new UnavailabilityError('ExpoNotifications', 'setBadgeCountAsync');
  }
  const platformOptions = options?.[Platform.OS as keyof typeof options];
  return await BadgeModule.setBadgeCountAsync(badgeCount, platformOptions);
}
