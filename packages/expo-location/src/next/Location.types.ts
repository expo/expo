import { PermissionResponse } from 'expo-modules-core';

// @needsAudit
export type PermissionDetailsLocationIOS = {
  /**
   * The scope of granted permission. Indicates when it's possible to use location.
   */
  scope: 'whenInUse' | 'always' | 'none';
};

// @needsAudit
export type PermissionDetailsLocationAndroid = {
  /**
   * Indicates the type of location provider.
   */
  accuracy: 'fine' | 'coarse' | 'none';
};

// @needsAudit
/**
 * `LocationPermissionResponse` extends [`PermissionResponse`](#permissionresponse)
 * type exported by `expo-modules-core` and contains additional platform-specific fields.
 */
export type LocationPermissionResponse = PermissionResponse & {
  ios?: PermissionDetailsLocationIOS;
  android?: PermissionDetailsLocationAndroid;
};

export type { PermissionResponse };
