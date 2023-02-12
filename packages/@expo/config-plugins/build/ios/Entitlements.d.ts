import { ExpoConfig } from '@expo/config-types';
import { JSONObject } from '@expo/json-file';
export declare const withAssociatedDomains: import("..").ConfigPlugin<void>;
export declare function setAssociatedDomains(config: ExpoConfig, { 'com.apple.developer.associated-domains': _, ...entitlementsPlist }: JSONObject): JSONObject;
export declare function getEntitlementsPath(projectRoot: string, { targetName, buildConfiguration, }?: {
    targetName?: string;
    buildConfiguration?: string;
}): string | null;
export declare function ensureApplicationTargetEntitlementsFileConfigured(projectRoot: string): void;
