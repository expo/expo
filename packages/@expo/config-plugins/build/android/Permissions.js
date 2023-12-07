"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.addBlockedPermissions = addBlockedPermissions;
exports.addPermission = addPermission;
exports.addPermissionToManifest = addPermissionToManifest;
exports.ensurePermission = ensurePermission;
exports.ensurePermissionNameFormat = ensurePermissionNameFormat;
exports.ensurePermissions = ensurePermissions;
exports.getAndroidPermissions = getAndroidPermissions;
exports.getPermissions = getPermissions;
exports.isPermissionAlreadyRequested = isPermissionAlreadyRequested;
exports.removePermissions = removePermissions;
exports.setAndroidPermissions = setAndroidPermissions;
exports.withPermissions = exports.withInternalBlockedPermissions = exports.withBlockedPermissions = void 0;
function _Manifest() {
  const data = require("./Manifest");
  _Manifest = function () {
    return data;
  };
  return data;
}
function _androidPlugins() {
  const data = require("../plugins/android-plugins");
  _androidPlugins = function () {
    return data;
  };
  return data;
}
const USES_PERMISSION = 'uses-permission';
const withPermissions = (config, permissions) => {
  if (Array.isArray(permissions)) {
    permissions = permissions.filter(Boolean);
    if (!config.android) config.android = {};
    if (!config.android.permissions) config.android.permissions = [];
    config.android.permissions = [
    // @ts-ignore
    ...new Set(config.android.permissions.concat(permissions))];
  }
  return (0, _androidPlugins().withAndroidManifest)(config, async config => {
    config.modResults = await setAndroidPermissions(config, config.modResults);
    return config;
  });
};

/** Given a permission or list of permissions, block permissions in the final `AndroidManifest.xml` to ensure no installed library or plugin can add them. */
exports.withPermissions = withPermissions;
const withBlockedPermissions = (config, permissions) => {
  var _config$android;
  const resolvedPermissions = prefixAndroidPermissionsIfNecessary((Array.isArray(permissions) ? permissions : [permissions]).filter(Boolean));
  if (config !== null && config !== void 0 && (_config$android = config.android) !== null && _config$android !== void 0 && _config$android.permissions && Array.isArray(config.android.permissions)) {
    // Remove any static config permissions
    config.android.permissions = prefixAndroidPermissionsIfNecessary(config.android.permissions).filter(permission => !resolvedPermissions.includes(permission));
  }
  return (0, _androidPlugins().withAndroidManifest)(config, async config => {
    config.modResults = (0, _Manifest().ensureToolsAvailable)(config.modResults);
    config.modResults = addBlockedPermissions(config.modResults, resolvedPermissions);
    return config;
  });
};
exports.withBlockedPermissions = withBlockedPermissions;
const withInternalBlockedPermissions = config => {
  var _config$android2, _config$android2$bloc;
  // Only add permissions if the user defined the property and added some values
  // this ensures we don't add the `tools:*` namespace extraneously.
  if ((_config$android2 = config.android) !== null && _config$android2 !== void 0 && (_config$android2$bloc = _config$android2.blockedPermissions) !== null && _config$android2$bloc !== void 0 && _config$android2$bloc.length) {
    return withBlockedPermissions(config, config.android.blockedPermissions);
  }
  return config;
};
exports.withInternalBlockedPermissions = withInternalBlockedPermissions;
function addBlockedPermissions(androidManifest, permissions) {
  if (!Array.isArray(androidManifest.manifest['uses-permission'])) {
    androidManifest.manifest['uses-permission'] = [];
  }
  for (const permission of prefixAndroidPermissionsIfNecessary(permissions)) {
    androidManifest.manifest['uses-permission'] = ensureBlockedPermission(androidManifest.manifest['uses-permission'], permission);
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
function ensureBlockedPermission(manifestPermissions, permission) {
  // Remove permission if it currently exists
  manifestPermissions = manifestPermissions.filter(e => e.$['android:name'] !== permission);

  // Add a permission with tools:node to overwrite any existing permission and ensure it's removed upon building.
  manifestPermissions.push({
    $: {
      'android:name': permission,
      'tools:node': 'remove'
    }
  });
  return manifestPermissions;
}
function prefixAndroidPermissionsIfNecessary(permissions) {
  return permissions.map(permission => {
    if (!permission.includes('.')) {
      return `android.permission.${permission}`;
    }
    return permission;
  });
}
function getAndroidPermissions(config) {
  var _config$android$permi, _config$android3;
  return (_config$android$permi = (_config$android3 = config.android) === null || _config$android3 === void 0 ? void 0 : _config$android3.permissions) !== null && _config$android$permi !== void 0 ? _config$android$permi : [];
}
function setAndroidPermissions(config, androidManifest) {
  var _androidManifest$mani;
  const permissions = getAndroidPermissions(config);
  const providedPermissions = prefixAndroidPermissionsIfNecessary(permissions);
  const permissionsToAdd = [...providedPermissions];
  if (!androidManifest.manifest.hasOwnProperty('uses-permission')) {
    androidManifest.manifest['uses-permission'] = [];
  }
  // manifest.manifest['uses-permission'] = [];

  const manifestPermissions = (_androidManifest$mani = androidManifest.manifest['uses-permission']) !== null && _androidManifest$mani !== void 0 ? _androidManifest$mani : [];
  permissionsToAdd.forEach(permission => {
    if (!isPermissionAlreadyRequested(permission, manifestPermissions)) {
      addPermissionToManifest(permission, manifestPermissions);
    }
  });
  return androidManifest;
}
function isPermissionAlreadyRequested(permission, manifestPermissions) {
  return manifestPermissions.some(e => e.$['android:name'] === permission);
}
function addPermissionToManifest(permission, manifestPermissions) {
  manifestPermissions.push({
    $: {
      'android:name': permission
    }
  });
  return manifestPermissions;
}
function removePermissions(androidManifest, permissionNames) {
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
function addPermission(androidManifest, permissionName) {
  const usesPermissions = androidManifest.manifest[USES_PERMISSION] || [];
  usesPermissions.push({
    $: {
      'android:name': permissionName
    }
  });
  androidManifest.manifest[USES_PERMISSION] = usesPermissions;
}
function ensurePermissions(androidManifest, permissionNames) {
  const permissions = getPermissions(androidManifest);
  const results = {};
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
function ensurePermission(androidManifest, permissionName) {
  const permissions = getPermissions(androidManifest);
  const targetName = ensurePermissionNameFormat(permissionName);
  if (!permissions.includes(targetName)) {
    addPermission(androidManifest, targetName);
    return true;
  }
  return false;
}
function ensurePermissionNameFormat(permissionName) {
  if (permissionName.includes('.')) {
    const com = permissionName.split('.');
    const name = com.pop();
    return [...com, name.toUpperCase()].join('.');
  } else {
    // If shorthand form like `WRITE_CONTACTS` is provided, expand it to `android.permission.WRITE_CONTACTS`.
    return ensurePermissionNameFormat(`android.permission.${permissionName}`);
  }
}
function getPermissions(androidManifest) {
  const usesPermissions = androidManifest.manifest[USES_PERMISSION] || [];
  const permissions = usesPermissions.map(permissionObject => {
    return permissionObject.$['android:name'] || permissionObject.$.name;
  });
  return permissions;
}
//# sourceMappingURL=Permissions.js.map