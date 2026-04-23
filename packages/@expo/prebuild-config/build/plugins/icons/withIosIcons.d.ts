import type { ConfigPlugin } from '@expo/config-plugins';
import type { ExpoConfig, IOSIcons } from '@expo/config-types';
import type { ContentsJsonImage } from './AssetContents';
export declare const withIosIcons: ConfigPlugin;
export declare function getIcons(config: Pick<ExpoConfig, 'icon' | 'ios'>): IOSIcons | string | null;
export declare function setIconsAsync(config: ExpoConfig, projectRoot: string): Promise<void>;
export declare function generateUniversalIconAsync(projectRoot: string, { icon, cacheKey, iosNamedProjectRoot, platform, appearance, }: {
    platform: 'watchos' | 'ios';
    icon?: string | null;
    appearance?: 'dark' | 'tinted';
    iosNamedProjectRoot: string;
    cacheKey: string;
}): Promise<ContentsJsonImage>;
