import { ExpoModuleConfig } from './ExpoModuleConfig';

type Required<T, K extends keyof T> = T & { [P in K]-?: T[P] };

type WithRequired<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>> & Required<T, K>;

// NOTE(@kitten): Our code has never guaranteed this to be exhaustive, hence the `| (string & {})` addition
export type SupportedPlatform =
  | 'apple'
  | 'ios'
  | 'android'
  | 'web'
  | 'macos'
  | 'tvos'
  | 'devtools'
  | (string & {});

export type PackageRevision = {
  name: string;
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
  modules: ModuleAndroidModuleInfo[];
  packages: string[];
  publication?: AndroidPublication;
  aarProjects?: AndroidGradleAarProjectDescriptor[];
  shouldUsePublicationScriptPath?: string;
}

export interface ModuleAndroidModuleInfo {
  name: string | null;
  classifier: string;
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
export interface ModuleIosConfig {
  name: string | null;
  class: string;
}
export interface ModuleDescriptorIos extends CommonNativeModuleDescriptor {
  modules: ModuleIosConfig[];
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
  webpageRoot?: string;
  cliExtensions?: {
    description: string;
    commands: {
      name: string;
      title: string;
      environments: ('cli' | 'mcp')[];
      parameters?: {
        name: string;
        type: 'text' | 'number' | 'confirm';
        description?: string;
      }[];
    }[];
    entryPoint: string;
  };
}

export interface ModuleDescriptorWeb {
  packageName: string;
  packageRoot: string;
}

export type ModuleDescriptor =
  | ModuleDescriptorAndroid
  | ModuleDescriptorIos
  | ModuleDescriptorDevTools
  | ModuleDescriptorWeb;

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

export type RawAppleModuleConfig = {
  name: string;
  class: string;
};
/**
 * Represents a raw config specific to Apple platforms.
 */
export type RawModuleConfigApple = {
  /**
   * Names of Swift native modules classes to put to the generated modules provider file.
   */
  modules?: (string | RawAppleModuleConfig)[];

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

export type RawAndroidModuleConfig = {
  /**
   * Names of the modules to be linked in the project.
   */
  name: string;
  class: string;
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
   * The path to the script that determines whether the publication should be used.
   * Evaluate in the context of the `settings.gradle` file.
   * Won't be run if the publication is not defined.
   */
  shouldUsePublicationScriptPath?: string;
  /**
   * Names of the modules to be linked in the project.
   */
  modules?: (string | RawAndroidModuleConfig)[];

  /**
   * Prebuilded AAR projects.
   */
  gradleAarProjects?: AndroidGradleAarProjectDescriptor[];

  gradlePath?: string;
};

export type RawAndroidConfig = {
  projects?: WithRequired<RawAndroidProjectConfig, 'name' | 'path'>[];
  /**
   * Gradle plugins.
   */
  gradlePlugins?: AndroidGradlePluginDescriptor[];

  /**
   * Gradle projects containing AAR files.
   */
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
     * The webpage root directory for Expo CLI DevTools to serve the web resources. Only set if the module has a web interface.
     */
    webpageRoot?: string;
    /**
     * Cli extension config for the module.
     */
    cliExtensions?: {
      /*
       * The description of the module that will be displayed in the CLI.
       */
      description: string;
      /**
       * The commands that the module provides in the CLI.
       * Each command has a name and a caption.
       */
      commands: {
        /**
         * Name of command
         */
        name: string;
        /**
         * Title for the command that will be displayed in the CLI.
         */
        title: string;
        /**
         * Optional array of disabled environments for the command. By default all commands are enabled on all environments.
         * Environments can be 'cli' for the CLI or 'mcp' for the Model Context Protocol.
         */
        environments: ('cli' | 'mcp')[];
        /**
         * Optional parameters for the command.
         */
        parameters?: {
          /**
           * Name of the parameter.
           */
          name: string;
          /**
           * Type of the parameter.
           * Can be 'text', 'number', or 'confirm'.
           */
          type: 'text' | 'number' | 'confirm';
          /**
           * Description of the parameter that will be displayed in the CLI.
           */
          description?: string;
        }[];
      }[];
      /**
       * The main entry point for the module in the CLI.
       */
      entryPoint: string;
    };
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

type AndroidMavenRepositoryCredentials =
  | AndroidMavenRepositoryPasswordCredentials
  | AndroidMavenRepositoryHttpHeaderCredentials
  | AndroidMavenRepositoryAWSCredentials;

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
