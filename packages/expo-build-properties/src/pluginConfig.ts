import Ajv, { JSONSchemaType } from 'ajv';
import semver from 'semver';

/**
 * The minimal supported versions. These values should align to SDK.
 * @ignore
 */
const EXPO_SDK_MINIMAL_SUPPORTED_VERSIONS = {
  android: {
    minSdkVersion: 21,
    compileSdkVersion: 31,
    targetSdkVersion: 31,
    kotlinVersion: '1.6.10',
  },
  ios: {
    deploymentTarget: '15.1',
  },
};

/**
 * Interface representing base build properties configuration.
 */
export interface PluginConfigType {
  /**
   * Interface representing available configuration for Android native build properties.
   * @platform android
   */
  android?: PluginConfigTypeAndroid;
  /**
   * Interface representing available configuration for iOS native build properties.
   * @platform ios
   */
  ios?: PluginConfigTypeIos;
}

/**
 * Interface representing available configuration for Android native build properties.
 * @platform android
 */
export interface PluginConfigTypeAndroid {
  /**
   * Enable React Native New Architecture for Android platform.
   *
   * @deprecated Use [`newArchEnabled`](https://docs.expo.dev/versions/latest/config/app/#newarchenabled) in
   * app config file instead.
   */
  newArchEnabled?: boolean;
  /**
   * Override the default `minSdkVersion` version number in **build.gradle**.
   * */
  minSdkVersion?: number;
  /**
   * Override the default `compileSdkVersion` version number in **build.gradle**.
   */
  compileSdkVersion?: number;
  /**
   * Override the default `targetSdkVersion` version number in **build.gradle**.
   */
  targetSdkVersion?: number;
  /**
   *  Override the default `buildToolsVersion` version number in **build.gradle**.
   */
  buildToolsVersion?: string;
  /**
   * Override the Kotlin version used when building the app.
   */
  kotlinVersion?: string;
  /**
   * Enable [R8](https://developer.android.com/topic/performance/app-optimization/enable-app-optimization) in release builds to obfuscate Java code and reduce app size.
   */
  enableMinifyInReleaseBuilds?: boolean;
  /**
   * Enable [`shrinkResources`](https://developer.android.com/studio/build/shrink-code#shrink-resources) in release builds to remove unused resources from the app.
   * This property should be used in combination with `enableMinifyInReleaseBuilds`.
   */
  enableShrinkResourcesInReleaseBuilds?: boolean;
  /**
   * Enable [`crunchPngs`](https://developer.android.com/topic/performance/reduce-apk-size#crunch) in release builds to optimize PNG files.
   * This property is enabled by default, but "might inflate PNG files that are already compressed", so you may want to disable it if you do your own PNG optimization.
   *
   * @default true
   */
  enablePngCrunchInReleaseBuilds?: boolean;
  /**
   * Append custom [Proguard rules](https://www.guardsquare.com/manual/configuration/usage) to **android/app/proguard-rules.pro**.
   */
  extraProguardRules?: string;
  /**
   * Interface representing available configuration for Android Gradle plugin [`PackagingOptions`](https://developer.android.com/reference/tools/gradle-api/7.0/com/android/build/api/dsl/PackagingOptions).
   */
  packagingOptions?: PluginConfigTypeAndroidPackagingOptions;

  /**
   * Enable the Network Inspector.
   *
   * @default true
   */
  networkInspector?: boolean;

