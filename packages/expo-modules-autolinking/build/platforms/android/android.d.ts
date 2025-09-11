import { AutolinkingOptions } from '../../commands/autolinkingOptions';
import type { ExtraDependencies, ModuleDescriptorAndroid, PackageRevision } from '../../types';
interface AndroidConfigurationOutput {
    buildFromSource: string[];
}
export declare function getConfiguration(options: AutolinkingOptions): AndroidConfigurationOutput | undefined;
/**
 * Generates Java file that contains all autolinked packages.
 */
export declare function generatePackageListAsync(modules: ModuleDescriptorAndroid[], targetPath: string, namespace: string): Promise<void>;
export declare function isAndroidProject(projectRoot: string): boolean;
export declare function resolveModuleAsync(packageName: string, revision: PackageRevision): Promise<ModuleDescriptorAndroid | null>;
export declare function resolveExtraBuildDependenciesAsync(projectNativeRoot: string): Promise<ExtraDependencies | null>;
export declare function resolveGradlePropertyAsync(projectNativeRoot: string, propertyKey: string): Promise<string | null>;
/**
 * Converts the package name to Android's project name.
 *   `/` path will transform as `-`
 *
 * Example: `@expo/example` + `android/build.gradle` → `expo-example`
 */
export declare function convertPackageToProjectName(packageName: string): string;
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
export declare function convertPackageWithGradleToProjectName(packageName: string, buildGradleFile: string): string;
/**
 * Given the contents of a `gradle.properties` file,
 * searches for a property with the given name.
 *
 * This function will return the first property found with the given name.
 * The implementation follows config-plugins and
 * tries to align the behavior with the `withGradleProperties` plugin.
 */
export declare function searchGradlePropertyFirst(contents: string, propertyName: string): string | null;
export {};
