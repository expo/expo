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
    deploymentTarget: '13.4',
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
   * Enable React Native new architecture for Android platform.
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
   * Enable [Proguard or R8](https://developer.android.com/studio/build/shrink-code) in release builds to obfuscate Java code and reduce app size.
   */
  enableProguardInReleaseBuilds?: boolean;
  /**
   * Enable [`shrinkResources`](https://developer.android.com/studio/build/shrink-code#shrink-resources) in release builds to remove unused resources from the app.
   * This property should be used in combination with `enableProguardInReleaseBuilds`.
   */
  enableShrinkResourcesInReleaseBuilds?: boolean;
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

  /**
   * Add extra maven repositories to all gradle projects.
   *
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
   *
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
   *
   * @hide For the implementation details,
   * this property is actually handled by `expo-modules-autolinking` not the config-plugins inside `expo-build-properties`
   */
  extraMavenRepos?: (AndroidMavenRepository | string)[];
  /**
   * Indicates whether the app intends to use cleartext network traffic.
   *
   * @default false
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
}

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

/**
 * Interface representing available configuration for iOS native build properties.
 * @platform ios
 */
export interface PluginConfigTypeIos {
  /**
   * Enable React Native new architecture for iOS platform.
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
   * Enable the Network Inspector.
   *
   * @default true
   */
  networkInspector?: boolean;

  /**
   * Add extra CocoaPods dependencies for all targets.
   *
   * This acts like to add the following code to **ios/Podfile**:
   *
   * ```ruby
   * pod '[EXTRA_POD_NAME]', '~> [EXTRA_POD_VERSION]'
   *
   * # Example
   * pod 'Protobuf', '~> 3.14.0'
   * ```
   *
   * @hide For the implementation details,
   * this property is actually handled by `expo-modules-autolinking` but not the config-plugins inside `expo-build-properties`.
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
   * ```
   * { "name": "AFNetworking", "git": "https://github.com/gowalla/AFNetworking.git", "tag": "0.7.0" }
   * ```
   *
   * This acts like to add this pod dependency statement:
   * ```
   * pod 'AFNetworking', :git => 'https://github.com/gowalla/AFNetworking.git', :tag => '0.7.0'
   * ```
   */
  git?: string;
  /**
   * The git branch to fetch. See the {@link git} property for more information.
   */
  branch?: string;
  /**
   * The git tag to fetch. See the {@link git} property for more information.
   */
  tag?: string;
  /**
   * The git commit to fetch. See the {@link git} property for more information.
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

export interface PluginConfigTypeAndroidQueries {
  /**
   * Specifies a single app that your app intends to access. This other app might integrate with your app, or your app might use services that the other app provides.
   */
  package: string[];
  /**
   * Specifies an intent filter signature. Your app can discover other apps that have matching `<intent-filter>` elements.
   * These intents have restrictions compared to typical intent filter signatures.
   *
   * @see [Android documentation](https://developer.android.com/training/package-visibility/declaring#intent-filter-signature) for details
   */
  intent?: PluginConfigTypeAndroidQueriesIntent[];
  /**
   * Specifies one or more content provider authorities. Your app can discover other apps whose content providers use the specified authorities.
   * There are some restrictions on the options that you can include in this `<provider>` element, compared to a typical `<provider>` manifest element. You may only specify the `android:authorities` attribute.
   */
  provider?: string[];
}

export interface PluginConfigTypeAndroidQueriesIntent {
  /**
   * A string naming the action to perform. Usually one of the platform-defined values, such as `ACTION_SEND` or `ACTION_VIEW`.
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

        enableProguardInReleaseBuilds: { type: 'boolean', nullable: true },
        enableShrinkResourcesInReleaseBuilds: { type: 'boolean', nullable: true },
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

        manifestQueries: {
          required: ['package'],
          type: 'object',
          properties: {
            package: { type: 'array', items: { type: 'string' }, minItems: 1, nullable: false },
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
            provider: { type: 'array', items: { type: 'string' }, nullable: true },
          },
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
  if (!validate(config)) {
    throw new Error('Invalid expo-build-properties config: ' + JSON.stringify(validate.errors));
  }

  maybeThrowInvalidVersions(config);

  if (
    config.android?.enableShrinkResourcesInReleaseBuilds === true &&
    config.android?.enableProguardInReleaseBuilds !== true
  ) {
    throw new Error(
      '`android.enableShrinkResourcesInReleaseBuilds` requires `android.enableProguardInReleaseBuilds` to be enabled.'
    );
  }

  return config;
}