  // For the implementation details, this property is actually handled by `expo-modules-autolinking`
  // not the config-plugins inside `expo-build-properties`
  /**
   * Add extra maven repositories to all gradle projects.
   *
   * Takes an array of objects or strings.
   * Strings are passed as the `url` property of the object with no credentials or authentication scheme.
   *
   * This adds the following code to **android/build.gradle**:
   * ```groovy
   * allprojects {
   *  repositories {
   *   maven {
   *    url "https://foo.com/maven-releases"
   *  }
   * }
   * ```
   *
   * By using an `AndroidMavenRepository` object, you can specify credentials and an authentication scheme.
   * ```groovy
   * allprojects {
   *   repositories {
   *     maven {
   *       url "https://foo.com/maven-releases"
   *       credentials {
   *        username = "bar"
   *        password = "baz"
   *       }
   *       authentication {
   *        basic(BasicAuthentication)
   *       }
   *     }
   *   }
   * }
   * ```
   *
   * @see [Gradle documentation](https://docs.gradle.org/current/userguide/declaring_repositories.html#sec:case-for-maven)
   */
  extraMavenRepos?: (AndroidMavenRepository | string)[];
  /**
   * Indicates whether the app intends to use cleartext network traffic.
   *
   * For Android 8 and below, the default platform-specific value is `true`.
   * For Android 9 and above, the default platform-specific value is `false`.
   *
   * @see [Android documentation](https://developer.android.com/guide/topics/manifest/application-element#usesCleartextTraffic)
   */
  usesCleartextTraffic?: boolean;
  /**
   * Instructs the Android Gradle plugin to compress native libraries in the APK using the legacy packaging system.
   *
   * @default false
   *
   * @see [Android documentation](https://developer.android.com/build/releases/past-releases/agp-4-2-0-release-notes#compress-native-libs-dsl)
   */
  useLegacyPackaging?: boolean;
  /**
   * Specifies the set of other apps that an app intends to interact with. These other apps are specified by package name,
   * by intent signature, or by provider authority.
   *
   *  @see [Android documentation](https://developer.android.com/guide/topics/manifest/queries-element)
   */
  manifestQueries?: PluginConfigTypeAndroidQueries;
  /**
   * Changes the apps theme to a DayNight variant to correctly support dark mode.
   *
   * @see [Android documentation](https://developer.android.com/develop/ui/views/theming/darktheme)
   */
  useDayNightTheme?: boolean;

  /**
   * Enable JavaScript Bundle compression. Turning this on will result in a smaller APK size but may have slower app startup times.
   *
   * @see [Faster App Startup](https://reactnative.dev/blog/2025/04/08/react-native-0.79#android-faster-app-startup)
   *
   * @default false
   */
  enableBundleCompression?: boolean;

  /*
   * Enable building React Native from source. Turning this on will significantly increase the build times.
   * @default false
   */
  buildReactNativeFromSource?: boolean;

  /**
   * Enable building React Native from source. Turning this on will significantly increase the build times.
   * @deprecated Use `buildReactNativeFromSource` instead.
   * @default false
   */
  buildFromSource?: boolean;
  /**
   * Override the default `reactNativeArchitectures` list of ABIs to build in **gradle.properties**.
   *
   * @see [Android documentation](https://developer.android.com/ndk/guides/abis) for more information.
   *
   * @example
   * ```json
   * ["arm64-v8a", "x86_64"]
   * ```
   *
   * @default ["armeabi-v7a", "arm64-v8a", "x86", "x86_64"]
   */
  buildArchs?: string[];
  /**
   * Specifies a single Maven repository to be used as an exclusive mirror for all dependency resolution.
   * When set, all other Maven repositories will be ignored and only this repository will be used to fetch dependencies.
   *
   * @see [Using a Maven Mirror](https://reactnative.dev/docs/build-speed#using-a-maven-mirror-android-only)
   */
  exclusiveMavenMirror?: string;

  /**
   * The React Native release level to use for the project.
   * This can be used to enable different sets of internal React Native feature flags.
   *
   * @default 'stable'
   */
  reactNativeReleaseLevel?: 'stable' | 'canary' | 'experimental';
}

// @docsMissing
/**
 * @platform android
 */
export interface AndroidMavenRepository {
  /**
   * The URL of the Maven repository.
   */
  url: string;
  /**
   * The credentials to use when accessing the Maven repository.
   * May be of type PasswordCredentials, HttpHeaderCredentials, or AWSCredentials.
   *
   * @see The authentication schemes section of [Gradle documentation](https://docs.gradle.org/current/userguide/declaring_repositories.html#sec:authentication_schemes) for more information.
   */
  credentials?: AndroidMavenRepositoryCredentials;
  /**
   * The authentication scheme to use when accessing the Maven repository.
   */
  authentication?: 'basic' | 'digest' | 'header';
}

