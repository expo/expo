import type { RNConfigDependencyAndroid, RNConfigReactNativePlatformsConfigAndroid } from './reactNativeConfig.types';
export declare function resolveDependencyConfigImplAndroidAsync(packageRoot: string, reactNativeConfig: RNConfigReactNativePlatformsConfigAndroid | null | undefined): Promise<RNConfigDependencyAndroid | null>;
/**
 * Parse the `RNConfigDependencyAndroid.packageName`
 */
export declare function parsePackageNameAsync(manifestPath: string | null, gradlePath: string | null): Promise<string | null>;
/**
 * Parse the Java or Kotlin class name to for `ReactPackage` or `TurboReactPackage`.
 */
export declare function parseNativePackageClassNameAsync(packageRoot: string, androidDir: string): Promise<string | null>;
export declare function parseLibraryNameAsync(androidDir: string, packageJson: any): Promise<string | null>;
export declare function parseComponentDescriptorsAsync(packageRoot: string, pacakgeJson: any): Promise<string[]>;
export declare function findGradleAndManifestAsync({ androidDir, isLibrary, }: {
    androidDir: string;
    isLibrary: boolean;
}): Promise<{
    gradle: string;
    manifest: string;
}>;
