import { ModuleDescriptorAndroid, PackageRevision } from '../types';
/**
 * Generates Java file that contains all autolinked packages.
 */
export declare function generatePackageListAsync(modules: ModuleDescriptorAndroid[], targetPath: string, namespace: string): Promise<void>;
export declare function resolveModuleAsync(packageName: string, revision: PackageRevision): Promise<ModuleDescriptorAndroid | null>;
/**
 * Converts the package name and gradle file path to Android's project name.
 *   `$` to indicate subprojects
 *   `/` path will transform as `-`
 *
 * Example: `@unimodules/core` + `android/build.gradle` → `unimodules-core`
 *
 * Example: multiple projects
 *   - `expo-test` + `android/build.gradle` → `react-native-third-party`
 *   - `expo-test` + `subproject/build.gradle` → `react-native-third-party$subproject`
 *
 * Example: third party expo adapter module
 *   - `react-native-third-party` + `expo/android/build.gradle` → `react-native-third-party$expo-android`
 */
export declare function convertPackageNameToProjectName(packageName: string, buildGradleFile: string): string;
