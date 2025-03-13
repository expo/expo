import { ExpoModuleConfig } from './ExpoModuleConfig';
type Required<T, K extends keyof T> = T & {
    [P in K]-?: T[P];
};
type WithRequired<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>> & Required<T, K>;
export type SupportedPlatform = 'apple' | 'ios' | 'android' | 'web' | 'macos' | 'tvos' | 'devtools';
/**
 * Options that can be passed through `expo.autolinking` config in the package.json file.
 */
export type AutolinkingOptions = {
    searchPaths?: string[] | null;
    ignorePaths?: string[] | null;
    exclude?: string[] | null;
    flags?: Record<string, any>;
} & {
    [key in SupportedPlatform]?: AutolinkingOptions;
};
export interface SearchOptions {
    searchPaths: string[];
    ignorePaths?: string[] | null;
    exclude?: string[] | null;
    platform: SupportedPlatform;
    silent?: boolean;
    nativeModulesDir?: string | null;
    projectRoot: string;
    /**
     * Filter the search results to only include the project dependencies.
     * In a monorepo, you may like to set this to false and link all modules from the monorepo.
     * @default true
     */
    onlyProjectDeps?: boolean;
    flags?: Record<string, any>;
}
export interface ResolveOptions extends SearchOptions {
    json?: boolean;
}
export interface GenerateOptions extends ResolveOptions {
    target: string;
    namespace?: string;
    empty?: boolean;
}
export interface GenerateModulesProviderOptions extends ResolveOptions {
    target: string;
    entitlement?: string;
    packages: string[];
}
export type PackageRevision = {
    path: string;
    version: string;
    config?: ExpoModuleConfig;
    duplicates?: PackageRevision[];
};
export type SearchResults = {
    [moduleName: string]: PackageRevision;
};
export interface ModuleAndroidProjectInfo {
    name: string;
    sourceDir: string;
    modules: string[];
    publication?: AndroidPublication;
    aarProjects?: AndroidGradleAarProjectDescriptor[];
}
export interface ModuleAndroidPluginInfo {
    id: string;
    sourceDir: string;
}
export interface ModuleAndroidAarProjectInfo extends AndroidGradleAarProjectDescriptor {
    projectDir: string;
}
export interface CommonNativeModuleDescriptor {
    packageName: string;
    coreFeatures?: string[];
}
export interface ModuleDescriptorAndroid extends CommonNativeModuleDescriptor {
    projects?: ModuleAndroidProjectInfo[];
    plugins?: ModuleAndroidPluginInfo[];
}
export interface ModuleIosPodspecInfo {
    podName: string;
    podspecDir: string;
}
export interface ModuleDescriptorIos extends CommonNativeModuleDescriptor {
    modules: string[];
    pods: ModuleIosPodspecInfo[];
    flags: Record<string, any> | undefined;
    swiftModuleNames: string[];
    appDelegateSubscribers: string[];
    reactDelegateHandlers: string[];
    debugOnly: boolean;
}
export interface ModuleDescriptorDevTools {
    packageName: string;
    packageRoot: string;
    webpageRoot: string;
}
export type ModuleDescriptor = ModuleDescriptorAndroid | ModuleDescriptorIos | ModuleDescriptorDevTools;
export interface AndroidGradlePluginDescriptor {
    /**
     * Gradle plugin ID
     */
    id: string;
    /**
     * Artifact group
     */
    group: string;
    /**
     * Relative path to the gradle plugin directory
     */
    sourceDir: string;
    /**
     * Whether to apply the plugin to the root project
     * Defaults to true
     */
    applyToRootProject?: boolean;
}
export interface AndroidGradleAarProjectDescriptor {
    /**
     * Gradle project name
     */
    name: string;
    /**
     * Path to the AAR file
     */
    aarFilePath: string;
}
/**
 * Information about the available publication of an Android AAR file.
 */
export interface AndroidPublication {
    /**
     * The Maven artifact ID.
     */
    id: string;
    /**
     * The Maven group ID.
     */
    group: string;
    /**
     * The Maven version.
     */
    version: string;
    /**
     * The Maven repository.
     */
    repository: string;
}
/**
 * Represents a raw config specific to Apple platforms.
 */
