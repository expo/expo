import { ExpoConfig } from '@expo/config-types';
import { JSONObject } from '@expo/json-file';
export declare const withAssociatedDomains: (applePlatform: 'ios' | 'macos') => import("..").ConfigPlugin;
export declare const setAssociatedDomains: (applePlatform: 'ios' | 'macos') => (config: ExpoConfig, { "com.apple.developer.associated-domains": _, ...entitlementsPlist }: JSONObject) => JSONObject;
export declare const getEntitlementsPath: (applePlatform: 'ios' | 'macos') => (projectRoot: string, { targetName, buildConfiguration, }?: {
    targetName?: string | undefined;
    buildConfiguration?: string | undefined;
}) => string | null;
export declare const ensureApplicationTargetEntitlementsFileConfigured: (applePlatform: 'ios' | 'macos') => (projectRoot: string) => void;
