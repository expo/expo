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
/**
 * @ignore
 */
export declare function validateConfig(config: any): PluginConfigType;
