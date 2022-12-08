import { ExportedConfig } from '../Plugin.types';
import { Manifest, Paths, Properties, Resources } from '../android';
import { AndroidManifest } from '../android/Manifest';
import { ForwardedBaseModOptions } from './createBaseMod';
export declare function sortAndroidManifest(obj: AndroidManifest): Manifest.AndroidManifest;
declare const defaultProviders: {
    dangerous: import("./createBaseMod").BaseModProviderMethods<unknown, Partial<Pick<import("./withMod").BaseModOptions, "skipEmptyMod" | "saveToInternal">>>;
    manifest: import("./createBaseMod").BaseModProviderMethods<Manifest.AndroidManifest, Partial<Pick<import("./withMod").BaseModOptions, "skipEmptyMod" | "saveToInternal">>>;
    gradleProperties: import("./createBaseMod").BaseModProviderMethods<Properties.PropertiesItem[], Partial<Pick<import("./withMod").BaseModOptions, "skipEmptyMod" | "saveToInternal">>>;
    strings: import("./createBaseMod").BaseModProviderMethods<Resources.ResourceXML, Partial<Pick<import("./withMod").BaseModOptions, "skipEmptyMod" | "saveToInternal">>>;
    colors: import("./createBaseMod").BaseModProviderMethods<Resources.ResourceXML, Partial<Pick<import("./withMod").BaseModOptions, "skipEmptyMod" | "saveToInternal">>>;
    colorsNight: import("./createBaseMod").BaseModProviderMethods<Resources.ResourceXML, Partial<Pick<import("./withMod").BaseModOptions, "skipEmptyMod" | "saveToInternal">>>;
    styles: import("./createBaseMod").BaseModProviderMethods<Resources.ResourceXML, Partial<Pick<import("./withMod").BaseModOptions, "skipEmptyMod" | "saveToInternal">>>;
    projectBuildGradle: import("./createBaseMod").BaseModProviderMethods<Paths.GradleProjectFile, Partial<Pick<import("./withMod").BaseModOptions, "skipEmptyMod" | "saveToInternal">>>;
    settingsGradle: import("./createBaseMod").BaseModProviderMethods<Paths.GradleProjectFile, Partial<Pick<import("./withMod").BaseModOptions, "skipEmptyMod" | "saveToInternal">>>;
    appBuildGradle: import("./createBaseMod").BaseModProviderMethods<Paths.GradleProjectFile, Partial<Pick<import("./withMod").BaseModOptions, "skipEmptyMod" | "saveToInternal">>>;
    mainActivity: import("./createBaseMod").BaseModProviderMethods<Paths.ApplicationProjectFile, Partial<Pick<import("./withMod").BaseModOptions, "skipEmptyMod" | "saveToInternal">>>;
    mainApplication: import("./createBaseMod").BaseModProviderMethods<Paths.ApplicationProjectFile, Partial<Pick<import("./withMod").BaseModOptions, "skipEmptyMod" | "saveToInternal">>>;
};
type AndroidDefaultProviders = typeof defaultProviders;
export declare function withAndroidBaseMods(config: ExportedConfig, { providers, ...props }?: ForwardedBaseModOptions & {
    providers?: Partial<AndroidDefaultProviders>;
}): ExportedConfig;
export declare function getAndroidModFileProviders(): {
    dangerous: import("./createBaseMod").BaseModProviderMethods<unknown, Partial<Pick<import("./withMod").BaseModOptions, "skipEmptyMod" | "saveToInternal">>>;
    manifest: import("./createBaseMod").BaseModProviderMethods<Manifest.AndroidManifest, Partial<Pick<import("./withMod").BaseModOptions, "skipEmptyMod" | "saveToInternal">>>;
    gradleProperties: import("./createBaseMod").BaseModProviderMethods<Properties.PropertiesItem[], Partial<Pick<import("./withMod").BaseModOptions, "skipEmptyMod" | "saveToInternal">>>;
    strings: import("./createBaseMod").BaseModProviderMethods<Resources.ResourceXML, Partial<Pick<import("./withMod").BaseModOptions, "skipEmptyMod" | "saveToInternal">>>;
    colors: import("./createBaseMod").BaseModProviderMethods<Resources.ResourceXML, Partial<Pick<import("./withMod").BaseModOptions, "skipEmptyMod" | "saveToInternal">>>;
    colorsNight: import("./createBaseMod").BaseModProviderMethods<Resources.ResourceXML, Partial<Pick<import("./withMod").BaseModOptions, "skipEmptyMod" | "saveToInternal">>>;
    styles: import("./createBaseMod").BaseModProviderMethods<Resources.ResourceXML, Partial<Pick<import("./withMod").BaseModOptions, "skipEmptyMod" | "saveToInternal">>>;
    projectBuildGradle: import("./createBaseMod").BaseModProviderMethods<Paths.GradleProjectFile, Partial<Pick<import("./withMod").BaseModOptions, "skipEmptyMod" | "saveToInternal">>>;
    settingsGradle: import("./createBaseMod").BaseModProviderMethods<Paths.GradleProjectFile, Partial<Pick<import("./withMod").BaseModOptions, "skipEmptyMod" | "saveToInternal">>>;
    appBuildGradle: import("./createBaseMod").BaseModProviderMethods<Paths.GradleProjectFile, Partial<Pick<import("./withMod").BaseModOptions, "skipEmptyMod" | "saveToInternal">>>;
    mainActivity: import("./createBaseMod").BaseModProviderMethods<Paths.ApplicationProjectFile, Partial<Pick<import("./withMod").BaseModOptions, "skipEmptyMod" | "saveToInternal">>>;
    mainApplication: import("./createBaseMod").BaseModProviderMethods<Paths.ApplicationProjectFile, Partial<Pick<import("./withMod").BaseModOptions, "skipEmptyMod" | "saveToInternal">>>;
};
export {};
