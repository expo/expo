/// <reference types="xcode" />
export declare const withMacosBaseMods: (config: import("..").ExportedConfig, { providers, ...props }?: Partial<Pick<import("./withMod").BaseModOptions, "skipEmptyMod" | "saveToInternal">> & {
    providers?: Partial<{
        dangerous: import("./createBaseMod").BaseModProviderMethods<unknown, Partial<Pick<import("./withMod").BaseModOptions, "skipEmptyMod" | "saveToInternal">>>;
        finalized: import("./createBaseMod").BaseModProviderMethods<unknown, Partial<Pick<import("./withMod").BaseModOptions, "skipEmptyMod" | "saveToInternal">>>;
        appDelegate: import("./createBaseMod").BaseModProviderMethods<import("../apple/Paths").AppDelegateProjectFile, Partial<Pick<import("./withMod").BaseModOptions, "skipEmptyMod" | "saveToInternal">>>;
        expoPlist: import("./createBaseMod").BaseModProviderMethods<import("@expo/json-file").JSONObject, Partial<Pick<import("./withMod").BaseModOptions, "skipEmptyMod" | "saveToInternal">>>;
        xcodeproj: import("./createBaseMod").BaseModProviderMethods<import("xcode").XcodeProject, Partial<Pick<import("./withMod").BaseModOptions, "skipEmptyMod" | "saveToInternal">>>;
        infoPlist: import("./createBaseMod").BaseModProviderMethods<import("..").InfoPlist, Partial<Pick<import("./withMod").BaseModOptions, "skipEmptyMod" | "saveToInternal">>>;
        entitlements: import("./createBaseMod").BaseModProviderMethods<import("@expo/json-file").JSONObject, Partial<Pick<import("./withMod").BaseModOptions, "skipEmptyMod" | "saveToInternal">>>;
        podfile: import("./createBaseMod").BaseModProviderMethods<import("../apple/Paths").PodfileProjectFile, Partial<Pick<import("./withMod").BaseModOptions, "skipEmptyMod" | "saveToInternal">>>;
        podfileProperties: import("./createBaseMod").BaseModProviderMethods<Record<string, import("@expo/json-file").JSONValue>, Partial<Pick<import("./withMod").BaseModOptions, "skipEmptyMod" | "saveToInternal">>>;
    }> | undefined;
}) => import("..").ExportedConfig;
export declare const getMacosModFileProviders: {
    dangerous: import("./createBaseMod").BaseModProviderMethods<unknown, Partial<Pick<import("./withMod").BaseModOptions, "skipEmptyMod" | "saveToInternal">>>;
    finalized: import("./createBaseMod").BaseModProviderMethods<unknown, Partial<Pick<import("./withMod").BaseModOptions, "skipEmptyMod" | "saveToInternal">>>;
    appDelegate: import("./createBaseMod").BaseModProviderMethods<import("../apple/Paths").AppDelegateProjectFile, Partial<Pick<import("./withMod").BaseModOptions, "skipEmptyMod" | "saveToInternal">>>;
    expoPlist: import("./createBaseMod").BaseModProviderMethods<import("@expo/json-file").JSONObject, Partial<Pick<import("./withMod").BaseModOptions, "skipEmptyMod" | "saveToInternal">>>;
    xcodeproj: import("./createBaseMod").BaseModProviderMethods<import("xcode").XcodeProject, Partial<Pick<import("./withMod").BaseModOptions, "skipEmptyMod" | "saveToInternal">>>;
    infoPlist: import("./createBaseMod").BaseModProviderMethods<import("..").InfoPlist, Partial<Pick<import("./withMod").BaseModOptions, "skipEmptyMod" | "saveToInternal">>>;
    entitlements: import("./createBaseMod").BaseModProviderMethods<import("@expo/json-file").JSONObject, Partial<Pick<import("./withMod").BaseModOptions, "skipEmptyMod" | "saveToInternal">>>;
    podfile: import("./createBaseMod").BaseModProviderMethods<import("../apple/Paths").PodfileProjectFile, Partial<Pick<import("./withMod").BaseModOptions, "skipEmptyMod" | "saveToInternal">>>;
    podfileProperties: import("./createBaseMod").BaseModProviderMethods<Record<string, import("@expo/json-file").JSONValue>, Partial<Pick<import("./withMod").BaseModOptions, "skipEmptyMod" | "saveToInternal">>>;
};
