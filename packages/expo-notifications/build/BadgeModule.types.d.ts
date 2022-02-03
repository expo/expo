import { Options as BadginOptions } from 'badgin';
import { ProxyNativeModule } from 'expo-modules-core';
export declare type WebSetBadgeCountOptions = BadginOptions;
declare type SetBadgeCountOptions = WebSetBadgeCountOptions | undefined;
export interface BadgeModule extends ProxyNativeModule {
    getBadgeCountAsync?: () => Promise<number>;
    setBadgeCountAsync?: (badgeCount: number, options: SetBadgeCountOptions) => Promise<boolean>;
}
export {};
//# sourceMappingURL=BadgeModule.types.d.ts.map