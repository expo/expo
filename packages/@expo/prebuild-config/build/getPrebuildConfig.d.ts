import { getConfig } from '@expo/config';
import { ModPlatform } from '@expo/config-plugins';
export declare function getPrebuildConfigAsync(projectRoot: string, props: {
    bundleIdentifier?: string;
    packageName?: string;
    platforms: ModPlatform[];
}): Promise<ReturnType<typeof getConfig>>;
