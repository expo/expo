import { ConfigPlugin, ExportedConfig, ExportedConfigWithProps, ModPlatform } from '../Plugin.types';
import { BaseModOptions } from './withMod';
export type ForwardedBaseModOptions = Partial<Pick<BaseModOptions, 'saveToInternal' | 'skipEmptyMod'>>;
export type BaseModProviderMethods<ModType, Props extends ForwardedBaseModOptions = ForwardedBaseModOptions> = {
    getFilePath: (config: ExportedConfigWithProps<ModType>, props: Props) => Promise<string> | string;
    read: (filePath: string, config: ExportedConfigWithProps<ModType>, props: Props) => Promise<ModType> | ModType;
    write: (filePath: string, config: ExportedConfigWithProps<ModType>, props: Props) => Promise<void> | void;
    /**
     * If the mod supports introspection, and avoids making any filesystem modifications during compilation.
     * By enabling, this mod, and all of its descendants will be run in introspection mode.
     * This should only be used for static files like JSON or XML, and not for application files that require regexes,
     * or complex static files that require other files to be generated like Xcode `.pbxproj`.
     */
    isIntrospective?: boolean;
};
export type CreateBaseModProps<ModType, Props extends ForwardedBaseModOptions = ForwardedBaseModOptions> = {
    methodName: string;
    platform: ModPlatform;
    modName: string;
} & BaseModProviderMethods<ModType, Props>;
export declare function createBaseMod<ModType, Props extends ForwardedBaseModOptions = ForwardedBaseModOptions>({ methodName, platform, modName, getFilePath, read, write, isIntrospective, }: CreateBaseModProps<ModType, Props>): ConfigPlugin<Props | void>;
export declare function assertModResults(results: any, platformName: string, modName: string): any;
export declare function createPlatformBaseMod<ModType, Props extends ForwardedBaseModOptions = ForwardedBaseModOptions>({ modName, ...props }: Omit<CreateBaseModProps<ModType, Props>, 'methodName'>): ConfigPlugin<void | Props>;
/** A TS wrapper for creating provides */
export declare function provider<ModType, Props extends ForwardedBaseModOptions = ForwardedBaseModOptions>(props: BaseModProviderMethods<ModType, Props>): BaseModProviderMethods<ModType, Props>;
/** Plugin to create and append base mods from file providers */
export declare function withGeneratedBaseMods<ModName extends string>(config: ExportedConfig, { platform, providers, ...props }: ForwardedBaseModOptions & {
    /** Officially supports `'ios' | 'android'` (`ModPlatform`). Arbitrary strings are supported for adding out-of-tree platforms. */
    platform: ModPlatform & string;
    providers: Partial<Record<ModName, BaseModProviderMethods<any, any>>>;
}): ExportedConfig;
