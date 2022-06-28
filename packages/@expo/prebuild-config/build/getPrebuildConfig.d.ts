import { getConfig } from '@expo/config';
import { ModPlatform } from '@expo/config-plugins';
import { ExpoConfig } from '@expo/config-types';
export declare function getPrebuildConfigAsync(projectRoot: string, props: {
    bundleIdentifier?: string;
    packageName?: string;
    platforms: ModPlatform[];
    expoUsername?: string | ((config: ExpoConfig) => string | null);
}): Promise<ReturnType<typeof getConfig>>;