/**
 * The Android Maven repository credentials for basic authentication.
 * @platform android
 */
export interface AndroidMavenRepositoryPasswordCredentials {
  /**
   * The credential value. You can also pass `"System.getenv('ENV_VAR_NAME')"` to get the value from an environment variable.
   */
  username: string;

  /**
   * The credential value. You can also pass `"System.getenv('ENV_VAR_NAME')"` to get the value from an environment variable.
   */
  password: string;
}

/**
 * The Android Maven repository credentials that are passed as HTTP headers.
 * @platform android
 */
export interface AndroidMavenRepositoryHttpHeaderCredentials {
  /**
   * The credential value. You can also pass `"System.getenv('ENV_VAR_NAME')"` to get the value from an environment variable.
   */
  name: string;

  /**
   * The credential value. You can also pass `"System.getenv('ENV_VAR_NAME')"` to get the value from an environment variable.
   */
  value: string;
}

/**
 * The Android Maven repository credentials for AWS S3.
 * @platform android
 */
export interface AndroidMavenRepositoryAWSCredentials {
  /**
   * The credential value. You can also pass `"System.getenv('ENV_VAR_NAME')"` to get the value from an environment variable.
   */
  accessKey: string;

  /**
   * The credential value. You can also pass `"System.getenv('ENV_VAR_NAME')"` to get the value from an environment variable.
   */
  secretKey: string;

  /**
   * The credential value. You can also pass `"System.getenv('ENV_VAR_NAME')"` to get the value from an environment variable.
   */
  sessionToken?: string;
}

// @docsMissing
/**
 * @platform android
 */
export type AndroidMavenRepositoryCredentials =
  | AndroidMavenRepositoryPasswordCredentials
  | AndroidMavenRepositoryHttpHeaderCredentials
  | AndroidMavenRepositoryAWSCredentials;

/**
 * Interface representing available configuration for iOS native build properties.
 * @platform ios
 */
export interface PluginConfigTypeIos {
  /**
   * Enable React Native New Architecture for iOS platform.
   *
   * @deprecated Use [`newArchEnabled`](https://docs.expo.dev/versions/latest/config/app/#newarchenabled) in
   * app config file instead.
   */
  newArchEnabled?: boolean;
  /**
   * Override the default iOS "Deployment Target" version in the following projects:
   *  - in CocoaPods projects,
   *  - `PBXNativeTarget` with "com.apple.product-type.application" `productType` in the app project.
   */
  deploymentTarget?: string;

  /**
   * Enable [`use_frameworks!`](https://guides.cocoapods.org/syntax/podfile.html#use_frameworks_bang)
   * in `Podfile` to use frameworks instead of static libraries for Pods.
   */
  useFrameworks?: 'static' | 'dynamic';

  /**
   * List of CocoaPods that should be linked statically instead of as frameworks.
   *
   * This is only relevant when `use_frameworks!` is enabled. Some pods—
   * especially React Native prebuilt binaries—can fail due to modular header
   * issues when built as dynamic frameworks. Declaring them here ensures they
   * are linked statically, avoiding those compatibility problems.
   *
   * This property is consumed by the `use_expo_modules` function in
   * `expo-modules-autolinking`.
   */
  forceStaticLinking?: string[];

  /**
   * Enable the Network Inspector.
   *
   * @default true
   */
  networkInspector?: boolean;

  // For the implementation details, this property is actually handled by `expo-modules-autolinking`
  // but not the config-plugins inside `expo-build-properties`.
  /**
   * Add extra CocoaPods dependencies for all targets.
   *
   * This configuration is responsible for adding the new Pod entries to **ios/Podfile**.
   *
   * @example
   * Creating entry in the configuration like below:
   * ```json
   * [
   *   {
   *     name: "Protobuf",
   *     version: "~> 3.14.0",
   *   }
   * ]
   * ```
   * Will produce the following entry in the generated **ios/Podfile**:
   * ```ruby
   * pod 'Protobuf', '~> 3.14.0'
   * ```
   */
  extraPods?: ExtraIosPodDependency[];

