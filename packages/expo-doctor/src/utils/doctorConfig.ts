import { ExpoConfig, PackageJSONConfig } from '@expo/config';

import { env } from './env';
import { gteSdkVersion } from './versions';

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
 *      },
 *      "appConfigFieldsNotSyncedCheck": {
 *        "enabled": false
 *      },
 *    }
 *  }
 * ```
 **/

interface DoctorPackageJsonConfig {
  reactNativeDirectoryCheck?: {
    enabled?: boolean;
    exclude?: string[];
    listUnknownPackages?: boolean;
  };
  appConfigFieldsNotSyncedCheck?: { enabled?: boolean };
}

export function getDoctorConfig(pkg: any): DoctorPackageJsonConfig {
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

export function getReactNativeDirectoryCheckEnabled(exp: ExpoConfig, pkg: PackageJSONConfig) {
  const isEnabledByDefault = gteSdkVersion(exp, '52.0.0');
  const pkgJsonConfigSetting = getDoctorConfig(pkg).reactNativeDirectoryCheck?.enabled;

  if (env.EXPO_DOCTOR_ENABLE_DIRECTORY_CHECK !== null) {
    if (typeof pkgJsonConfigSetting === 'boolean') {
      console.warn(
        'Both EXPO_DOCTOR_ENABLE_DIRECTORY_CHECK and config.reactNativeDirectoryCheck.enabled are set. Using EXPO_DOCTOR_ENABLE_DIRECTORY_CHECK.'
      );
    }

    return env.EXPO_DOCTOR_ENABLE_DIRECTORY_CHECK;
  }

  return pkgJsonConfigSetting ?? isEnabledByDefault;
}

export function getReactNativeDirectoryCheckListUnknownPackagesEnabled(pkg: any): boolean | null {
  const config = getDoctorConfig(pkg);
  const listUnknownPackages = config.reactNativeDirectoryCheck?.listUnknownPackages;

  // Default to null if config is missing
  if (typeof listUnknownPackages !== 'boolean') {
    return null;
  }

  return listUnknownPackages;
}

/**
 * Get status of appConfigFieldsNotSyncedCheck check
 * @param pkg package.json
 * @returns true if the check is enabled, false otherwise
 */
export function getAppConfigFieldsNotSyncedCheckStatus(pkg: any): boolean {
  const config = getDoctorConfig(pkg);
  return config.appConfigFieldsNotSyncedCheck?.enabled ?? true;
}
