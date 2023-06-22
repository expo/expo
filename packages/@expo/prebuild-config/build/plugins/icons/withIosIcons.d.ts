import { ConfigPlugin } from '@expo/config-plugins';
import { ExpoConfig } from '@expo/config-types';
import { ContentsJson } from './AssetContents';
export declare const withIosIcons: ConfigPlugin;
export declare function getIcons(config: Pick<ExpoConfig, 'icon' | 'ios'>): string | null;
export declare function setIconsAsync(config: ExpoConfig, projectRoot: string): Promise<void>;
export declare function generateUniversalIconAsync(projectRoot: string, { icon, cacheKey, iosNamedProjectRoot, platform, }: {
    platform: 'watchos' | 'ios';
    icon: string;
    iosNamedProjectRoot: string;
    cacheKey: string;
}): Promise<ContentsJson['images']>;