export type RawModuleConfigApple = {
    /**
     * Names of Swift native modules classes to put to the generated modules provider file.
     */
    modules?: string[];
    /**
     * Names of Swift classes that hooks into `ExpoAppDelegate` to receive AppDelegate life-cycle events.
     */
    appDelegateSubscribers?: string[];
    /**
     * Names of Swift classes that implement `ExpoReactDelegateHandler` to hook React instance creation.
     */
    reactDelegateHandlers?: string[];
    /**
     * Podspec relative path.
     * To have multiple podspecs, string array type is also supported.
     */
    podspecPath?: string | string[];
    /**
     * Swift product module name. If empty, the pod name is used for Swift imports.
     * To have multiple modules, string array is also supported.
     */
    swiftModuleName?: string | string[];
    /**
     * Whether this module will be added only to the debug configuration.
     * Defaults to false.
     */
    debugOnly?: boolean;
};
/**
 * Represents a raw config specific to Android platforms.
 */
export type RawAndroidProjectConfig = {
    /**
     * The name of the project. It will be used as the Gradle project name.
     */
    name?: string;
    /**
     * The path to the project directory. Should contain the `build.gradle{.kts}` file.
     * It's relative to the module root directory.
     */
    path?: string;
    /**
     * Information about the available publication of an Android AAR file
     */
    publication?: AndroidPublication;
    /**
     * Names of the modules to be linked in the project.
     */
    modules?: string[];
    /**
     * Prebuilded AAR projects.
     */
    gradleAarProjects?: AndroidGradleAarProjectDescriptor[];
};
export type RawAndroidConfig = {
    projects?: WithRequired<RawAndroidProjectConfig, 'name' | 'path'>[];
    /**
     * Gradle plugins.
     */
    gradlePlugins?: AndroidGradlePluginDescriptor[];
} & RawAndroidProjectConfig;
/**
 * Represents a raw config from `expo-module.json`.
 */
export interface RawExpoModuleConfig {
    /**
     * An array of supported platforms.
     */
    platforms?: SupportedPlatform[];
    /**
     * A config for all Apple platforms.
     */
    apple?: RawModuleConfigApple;
    /**
     * The legacy config previously used for iOS platform. For backwards compatibility it's used as the fallback for `apple`.
     * @deprecated As the module can now support more than iOS platform, use the generic `apple` config instead.
     */
    ios?: RawModuleConfigApple;
    /**
     * Android-specific config.
     */
    android?: RawAndroidConfig;
    /**
     * List of core features that this module requires.
     */
    coreFeatures?: string[];
    /**
     * DevTools-specific config.
     */
    devtools?: {
        /**
         * The webpage root directory for Expo CLI DevTools to serve the web resources.
         */
        webpageRoot: string;
    };
}
interface AndroidMavenRepositoryPasswordCredentials {
    username: string;
    password: string;
}
interface AndroidMavenRepositoryHttpHeaderCredentials {
    name: string;
    value: string;
}
interface AndroidMavenRepositoryAWSCredentials {
    accessKey: string;
    secretKey: string;
    sessionToken?: string;
}
type AndroidMavenRepositoryCredentials = AndroidMavenRepositoryPasswordCredentials | AndroidMavenRepositoryHttpHeaderCredentials | AndroidMavenRepositoryAWSCredentials;
export interface AndroidMavenRepository {
    /**
     * The URL of the Maven repository.
     */
    url: string;
    /**
     * The credentials to use when accessing the Maven repository.
     * May be of type PasswordCredentials, HttpHeaderCredentials, or AWSCredentials.
     *
     * @see the authentication schemes section of [Gradle documentation](https://docs.gradle.org/current/userguide/declaring_repositories.html#sec:authentication_schemes) for more information.
     */
    credentials?: AndroidMavenRepositoryCredentials;
    /**
     * The authentication scheme to use when accessing the Maven repository.
     */
    authentication?: 'basic' | 'digest' | 'header';
}
interface ApplePod {
    name: string;
    version?: string;
    configurations?: string[];
    modular_headers?: boolean;
    source?: string;
    path?: string;
    podspec?: string;
    testspecs?: string[];
    git?: string;
    branch?: string;
    tag?: string;
    commit?: string;
}
export type ExtraDependencies = AndroidMavenRepository[] | ApplePod[];
/**
 * Represents code signing entitlements passed to the `ExpoModulesProvider` for Apple platforms.
 */
export interface AppleCodeSignEntitlements {
    /**
     * @see https://developer.apple.com/documentation/bundleresources/entitlements/com_apple_security_application-groups
     */
    appGroups?: string[];
}
export {};
