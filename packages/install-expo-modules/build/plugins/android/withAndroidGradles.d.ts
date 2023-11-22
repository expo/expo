import { ConfigPlugin } from '@expo/config-plugins';
export declare function shouldUpdateAgpVersionAsync(projectRoot: string, targetVersion: string): Promise<boolean>;
export declare const withAndroidGradlePluginVersion: ConfigPlugin<{
    androidAgpVersion: string;
}>;
