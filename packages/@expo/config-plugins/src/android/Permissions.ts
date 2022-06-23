import { ExpoConfig } from '@expo/config-types';

import { ConfigPlugin } from '../Plugin.types';
import { withAndroidManifest } from '../plugins/android-plugins';
import { AndroidManifest, ensureToolsAvailable, ManifestUsesPermission } from './Manifest';

const USES_PERMISSION = 'uses-permission';

export const withPermissions: ConfigPlugin<string[] | void> = (config, permissions) => {
  if (Array.isArray(permissions)) {
    permissions = permissions.filter(Boolean);
    if (!config.android) config.android = {};
    if (!config.android.permissions) config.android.permissions = [];
    config.android.permissions = [
      // @ts-ignore
      ...new Set(config.android.permissions.concat(permissions)),
    ];
  }
  return withAndroidManifest(config, async config => {
    config.modResults = await setAndroidPermissions(config, config.modResults);
    return config;
  });
};

/** Given a permission or list of permissions, block permissions in the final `AndroidManifest.xml` to ensure no installed library or plugin can add them. */
export const withBlockedPermissions: ConfigPlugin<string[] | string> = (config, permissions) => {
  const resolvedPermissions = (Array.isArray(permissions) ? permissions : [permissions]).filter(
    Boolean
  );

  if (config?.android?.permissions && Array.isArray(config.android.permissions)) {
    // Remove any static config permissions
    config.android.permissions = config.android.permissions.filter(
      permission => !resolvedPermissions.includes(permission)
    );
  }

  return withAndroidManifest(config, async config => {
    config.modResults = ensureToolsAvailable(config.modResults);
    config.modResults = addBlockedPermissions(config.modResults, resolvedPermissions);
    return config;
  });
};

export const withInternalBlockedPermissions: ConfigPlugin = config => {
  // Only add permissions if the user defined the property and added some values
  // this ensures we don't add the `tools:*` namespace extraneously.
  if (config.android?.blockedPermissions?.length) {
    return withBlockedPermissions(config, config.android.blockedPermissions);
  }

  return config;
};

export function addBlockedPermissions(androidManifest: AndroidManifest, permissions: string[]) {
  if (!Array.isArray(androidManifest.manifest['uses-permission'])) {
    androidManifest.manifest['uses-permission'] = [];
  }

  for (const permission of permissions) {
    androidManifest.manifest['uses-permission'] = ensureBlockedPermission(
      androidManifest.manifest['uses-permission'],
      permission
    );
  }

  return androidManifest;
}

/**
 * Filter any existing permissions matching the provided permission name, then add a
 * restricted permission to overwrite any extra permissions that may be added in a
 * third-party package's AndroidManifest.xml.
 *
 * @param manifestPermissions manifest `uses-permissions` array.
 * @param permission `android:name` of the permission to restrict
 * @returns
 */
function ensureBlockedPermission(
  manifestPermissions: ManifestUsesPermission[],
  permission: string
) {
  // Remove permission if it currently exists
  manifestPermissions = manifestPermissions.filter(e => e.$['android:name'] !== permission);

  // Add a permission with tools:node to overwrite any existing permission and ensure it's removed upon building.
  manifestPermissions.push({
    $: { 'android:name': permission, 'tools:node': 'remove' },
  });
  return manifestPermissions;
}

function prefixAndroidPermissionsIfNecessary(permissions: string[]): string[] {
  return permissions.map(permission => {
    if (!permission.includes('.')) {
      return `android.permission.${permission}`;
    }
    return permission;
  });
}

export function getAndroidPermissions(config: Pick<ExpoConfig, 'android'>): string[] {
  return config.android?.permissions ?? [];
}

export function setAndroidPermissions(
  config: Pick<ExpoConfig, 'android'>,
  androidManifest: AndroidManifest
) {
  const permissions = getAndroidPermissions(config);
  const providedPermissions = prefixAndroidPermissionsIfNecessary(permissions);
  const permissionsToAdd = [...providedPermissions];

  if (!androidManifest.manifest.hasOwnProperty('uses-permission')) {
    androidManifest.manifest['uses-permission'] = [];
  }
  // manifest.manifest['uses-permission'] = [];

  const manifestPermissions = androidManifest.manifest['uses-permission'] ?? [];

  permissionsToAdd.forEach(permission => {
    if (!isPermissionAlreadyRequested(permission, manifestPermissions)) {
      addPermissionToManifest(permission, manifestPermissions);
    }
  });

  return androidManifest;
}

export function isPermissionAlreadyRequested(
  permission: string,
  manifestPermissions: ManifestUsesPermission[]
): boolean {
  return manifestPermissions.some(e => e.$['android:name'] === permission);
}

export function addPermissionToManifest(
  permission: string,
  manifestPermissions: ManifestUsesPermission[]
) {
  manifestPermissions.push({ $: { 'android:name': permission } });
  return manifestPermissions;
}

export function removePermissions(androidManifest: AndroidManifest, permissionNames?: string[]) {
  const targetNames = permissionNames ? permissionNames.map(ensurePermissionNameFormat) : null;
  const permissions = androidManifest.manifest[USES_PERMISSION] || [];
  const nextPermissions = [];
  for (const attribute of permissions) {
    if (targetNames) {
      // @ts-ignore: name isn't part of the type
      const value = attribute.$['android:name'] || attribute.$.name;
      if (!targetNames.includes(value)) {
        nextPermissions.push(attribute);
      }
    }
  }

  androidManifest.manifest[USES_PERMISSION] = nextPermissions;
}

export function addPermission(androidManifest: AndroidManifest, permissionName: string): void {
  const usesPermissions: ManifestUsesPermission[] = androidManifest.manifest[USES_PERMISSION] || [];
  usesPermissions.push({
    $: { 'android:name': permissionName },
  });
  androidManifest.manifest[USES_PERMISSION] = usesPermissions;
}

export function ensurePermissions(
  androidManifest: AndroidManifest,
  permissionNames: string[]
): { [permission: string]: boolean } {
  const permissions = getPermissions(androidManifest);

  const results: { [permission: string]: boolean } = {};
  for (const permissionName of permissionNames) {
    const targetName = ensurePermissionNameFormat(permissionName);
    if (!permissions.includes(targetName)) {
      addPermission(androidManifest, targetName);
      results[permissionName] = true;
    } else {
      results[permissionName] = false;
    }
  }
  return results;
}

export function ensurePermission(
  androidManifest: AndroidManifest,
  permissionName: string
): boolean {
  const permissions = getPermissions(androidManifest);
  const targetName = ensurePermissionNameFormat(permissionName);

  if (!permissions.includes(targetName)) {
    addPermission(androidManifest, targetName);
    return true;
  }
  return false;
}

export function ensurePermissionNameFormat(permissionName: string): string {
  if (permissionName.includes('.')) {
    const com = permissionName.split('.');
    const name = com.pop() as string;
    return [...com, name.toUpperCase()].join('.');
  } else {
    // If shorthand form like `WRITE_CONTACTS` is provided, expand it to `android.permission.WRITE_CONTACTS`.
    return ensurePermissionNameFormat(`android.permission.${permissionName}`);
  }
}

export function getPermissions(androidManifest: AndroidManifest): string[] {
  const usesPermissions: { [key: string]: any }[] = androidManifest.manifest[USES_PERMISSION] || [];
  const permissions = usesPermissions.map(permissionObject => {
    return permissionObject.$['android:name'] || permissionObject.$.name;
  });
  return permissions;
}
