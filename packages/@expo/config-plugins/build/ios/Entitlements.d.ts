import { ExpoConfig } from '@expo/config-types';
import { JSONObject } from '@expo/json-file';
import { ModPlatform } from '../Plugin.types';
export declare const withAssociatedDomains: import("../Plugin.types").ConfigPlugin;
export declare function setAssociatedDomains(config: ExpoConfig, { 'com.apple.developer.associated-domains': _, ...entitlementsPlist }: JSONObject): JSONObject;
export declare function getEntitlementsPath(projectRoot: string, platform: ModPlatform, { targetName, buildConfiguration, }?: {
    targetName?: string;
    buildConfiguration?: string;
}): string | null;
export declare function ensureApplicationTargetEntitlementsFileConfigured(projectRoot: string, platform: ModPlatform): void;
