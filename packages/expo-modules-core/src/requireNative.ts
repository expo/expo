import { ensureNativeModulesAreInstalled } from './ensureNativeModulesAreInstalled';

/**
 * Imports the native modules and shared object classes of the npm package with the given name,
 * installed as `expo.packages[packageName]`. Only modules declared with the Expo Modules API 2.0 macros
 * (`@ExpoModule`) are exported by package. Modules from the app's `modules` directory and inline
 * modules are in the `$local` package. Use `requireNativeModule` for other modules.
 *
 * @platform ios
 * @param packageName Name of the npm package that provides the native modules, or `$local`.
 * @returns Object with the package's native modules and shared object classes, keyed by their names.
 * @throws Error when the package has no native modules.
 */
export function requireNative<PackageType = any>(packageName: string): PackageType {
  const nativePackage = requireOptionalNative<PackageType>(packageName);

  if (!nativePackage) {
    throw new Error(
      `Cannot find native modules of the '${packageName}' package. ` +
        `Only modules declared with the Expo Modules API 2.0 macros (\`@ExpoModule\`) are exported by package, and only on iOS. ` +
        `Use \`requireNativeModule\` for other modules. If the package has such modules, make sure it is installed and rebuild the app, because native code changes require a new build.`
    );
  }
  return nativePackage;
}

/**
 * Imports the native modules and shared object classes of the npm package with the given name.
 * The same as `requireNative`, but returns `null` when the package has no native modules instead of throwing an error.
 *
 * @platform ios
 * @param packageName Name of the npm package that provides the native modules, or `$local`.
 * @returns Object with the package's native modules and shared object classes, or `null` when it cannot be found.
 */
export function requireOptionalNative<PackageType = any>(packageName: string): PackageType | null {
  ensureNativeModulesAreInstalled();
  return globalThis.expo?.packages?.[packageName] ?? null;
}
