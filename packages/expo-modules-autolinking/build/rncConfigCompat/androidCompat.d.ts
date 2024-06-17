import type { RncConfigCompatDependencyConfigAndroid, RncConfigCompatReactNativePlatformsConfigAndroid } from './rncConfigCompat.types';
export declare function resolveDependencyConfigImplAndroidAsync(packageRoot: string, reactNativeConfig: RncConfigCompatReactNativePlatformsConfigAndroid | null | undefined): Promise<RncConfigCompatDependencyConfigAndroid | null>;
/**
 * Parse the `RncConfigCompatDependencyConfigAndroid.packageName`
 */
export declare function parsePackageNameAsync(manifestPath: string | null, gradlePath: string | null): Promise<string | null>;
/**
 * Parse the Java or Kotlin class name to for `ReactPackage` or `TurboReactPackage`.
 */
export declare function parseNativePackageClassNameAsync(packageRoot: string, androidDir: string): Promise<string | null>;
export declare function parseLibraryNameAsync(androidDir: string, packageJson: any): Promise<string | null>;
export declare function parseComponentDescriptorsAsync(packageRoot: string, pacakgeJson: any): Promise<string[]>;
