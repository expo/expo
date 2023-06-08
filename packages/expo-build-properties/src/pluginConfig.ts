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
    deploymentTarget: '13.0',
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
   * Interface representing available configuration for Android Gradle plugin [PackagingOptions](https://developer.android.com/reference/tools/gradle-api/7.0/com/android/build/api/dsl/PackagingOptions).
   */
  packagingOptions?: PluginConfigTypeAndroidPackagingOptions;

  /**
   * By default, Flipper is enabled with the version that comes bundled with `react-native`.
   *
   * Use this to change the [Flipper](https://fbflipper.com/) version when
   * running your app on Android. You can set the `flipper` property to a
   * semver string and specify an alternate Flipper version.
   */
  flipper?: string;

  /**
   * Enable the experimental Network Inspector for [Development builds](https://docs.expo.dev/develop/development-builds/introduction/).
   * SDK 49+ is required.
   */
  unstable_networkInspector?: boolean;

  /**
   * Add extra maven repositories to all gradle projects.
   *
   * This acts like to add the following code to **android/build.gradle**:
   * ```groovy
   * allprojects {
   *   repositories {
   *     maven {
   *       url [THE_EXTRA_MAVEN_REPOSITORY]
   *     }
   *   }
   * }
   * ```
   *
   * @hide For the implementation details,
   * this property is actually handled by `expo-modules-autolinking` but not the config-plugins inside expo-build-properties.
   */
  extraMavenRepos?: string[];
}

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
   *
   * > You cannot use `useFrameworks` and `flipper` at the same time , and
   * doing so will generate an error.
   */
  useFrameworks?: 'static' | 'dynamic';

  /**
   * Enable [Flipper](https://fbflipper.com/) when running your app on iOS in
   * Debug mode. Setting `true` enables the default version of Flipper, while
   * setting a semver string will enable a specific version of Flipper you've
   * declared in your **package.json**. The default for this configuration is `false`.
   *
   * > You cannot use `flipper` at the same time as `useFrameworks`, and
   * doing so will generate an error.
   */
  flipper?: boolean | string;

  /**
   * Enable the experimental Network Inspector for [Development builds](https://docs.expo.dev/develop/development-builds/introduction/).
   * SDK 49+ is required.
   */
  unstable_networkInspector?: boolean;

  /**
   * Add extra CocoaPods dependencies for all targets.
   *
   * This acts like to add the following code to **ios/Podfile**:
   * ```
   * pod '[EXTRA_POD_NAME]', '~> [EXTRA_POD_VERSION]'
   * # e.g.
   * pod 'Protobuf', '~> 3.14.0'
   * ```
   *
   * @hide For the implementation details,
   * this property is actually handled by `expo-modules-autolinking` but not the config-plugins inside expo-build-properties.
   */
  extraPods?: ExtraIosPodDependency[];
}

/**
 * Interface representing extra CocoaPods dependency.
 * @see https://guides.cocoapods.org/syntax/podfile.html#pod
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
   * @example `~> 0.1.2`
   */
  version?: string;
  /**
   * Build configurations for which the pod should be installed.
   * @example `['Debug', 'Release']`
   */
  configurations?: string[];
  /**
   * Whether this pod should use modular headers.
   */
  modular_headers?: boolean;
  /**
   * Custom source to search for this dependency.
   * @example `https://github.com/CocoaPods/Specs.git`
   */
  source?: string;
  /**
   * Custom local filesystem path to add the dependency.
   * @example `~/Documents/AFNetworking`
   */
  path?: string;
  /**
   * Custom podspec path.
   * @example `https://example.com/JSONKit.podspec`
   */
  podspec?: string;
  /**
   * Test specs can be optionally included via the :testspecs option. By default, none of a Pod's test specs are included.
   * @example `['UnitTests', 'SomeOtherTests']`
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
 * Interface representing available configuration for Android Gradle plugin [PackagingOptions](https://developer.android.com/reference/tools/gradle-api/7.0/com/android/build/api/dsl/PackagingOptions).
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

        flipper: {
          type: 'string',
          nullable: true,
        },

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

        unstable_networkInspector: { type: 'boolean', nullable: true },

        extraMavenRepos: { type: 'array', items: { type: 'string' }, nullable: true },
      },
      nullable: true,
    },
    ios: {
      type: 'object',
      properties: {
        newArchEnabled: { type: 'boolean', nullable: true },
        deploymentTarget: { type: 'string', pattern: '\\d+\\.\\d+', nullable: true },
        useFrameworks: { type: 'string', enum: ['static', 'dynamic'], nullable: true },

        flipper: {
          type: ['boolean', 'string'],
          nullable: true,
        },

        unstable_networkInspector: { type: 'boolean', nullable: true },

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

  // explicitly block using use_frameworks and Flipper in iOS
  // https://github.com/facebook/flipper/issues/2414
  if (Boolean(config.ios?.flipper) && config.ios?.useFrameworks !== undefined) {
    throw new Error('`ios.flipper` cannot be enabled when `ios.useFrameworks` is set.');
  }

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
