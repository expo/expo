import { useCallback, useEffect, useRef, useState } from 'react';

import { PermissionResponse } from './PermissionsInterface';

interface PermissionHookFactoryOptions {
  /** The permission method that requests the user to grant permission. */
  requestMethod?: () => Promise<PermissionResponse>;
  /** The permission method that only fetches the current permission status. */
  getMethod?: () => Promise<PermissionResponse>;
}

export interface PermissionHookOptions {
  /** If the hook should automatically fetch the current permission status, without asking the user. */
  get?: boolean;
  /** If the hook should automatically request the user to grant permission. */
  request?: boolean;
}

// These types are identical, but improves the readability for suggestions in editors
type RequestPermissionMethod = () => Promise<PermissionResponse | null>;
type GetPermissionMethod = () => Promise<PermissionResponse | null>;

/**
 * Get or request permission for protected functionality within the app.
 * It uses separate permission requesters to interact with a single permission.
 * By default, the hook will only retrieve the permission status.
 */
function usePermission(
  options: PermissionHookOptions & PermissionHookFactoryOptions
): [PermissionResponse | null, RequestPermissionMethod, GetPermissionMethod] {
  const isMounted = useRef(true);
  const [status, setStatus] = useState<PermissionResponse | null>(null);
  const { getMethod, requestMethod, get = true, request = false } = options;

  const getPermission = useCallback(async () => {
    if (!getMethod) return null;
    const response = await getMethod();
    if (isMounted.current) setStatus(response);
    return response;
  }, [getMethod]);

  const requestPermission = useCallback(async () => {
    if (!requestMethod) return null;
    const response = await requestMethod();
    if (isMounted.current) setStatus(response);
    return response;
  }, [requestMethod]);

  useEffect(
    function runMethods() {
      if (request) requestPermission();
      if (!request && get) getPermission();
    },
    [get, request, getMethod, requestMethod]
  );

  // Workaround for unmounting components receiving state updates
  useEffect(function didMount() {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  return [status, requestPermission, getPermission];
}

/**
 * Create a new permission hook with the permission methods built-in.
 * This can be used to quickly create specific permission hooks in every module.
 */
export function createPermissionHook(factoryOptions: PermissionHookFactoryOptions) {
  return (options: PermissionHookOptions) => usePermission({ ...factoryOptions, ...options });
}
