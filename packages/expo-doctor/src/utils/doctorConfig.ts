import { env } from './env';

/**
 * Get the doctor config from the package.json.
 * The config is optional, and defaults to false for enabled and true for listUnknownPackages.
 *
 * Example config:
 *
 * ```json
 * {
 *  "expo": {
 *    "doctor": {
 *      "reactNativeDirectoryCheck": {
 *        "enabled": true,
 *        "exclude": ["/foo/", "bar"]
 *        "listUnknownPackages": true,
 *      }
 *    }
 *  }
 * ```
 **/

export function getDoctorConfig(pkg: any) {
  return pkg?.expo?.doctor ?? {};
}

export function getReactNativeDirectoryCheckExcludes(pkg: any) {
  const config = getDoctorConfig(pkg);
  return (config.reactNativeDirectoryCheck?.exclude ?? []).map((ignoredPackage: string) => {
    if (
      typeof ignoredPackage === 'string' &&
      ignoredPackage.startsWith('/') &&
      ignoredPackage.endsWith('/')
    ) {
      // Remove the leading and trailing slashes
      return new RegExp(ignoredPackage.slice(1, -1));
    }
    return ignoredPackage;
  });
}

export function getReactNativeDirectoryCheckEnabled(pkg: any) {
  const pkgJsonConfigSetting = getDoctorConfig(pkg).reactNativeDirectoryCheck?.enabled;

  if (env.EXPO_DOCTOR_ENABLE_DIRECTORY_CHECK !== null) {
    if (typeof pkgJsonConfigSetting === 'boolean') {
      console.warn(
        'Both EXPO_DOCTOR_ENABLE_DIRECTORY_CHECK and config.reactNativeDirectoryCheck.enabled are set. Using EXPO_DOCTOR_ENABLE_DIRECTORY_CHECK.'
      );
    }

    return env.EXPO_DOCTOR_ENABLE_DIRECTORY_CHECK;
  }

  return pkgJsonConfigSetting ?? false;
}

export function getReactNativeDirectoryCheckListUnknownPackagesEnabled(pkg: any) {
  const config = getDoctorConfig(pkg);
  const listUnknownPackages = config.reactNativeDirectoryCheck?.listUnknownPackages;

  // Default to true if config is missing
  if (typeof listUnknownPackages !== 'boolean') {
    return true;
  }

  return listUnknownPackages;
}
