import Ajv, { JSONSchemaType } from 'ajv';

/**
 * Configuration for `expo-build-properties` passing from `app.json` or `app.config.js`
 */
export interface PluginConfigType {
  android?: PluginConfigTypeAndroid;
  ios?: PluginConfigTypeIos;
}

/**
 * Config for Android native build properties
 */
export interface PluginConfigTypeAndroid {
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
  /** Override the default iOS *Deployment Target* version in app project and CocoaPods projects */
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
 * @ignore
 */
export function validateConfig(config: any): PluginConfigType {
  const validate = new Ajv().compile(schema);
  if (!validate(config)) {
    throw new Error('Invalid expo-build-properties config: ' + JSON.stringify(validate.errors));
  }
  return config;
}
