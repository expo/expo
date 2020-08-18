import { useCallback, useEffect, useState } from 'react';

import { askAsync, getAsync } from './Permissions';
import { PermissionResponse, PermissionType } from './Permissions.types';

/**
 * Get or ask permission for protected functionality within the app.
 * It returns the permission response after fetching or asking it.
 * The hook fetches the permissions when rendered, by default.
 * To ask the user permission, use the `askPermission` callback or `ask` option.
 *
 * @see https://docs.expo.io/versions/latest/sdk/permissions/
 * @example
 * ```tsx
 * const [permission, askPermission, getPermission] = usePermissions(Permissions.CAMERA);
 *
 * return permission?.granted
 *   ? <Camera ... />
 *   : <Button onPress={askPermission} />;
 * ```
 */
export function usePermissions(
  type: PermissionType | PermissionType[],
  options: PermissionsOptions = {}
): [PermissionResponse | undefined, () => Promise<void>, () => Promise<void>] {
  const [data, setData] = useState<PermissionResponse>();
  const { ask = false, get = true } = options;
  const types = Array.isArray(type) ? type : [type];

  // note: its intentional to listen to `type`, not `types`.
  // when `type` is casted to an array, it possible creates a new one on every render.
  // to prevent unnecessary function instances we need to listen to the "raw" value.

  const askPermissions = useCallback(() => askAsync(...types).then(setData), [type]);

  const getPermissions = useCallback(() => getAsync(...types).then(setData), [type]);

  useEffect(() => {
    if (ask) {
      askPermissions();
    }

    if (!ask && get) {
      getPermissions();
    }
  }, [ask, askPermissions, get, getPermissions]);

  return [data, askPermissions, getPermissions];
}

export interface PermissionsOptions {
  /** If it should ask the permissions when mounted, defaults to `false` */
  ask?: boolean;
  /** If it should fetch information about the permissions when mounted, defaults to `true` */
  get?: boolean;
}
