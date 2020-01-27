import { ProxyNativeModule } from '@unimodules/core';
export declare type SetBadgeCountOptions = undefined;
export interface BadgeModule extends ProxyNativeModule {
    getBadgeCountAsync: () => Promise<number>;
    setBadgeCountAsync: (badgeCount: number, options: SetBadgeCountOptions) => Promise<boolean>;
}