  /**
   * Enable C++ compiler cache for iOS builds.
   *
   * This speeds up compiling C++ code by caching the results of previous compilations.
   *
   * @see [React Native's documentation on local caches](https://reactnative.dev/docs/build-speed#local-caches) and
   * [Ccache documentation](https://ccache.dev/).
   */
  ccacheEnabled?: boolean;

  /**
   * Enable aggregation of Privacy Manifests (`PrivacyInfo.xcprivacy`) from
   * CocoaPods resource bundles. If enabled, the manifests will be merged into a
   * single file. If not enabled, developers will need to manually aggregate them.
   *
   * @see [Privacy manifests](https://docs.expo.dev/guides/apple-privacy/) guide
   * and [Apple's documentation on Privacy manifest files](https://developer.apple.com/documentation/bundleresources/privacy_manifest_files).
   */
  privacyManifestAggregationEnabled?: boolean;

  /**
   * Enables support for precompiled React Native iOS dependencies (`ReactNativeDependencies.xcframework`).
   * Setting this value to `true` will enable building React Native from source and disable the use of precompiled xcframeworks.
   * This feature is available from React Native 0.80 and later when using the new architecture.
   * From React Native 0.81, this setting will also control the use of a precompiled React Native Core (`React.xcframework`).
   *
   * @default false
   * @see React Expo blog for details: [Precompiled React Native for iOS: Faster builds are coming in 0.81](https://expo.dev/blog/precompiled-react-native-for-ios) for more information.
   * @experimental
   */
  buildReactNativeFromSource?: boolean;

  /**
   * The React Native release level to use for the project.
   * This can be used to enable different sets of internal React Native feature flags.
   *
   * @default 'stable'
   */
  reactNativeReleaseLevel?: 'stable' | 'canary' | 'experimental';
}

/**
 * Interface representing extra CocoaPods dependency.
 * @see [Podfile syntax reference](https://guides.cocoapods.org/syntax/podfile.html#pod)
 * @platform ios
 */
export interface ExtraIosPodDependency {
  /**
   * Name of the pod.
   */
  name: string;
  /**
   * Version of the pod.
   * CocoaPods supports various [versioning options](https://guides.cocoapods.org/using/the-podfile.html#pod).
   * @example
   * ```
   * ~> 0.1.2
   * ```
   */
  version?: string;
  /**
   * Build configurations for which the pod should be installed.
   * @example
   * ```
   * ['Debug', 'Release']
   * ```
   */
  configurations?: string[];
  /**
   * Whether this pod should use modular headers.
   */
  modular_headers?: boolean;
  /**
   * Custom source to search for this dependency.
   * @example
   * ```
   * https://github.com/CocoaPods/Specs.git
   * ```
   */
  source?: string;
  /**
   * Custom local filesystem path to add the dependency.
   * @example
   * ```
   * ~/Documents/AFNetworking
   * ```
   */
  path?: string;
  /**
   * Custom podspec path.
   * @example
   * ```https://example.com/JSONKit.podspec```
   */
  podspec?: string;
  /**
   * Test specs can be optionally included via the :testspecs option. By default, none of a Pod's test specs are included.
   * @example
   * ```
   * ['UnitTests', 'SomeOtherTests']
   * ```
   */
  testspecs?: string[];
  /**
   * Use the bleeding edge version of a Pod.
   *
   * @example
   * ```json
   * {
   *   "name": "AFNetworking",
   *   "git": "https://github.com/gowalla/AFNetworking.git",
   *   "tag": "0.7.0"
   * }
   * ```
   *
   * This acts like to add this pod dependency statement:
   *
   * ```rb
   * pod 'AFNetworking', :git => 'https://github.com/gowalla/AFNetworking.git', :tag => '0.7.0'
   * ```
   */
  git?: string;
  /**
   * The git branch to fetch. See the `git` property for more information.
   */
  branch?: string;
  /**
   * The git tag to fetch. See the `git` property for more information.
   */
  tag?: string;
  /**
   * The git commit to fetch. See the `git` property for more information.
   */
  commit?: string;
}

