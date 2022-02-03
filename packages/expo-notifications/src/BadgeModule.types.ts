import { Options as BadginOptions } from 'badgin';
import { ProxyNativeModule } from 'expo-modules-core';

export type WebSetBadgeCountOptions = BadginOptions;
type SetBadgeCountOptions = WebSetBadgeCountOptions | undefined;

export interface BadgeModule extends ProxyNativeModule {
  getBadgeCountAsync?: () => Promise<number>;
  setBadgeCountAsync?: (badgeCount: number, options: SetBadgeCountOptions) => Promise<boolean>;
}
