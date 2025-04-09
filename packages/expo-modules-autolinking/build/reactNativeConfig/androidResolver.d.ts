import type { RNConfigDependencyAndroid, RNConfigReactNativePlatformsConfigAndroid } from './reactNativeConfig.types';
export declare function resolveDependencyConfigImplAndroidAsync(packageRoot: string, reactNativeConfig: RNConfigReactNativePlatformsConfigAndroid | null | undefined): Promise<RNConfigDependencyAndroid | null>;
/**
 * Parse the `RNConfigDependencyAndroid.packageName`
 */
export declare function parsePackageNameAsync(androidDir: string, manifestPath: string | null, gradlePath: string | null): Promise<string | null>;
/**
 * Parse the Java or Kotlin class name to for `ReactPackage` or `(Base|Turbo)ReactPackage`.
 */
export declare function parseNativePackageClassNameAsync(packageRoot: string, androidDir: string): Promise<string | null>;
export declare function matchNativePackageClassName(_filePath: string, contents: Buffer): string | null;
export declare function parseLibraryNameAsync(androidDir: string, packageJson: any): Promise<string | null>;
export declare function parseComponentDescriptorsAsync(packageRoot: string, packageJson: any): Promise<string[]>;
export declare function findGradleAndManifestAsync({ androidDir, isLibrary, }: {
    androidDir: string;
    isLibrary: boolean;
}): Promise<{
    gradle: string | null;
    manifest: string | null;
}>;
