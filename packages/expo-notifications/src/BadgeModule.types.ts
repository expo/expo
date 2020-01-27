import { ProxyNativeModule } from '@unimodules/core';

export type SetBadgeCountOptions = undefined;

export interface BadgeModule extends ProxyNativeModule {
  getBadgeCountAsync: () => Promise<number>;
  setBadgeCountAsync: (badgeCount: number, options: SetBadgeCountOptions) => Promise<boolean>;
}
