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
 * Sets the app icon's badge count on iOS and web. Setting `0` clears the badge without dismissing notifications.
 *
 * On Android, setting a badge count independently of notifications is unsupported. Nonzero counts resolve
 * to `false`. Setting `0` dismisses the app's notifications and resolves to `true`.
 * See [App icon badges](#app-icon-badges) for launcher behavior.
 *
 * On iOS, this method resolves to `false` if badge permission is disabled. Request `allowBadge` through
 * [`requestPermissionsAsync`](#requestpermissionsasyncpermissions).
 * @param badgeCount The requested badge count.
 * @param options Options configuring badge behavior.
 * @return Whether the operation succeeded. This does not confirm that a badge is visible.
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
