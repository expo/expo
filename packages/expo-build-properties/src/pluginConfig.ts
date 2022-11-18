import Ajv, { JSONSchemaType } from 'ajv';
import semver from 'semver';

/**
 * The minimal supported versions. These values should align to SDK
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
 * Configuration for `expo-build-properties`
 */
export interface PluginConfigType {
  android?: PluginConfigTypeAndroid;
  ios?: PluginConfigTypeIos;
}

/**
 * Config for Android native build properties
 */
export interface PluginConfigTypeAndroid {
  /** Override the default `minSdkVersion` version number in `build.gradle` */
  minSdkVersion?: number;

  /** Override the default `compileSdkVersion` version number in `build.gradle` */
  compileSdkVersion?: number;

  /** Override the default `targetSdkVersion` version number in `build.gradle` */
  targetSdkVersion?: number;

  /** Override the default `buildToolsVersion` version number in `build.gradle` */
  buildToolsVersion?: string;

  /** Override the default Kotlin version when building the app */
  kotlinVersion?: string;

  /** Enable Proguard (R8) in release builds to obfuscate Java code and reduce app size */
  enableProguardInReleaseBuilds?: boolean;

  /** Append custom [Proguard rules](https://www.guardsquare.com/manual/configuration/usage) to `android/app/proguard-rules.pro` */
  extraProguardRules?: string;

  /** AGP [PackagingOptions](https://developer.android.com/reference/tools/gradle-api/7.0/com/android/build/api/dsl/PackagingOptions) */
  packagingOptions?: PluginConfigTypeAndroidPackagingOptions;
}

/**
 * Config for iOS native build properties
 */
export interface PluginConfigTypeIos {
  /**
   * Override the default iOS *Deployment Target* version in the following projects:
   *  - in CocoaPods projects
   *  - `PBXNativeTarget` with `com.apple.product-type.application` productType in the app project
   */
  deploymentTarget?: string;

  /** Enable [`use_frameworks!`](https://guides.cocoapods.org/syntax/podfile.html#use_frameworks_bang) in `Podfile` */
  useFrameworks?: 'static' | 'dynamic';
}

/**
 * AGP [PackagingOptions](https://developer.android.com/reference/tools/gradle-api/7.0/com/android/build/api/dsl/PackagingOptions)
 */
export interface PluginConfigTypeAndroidPackagingOptions {
  /** Adds a first-pick pattern */
  pickFirst?: string[];

  /** Adds an excluded pattern */
  exclude?: string[];

  /** Adds a merge pattern */
  merge?: string[];

  /** Adds a doNotStrip pattern */
  doNotStrip?: string[];
}

const schema: JSONSchemaType<PluginConfigType> = {
  type: 'object',
  properties: {
    android: {
      type: 'object',
      properties: {
        minSdkVersion: { type: 'integer', nullable: true },
        compileSdkVersion: { type: 'integer', nullable: true },
        targetSdkVersion: { type: 'integer', nullable: true },
        buildToolsVersion: { type: 'string', nullable: true },
        kotlinVersion: { type: 'string', nullable: true },

        enableProguardInReleaseBuilds: { type: 'boolean', nullable: true },
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
      },
      nullable: true,
    },
    ios: {
      type: 'object',
      properties: {
        deploymentTarget: { type: 'string', pattern: '\\d+\\.\\d+', nullable: true },
        useFrameworks: { type: 'string', enum: ['static', 'dynamic'], nullable: true },
      },
      nullable: true,
    },
  },
};

/**
 * Check versions to meet expo minimal supported versions.
 * Will throw error message whenever there are invalid versions.
 * For the implementation, we check items one by one because ajv does not well support custom error message.
 *
 * @param config the validated config passed from ajv
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
  const validate = new Ajv().compile(schema);
  if (!validate(config)) {
    throw new Error('Invalid expo-build-properties config: ' + JSON.stringify(validate.errors));
  }

  maybeThrowInvalidVersions(config);
  return config;
}
