export declare const withAssociatedDomains: import("..").ConfigPlugin;
export declare const setAssociatedDomains: (config: import("@expo/config-types").ExpoConfig, { "com.apple.developer.associated-domains": _, ...entitlementsPlist }: import("@expo/json-file").JSONObject) => import("@expo/json-file").JSONObject;
export declare const getEntitlementsPath: (projectRoot: string, { targetName, buildConfiguration, }?: {
    targetName?: string | undefined;
    buildConfiguration?: string | undefined;
}) => string | null;
export declare const ensureApplicationTargetEntitlementsFileConfigured: (projectRoot: string) => void;
