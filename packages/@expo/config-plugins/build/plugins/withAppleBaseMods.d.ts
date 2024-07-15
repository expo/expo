import { JSONObject, JSONValue } from '@expo/json-file';
import xcode from 'xcode';
import { ForwardedBaseModOptions } from './createBaseMod';
import type { ExportedConfig } from '../Plugin.types';
import { Paths } from '../apple';
import type { InfoPlist } from '../apple/AppleConfig.types';
declare const defaultProviders: (applePlatform: 'ios' | 'macos') => {
    dangerous: import("./createBaseMod").BaseModProviderMethods<unknown, Partial<Pick<import("./withMod").BaseModOptions, "skipEmptyMod" | "saveToInternal">>>;
    finalized: import("./createBaseMod").BaseModProviderMethods<unknown, Partial<Pick<import("./withMod").BaseModOptions, "skipEmptyMod" | "saveToInternal">>>;
    appDelegate: import("./createBaseMod").BaseModProviderMethods<Paths.AppDelegateProjectFile, Partial<Pick<import("./withMod").BaseModOptions, "skipEmptyMod" | "saveToInternal">>>;
    expoPlist: import("./createBaseMod").BaseModProviderMethods<JSONObject, Partial<Pick<import("./withMod").BaseModOptions, "skipEmptyMod" | "saveToInternal">>>;
    xcodeproj: import("./createBaseMod").BaseModProviderMethods<xcode.XcodeProject, Partial<Pick<import("./withMod").BaseModOptions, "skipEmptyMod" | "saveToInternal">>>;
    infoPlist: import("./createBaseMod").BaseModProviderMethods<InfoPlist, Partial<Pick<import("./withMod").BaseModOptions, "skipEmptyMod" | "saveToInternal">>>;
    entitlements: import("./createBaseMod").BaseModProviderMethods<JSONObject, Partial<Pick<import("./withMod").BaseModOptions, "skipEmptyMod" | "saveToInternal">>>;
    podfile: import("./createBaseMod").BaseModProviderMethods<Paths.PodfileProjectFile, Partial<Pick<import("./withMod").BaseModOptions, "skipEmptyMod" | "saveToInternal">>>;
    podfileProperties: import("./createBaseMod").BaseModProviderMethods<Record<string, JSONValue>, Partial<Pick<import("./withMod").BaseModOptions, "skipEmptyMod" | "saveToInternal">>>;
};
type AppleDefaultProviders = ReturnType<typeof defaultProviders>;
export declare const withAppleBaseMods: (applePlatform: 'ios' | 'macos') => (config: ExportedConfig, { providers, ...props }?: Partial<Pick<import("./withMod").BaseModOptions, "skipEmptyMod" | "saveToInternal">> & {
    providers?: Partial<{
        dangerous: import("./createBaseMod").BaseModProviderMethods<unknown, Partial<Pick<import("./withMod").BaseModOptions, "skipEmptyMod" | "saveToInternal">>>;
        finalized: import("./createBaseMod").BaseModProviderMethods<unknown, Partial<Pick<import("./withMod").BaseModOptions, "skipEmptyMod" | "saveToInternal">>>;
        appDelegate: import("./createBaseMod").BaseModProviderMethods<Paths.AppDelegateProjectFile, Partial<Pick<import("./withMod").BaseModOptions, "skipEmptyMod" | "saveToInternal">>>;
        expoPlist: import("./createBaseMod").BaseModProviderMethods<JSONObject, Partial<Pick<import("./withMod").BaseModOptions, "skipEmptyMod" | "saveToInternal">>>;
        xcodeproj: import("./createBaseMod").BaseModProviderMethods<xcode.XcodeProject, Partial<Pick<import("./withMod").BaseModOptions, "skipEmptyMod" | "saveToInternal">>>;
        infoPlist: import("./createBaseMod").BaseModProviderMethods<InfoPlist, Partial<Pick<import("./withMod").BaseModOptions, "skipEmptyMod" | "saveToInternal">>>;
        entitlements: import("./createBaseMod").BaseModProviderMethods<JSONObject, Partial<Pick<import("./withMod").BaseModOptions, "skipEmptyMod" | "saveToInternal">>>;
        podfile: import("./createBaseMod").BaseModProviderMethods<Paths.PodfileProjectFile, Partial<Pick<import("./withMod").BaseModOptions, "skipEmptyMod" | "saveToInternal">>>;
        podfileProperties: import("./createBaseMod").BaseModProviderMethods<Record<string, JSONValue>, Partial<Pick<import("./withMod").BaseModOptions, "skipEmptyMod" | "saveToInternal">>>;
    }> | undefined;
}) => ExportedConfig;
export declare const getAppleModFileProviders: (applePlatform: 'ios' | 'macos') => {
    dangerous: import("./createBaseMod").BaseModProviderMethods<unknown, Partial<Pick<import("./withMod").BaseModOptions, "skipEmptyMod" | "saveToInternal">>>;
    finalized: import("./createBaseMod").BaseModProviderMethods<unknown, Partial<Pick<import("./withMod").BaseModOptions, "skipEmptyMod" | "saveToInternal">>>;
    appDelegate: import("./createBaseMod").BaseModProviderMethods<Paths.AppDelegateProjectFile, Partial<Pick<import("./withMod").BaseModOptions, "skipEmptyMod" | "saveToInternal">>>;
    expoPlist: import("./createBaseMod").BaseModProviderMethods<JSONObject, Partial<Pick<import("./withMod").BaseModOptions, "skipEmptyMod" | "saveToInternal">>>;
    xcodeproj: import("./createBaseMod").BaseModProviderMethods<xcode.XcodeProject, Partial<Pick<import("./withMod").BaseModOptions, "skipEmptyMod" | "saveToInternal">>>;
    infoPlist: import("./createBaseMod").BaseModProviderMethods<InfoPlist, Partial<Pick<import("./withMod").BaseModOptions, "skipEmptyMod" | "saveToInternal">>>;
    entitlements: import("./createBaseMod").BaseModProviderMethods<JSONObject, Partial<Pick<import("./withMod").BaseModOptions, "skipEmptyMod" | "saveToInternal">>>;
    podfile: import("./createBaseMod").BaseModProviderMethods<Paths.PodfileProjectFile, Partial<Pick<import("./withMod").BaseModOptions, "skipEmptyMod" | "saveToInternal">>>;
    podfileProperties: import("./createBaseMod").BaseModProviderMethods<Record<string, JSONValue>, Partial<Pick<import("./withMod").BaseModOptions, "skipEmptyMod" | "saveToInternal">>>;
};
export {};