/**
 * Interface representing available configuration for Android Gradle plugin [`PackagingOptions`](https://developer.android.com/reference/tools/gradle-api/7.0/com/android/build/api/dsl/PackagingOptions).
 * @platform android
 */
export interface PluginConfigTypeAndroidPackagingOptions {
  /**
   * Array of patterns for native libraries where only the first occurrence is packaged in the APK.
   */
  pickFirst?: string[];
  /**
   * Array of patterns for native libraries that should be excluded from being packaged in the APK.
   */
  exclude?: string[];
  /**
   * Array of patterns for native libraries where all occurrences are concatenated and packaged in the APK.
   */
  merge?: string[];
  /**
   * Array of patterns for native libraries that should not be stripped of debug symbols.
   */
  doNotStrip?: string[];
}

// @docsMissing
/**
 * @platform android
 */
export interface PluginConfigTypeAndroidQueries {
  /**
   * Specifies one or more apps that your app intends to access. These other apps might integrate with your app, or your app might use services that these other apps provide.
   */
  package?: string[];
  /**
   * Specifies an intent filter signature. Your app can discover other apps that have matching `<intent-filter>` elements.
   * These intents have restrictions compared to typical intent filter signatures.
   *
   * @see [Android documentation](https://developer.android.com/training/package-visibility/declaring#intent-filter-signature) for more information.
   */
  intent?: PluginConfigTypeAndroidQueriesIntent[];
  /**
   * Specifies one or more content provider authorities. Your app can discover other apps whose content providers use the specified authorities.
   * There are some restrictions on the options that you can include in this `<provider>` element, compared to a typical `<provider>` manifest element.
   * You may only specify the `android:authorities` attribute.
   */
  provider?: string[];
}

// @docsMissing
/**
 * @platform android
 */
export interface PluginConfigTypeAndroidQueriesIntent {
  /**
   * A string naming the action to perform. Usually one of the platform-defined values, such as `SEND` or `VIEW`.
   *
   * @see [Android documentation](https://developer.android.com/guide/topics/manifest/action-element) for more information.
   */
  action?: string;
  /**
   * A description of the data associated with the intent.
   */
  data?: PluginConfigTypeAndroidQueriesData;
  /**
   * Provides an additional way to characterize the activity handling the intent,
   * usually related to the user gesture or location from which it's started.
   */
  category?: string | string[];
}

// @docsMissing
/**
 * @platform android
 */
export interface PluginConfigTypeAndroidQueriesData {
  /**
   * Specify a URI scheme that is handled
   */
  scheme?: string;
  /**
   * Specify a URI authority host that is handled
   */
  host?: string;
  /**
   * Specify a MIME type that is handled
   */
  mimeType?: string;
}

