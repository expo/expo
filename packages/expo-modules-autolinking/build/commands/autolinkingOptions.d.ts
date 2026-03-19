import commander from 'commander';
import { SupportedPlatform } from '../types';
export interface AutolinkingOptions {
    /** Only scan direct "dependencies" of a project for React Native modules, rather than including transitive dependencies.
     * @remarks
     * Before SDK 54, React Native modules would only be linked if they were listed as dependencies
     * of a project. However, in SDK 54+ transitive React Native modules dependencies are also
     * auto-linked, unless this flag is enabled.
     * @defaultValue `false`
     */
    legacy_shallowReactNativeLinking: boolean;
    /** Extra modules directories to search for native modules.
     * @defaultValue `[]`
     */
    searchPaths: string[];
    /** Local native modules directory to add to autolinking.
     * @defaultValue `"./modules"`
     */
    nativeModulesDir: string | null;
    /** Native modules to exclude from autolinking by name.
     * @defaultValue `[]`
     */
    exclude: string[];
    /** A list of additional package names to verify to be deduplicated.
     * @remarks
     * This is useful to verify that additional packages are deduplicated, and adhere to autolinking
     * semantics, even if they aren't native modules. This can for example be used to check utility
     * libraries that shouldn't be duplicated because of singleton or internal state.
     * @defaultValue `[]`
     */
    include: string[];
    /** A list of package names to opt out of prebuilt Expo modules (Android-only)
     * @defaultValue `[]`
     */
    buildFromSource?: string[];
    /** CocoaPods flags to pass to each autolinked pod (Apple/iOS-only)
     * @defaultValue `[]`
     */
    flags?: Record<string, any>;
}
export declare const filterMapSearchPaths: (searchPaths: unknown, basePath: string) => string[] | undefined;
/** Common commandline arguments for autolinking commands (Not to be confused with `AutolinkingOptions` */
export interface AutolinkingCommonArguments {
    projectRoot?: string | null;
    searchPaths?: string[] | null;
    exclude?: string[] | null;
    platform?: SupportedPlatform | null;
}
export declare function registerAutolinkingArguments(command: commander.Command): commander.Command;
export interface LinkingOptionsLoader {
    getCommandRoot(): string;
    getAppRoot(): Promise<string>;
    getPlatformOptions<T extends SupportedPlatform | undefined>(platform: T): Promise<AutolinkingOptions & {
        platform: T;
    }>;
    getPlatformOptions(): Promise<AutolinkingOptions>;
}
export declare function createAutolinkingOptionsLoader(argumentsOptions?: AutolinkingCommonArguments): LinkingOptionsLoader;
