import type { ExtraDependencies, ModuleDescriptorAndroid, PackageRevision } from '../types';
/**
 * Generates Java file that contains all autolinked packages.
 */
export declare function generatePackageListAsync(modules: ModuleDescriptorAndroid[], targetPath: string, namespace: string): Promise<void>;
export declare function resolveModuleAsync(packageName: string, revision: PackageRevision): Promise<ModuleDescriptorAndroid | null>;
export declare function resolveExtraBuildDependenciesAsync(projectNativeRoot: string): Promise<ExtraDependencies | null>;
/**
 * Converts the package name and gradle file path to Android's project name.
 *   `$` to indicate subprojects
 *   `/` path will transform as `-`
 *
 * Example: `@expo/example` + `android/build.gradle` → `expo-example`
 *
 * Example: multiple projects
 *   - `expo-test` + `android/build.gradle` → `react-native-third-party`
 *   - `expo-test` + `subproject/build.gradle` → `react-native-third-party$subproject`
 */
export declare function convertPackageNameToProjectName(packageName: string, buildGradleFile: string): string;
/**
 * Given the contents of a `gradle.properties` file,
 * searches for a property with the given name.
 *
 * This function will return the first property found with the given name.
 * The implementation follows config-plugins and
 * tries to align the behavior with the `withGradleProperties` plugin.
 */
export declare function searchGradlePropertyFirst(contents: string, propertyName: string): string | null;