const schema: JSONSchemaType<PluginConfigType> = {
  type: 'object',
  properties: {
    android: {
      type: 'object',
      properties: {
        newArchEnabled: { type: 'boolean', nullable: true },
        minSdkVersion: { type: 'integer', nullable: true },
        compileSdkVersion: { type: 'integer', nullable: true },
        targetSdkVersion: { type: 'integer', nullable: true },
        buildToolsVersion: { type: 'string', nullable: true },
        kotlinVersion: { type: 'string', nullable: true },

        enableMinifyInReleaseBuilds: { type: 'boolean', nullable: true },
        enableShrinkResourcesInReleaseBuilds: { type: 'boolean', nullable: true },
        enablePngCrunchInReleaseBuilds: { type: 'boolean', nullable: true },
        extraProguardRules: { type: 'string', nullable: true },

        packagingOptions: {
          type: 'object',
          properties: {
            pickFirst: { type: 'array', items: { type: 'string' }, nullable: true },
            exclude: { type: 'array', items: { type: 'string' }, nullable: true },
            merge: { type: 'array', items: { type: 'string' }, nullable: true },
            doNotStrip: { type: 'array', items: { type: 'string' }, nullable: true },
          },
          nullable: true,
        },

        networkInspector: { type: 'boolean', nullable: true },

        extraMavenRepos: {
          type: 'array',
          items: {
            type: ['string', 'object'],
            anyOf: [
              { type: 'string', nullable: false },
              {
                type: 'object',
                required: ['url'],
                properties: {
                  url: { type: 'string', nullable: false },
                  credentials: {
                    type: 'object',
                    oneOf: [
                      {
                        type: 'object',
                        properties: {
                          username: { type: 'string' },
                          password: { type: 'string' },
                        },
                        required: ['username', 'password'],
                        additionalProperties: false,
                      },
                      {
                        type: 'object',
                        properties: {
                          name: { type: 'string' },
                          value: { type: 'string' },
                        },
                        required: ['name', 'value'],
                        additionalProperties: false,
                      },
                      {
                        type: 'object',
                        properties: {
                          accessKey: { type: 'string' },
                          secretKey: { type: 'string' },
                          sessionToken: { type: 'string', nullable: true },
                        },
                        required: ['accessKey', 'secretKey'],
                        additionalProperties: false,
                      },
                    ],
                    nullable: true,
                  },
                  authentication: {
                    type: 'string',
                    enum: ['basic', 'digest', 'header'],
                    nullable: true,
                  },
                },
                additionalProperties: false,
              },
            ],
          },
          nullable: true,
        },

        usesCleartextTraffic: { type: 'boolean', nullable: true },

        useLegacyPackaging: { type: 'boolean', nullable: true },

        useDayNightTheme: { type: 'boolean', nullable: true },

        manifestQueries: {
          type: 'object',
          properties: {
            package: { type: 'array', items: { type: 'string' }, minItems: 1, nullable: true },
            intent: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  action: { type: 'string', nullable: true },
                  data: {
                    type: 'object',
                    properties: {
                      scheme: { type: 'string', nullable: true },
                      host: { type: 'string', nullable: true },
                      mimeType: { type: 'string', nullable: true },
                    },
                    nullable: true,
                  },
                  category: { type: 'array', items: { type: 'string' }, nullable: true },
                },
              },
              nullable: true,
            },
            provider: { type: 'array', items: { type: 'string' }, minItems: 1, nullable: true },
          },
          nullable: true,
        },
        enableBundleCompression: { type: 'boolean', nullable: true },
        buildFromSource: { type: 'boolean', nullable: true },
        buildReactNativeFromSource: { type: 'boolean', nullable: true },
        buildArchs: { type: 'array', items: { type: 'string' }, nullable: true },
        exclusiveMavenMirror: { type: 'string', nullable: true },
        reactNativeReleaseLevel: {
          type: 'string',
          enum: ['stable', 'canary', 'experimental'],
          nullable: true,
        },
      },
      nullable: true,
    },
    ios: {
      type: 'object',
      properties: {
        newArchEnabled: { type: 'boolean', nullable: true },
        deploymentTarget: { type: 'string', pattern: '\\d+\\.\\d+', nullable: true },
        useFrameworks: { type: 'string', enum: ['static', 'dynamic'], nullable: true },
        forceStaticLinking: { type: 'array', items: { type: 'string' }, nullable: true },

        networkInspector: { type: 'boolean', nullable: true },
        ccacheEnabled: { type: 'boolean', nullable: true },
        privacyManifestAggregationEnabled: { type: 'boolean', nullable: true },

        extraPods: {
          type: 'array',
          items: {
            type: 'object',
            required: ['name'],
            properties: {
              name: { type: 'string' },
              version: { type: 'string', nullable: true },
              configurations: { type: 'array', items: { type: 'string' }, nullable: true },
              modular_headers: { type: 'boolean', nullable: true },
              source: { type: 'string', nullable: true },
              path: { type: 'string', nullable: true },
              podspec: { type: 'string', nullable: true },
              testspecs: { type: 'array', items: { type: 'string' }, nullable: true },
              git: { type: 'string', nullable: true },
              branch: { type: 'string', nullable: true },
              tag: { type: 'string', nullable: true },
              commit: { type: 'string', nullable: true },
            },
          },
          nullable: true,
        },
        buildReactNativeFromSource: { type: 'boolean', nullable: true },
        reactNativeReleaseLevel: {
          type: 'string',
          enum: ['stable', 'canary', 'experimental'],
          nullable: true,
        },
      },
      nullable: true,
    },
  },
};

