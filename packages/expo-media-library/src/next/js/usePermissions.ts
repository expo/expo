import { createPermissionHook } from 'expo';

import type { GranularPermission, PermissionResponse } from '../types';
import { getPermissions, requestPermissions } from './MediaLibrary';

/**
 * Check or request permissions to access the media library.
 * This uses both `MediaLibrary.requestPermissions` and `MediaLibrary.getPermissions` to interact with the permissions.
 *
 * @example
 * ```ts
 * const [permissionResponse, requestPermission] = usePermissions({
 *   writeOnly: true,
 *   granularPermissions: ['photo'],
 * });
 * ```
 */
export const usePermissions = createPermissionHook<
  PermissionResponse,
  { writeOnly?: boolean; granularPermissions?: GranularPermission[] }
>({
  getMethod: (options) => getPermissions(options?.writeOnly, options?.granularPermissions),
  requestMethod: (options) => requestPermissions(options?.writeOnly, options?.granularPermissions),
});
