import { ExpoConfig } from '@expo/config-types';
import { JSONObject } from '@expo/json-file';
export declare const withAssociatedDomains: (applePlatform: 'ios' | 'macos') => import("..").ConfigPlugin;
export declare function setAssociatedDomains(applePlatform: 'ios' | 'macos', config: ExpoConfig, { 'com.apple.developer.associated-domains': _, ...entitlementsPlist }: JSONObject): JSONObject;
export declare function getEntitlementsPath(projectRoot: string, applePlatform: 'ios' | 'macos', { targetName, buildConfiguration, }?: {
    targetName?: string;
    buildConfiguration?: string;
}): string | null;
export declare function ensureApplicationTargetEntitlementsFileConfigured(projectRoot: string, applePlatform: 'ios' | 'macos'): void;