// note(Kudo): For the implementation, we check items one by one because Ajv does not well support custom error message.
/**
 * Checks if specified versions meets Expo minimal supported versions.
 * Will throw error message whenever there are invalid versions.
 *
 * @param config The validated config passed from Ajv.
 * @ignore
 */
function maybeThrowInvalidVersions(config: PluginConfigType) {
  const checkItems = [
    {
      name: 'android.minSdkVersion',
      configVersion: config.android?.minSdkVersion,
      minimalVersion: EXPO_SDK_MINIMAL_SUPPORTED_VERSIONS.android.minSdkVersion,
    },
    {
      name: 'android.compileSdkVersion',
      configVersion: config.android?.compileSdkVersion,
      minimalVersion: EXPO_SDK_MINIMAL_SUPPORTED_VERSIONS.android.compileSdkVersion,
    },
    {
      name: 'android.targetSdkVersion',
      configVersion: config.android?.targetSdkVersion,
      minimalVersion: EXPO_SDK_MINIMAL_SUPPORTED_VERSIONS.android.targetSdkVersion,
    },
    {
      name: 'android.kotlinVersion',
      configVersion: config.android?.kotlinVersion,
      minimalVersion: EXPO_SDK_MINIMAL_SUPPORTED_VERSIONS.android.kotlinVersion,
    },
    {
      name: 'ios.deploymentTarget',
      configVersion: config.ios?.deploymentTarget,
      minimalVersion: EXPO_SDK_MINIMAL_SUPPORTED_VERSIONS.ios.deploymentTarget,
    },
  ];

  for (const { name, configVersion, minimalVersion } of checkItems) {
    if (
      typeof configVersion === 'number' &&
      typeof minimalVersion === 'number' &&
      configVersion < minimalVersion
    ) {
      throw new Error(`\`${name}\` needs to be at least version ${minimalVersion}.`);
    }
    if (
      typeof configVersion === 'string' &&
      typeof minimalVersion === 'string' &&
      semver.lt(semver.coerce(configVersion) ?? '0.0.0', semver.coerce(minimalVersion) ?? '0.0.0')
    ) {
      throw new Error(`\`${name}\` needs to be at least version ${minimalVersion}.`);
    }
  }
}

/**
 * @ignore
 */
export function validateConfig(config: any): PluginConfigType {
  const validate = new Ajv({ allowUnionTypes: true }).compile(schema);
  // handle deprecated enableProguardInReleaseBuilds
  if (
    config.android?.enableProguardInReleaseBuilds !== undefined &&
    config.android?.enableMinifyInReleaseBuilds === undefined
  ) {
    config.android.enableMinifyInReleaseBuilds = config.android.enableProguardInReleaseBuilds;
  }
  if (!validate(config)) {
    throw new Error('Invalid expo-build-properties config: ' + JSON.stringify(validate.errors));
  }

  maybeThrowInvalidVersions(config);

  if (
    config.android?.enableShrinkResourcesInReleaseBuilds === true &&
    config.android?.enableMinifyInReleaseBuilds !== true
  ) {
    throw new Error(
      '`android.enableShrinkResourcesInReleaseBuilds` requires `android.enableMinifyInReleaseBuilds` to be enabled.'
    );
  }

  return config;
}
