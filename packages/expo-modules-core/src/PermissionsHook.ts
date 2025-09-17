// Copyright © 2024 650 Industries.

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { PermissionResponse } from './PermissionsInterface';

// These types are identical, but improves the readability for suggestions in editors
type RequestPermissionMethod<Permission extends PermissionResponse> = () => Promise<Permission>;
type GetPermissionMethod<Permission extends PermissionResponse> = () => Promise<Permission>;

type PermissionHookMethods<Permission extends PermissionResponse, Options = never> = {
  /** The permission method that requests the user to grant permission. */
  requestMethod: (options?: Options) => Promise<Permission>;
  /** The permission method that only fetches the current permission status. */
  getMethod: (options?: Options) => Promise<Permission>;
};

type PermissionHookBehavior = {
  /** If the hook should automatically fetch the current permission status, without asking the user. */
  get?: boolean;
  /** If the hook should automatically request the user to grant permission. */
  request?: boolean;
};

export type PermissionHookOptions<Options extends object> = PermissionHookBehavior & Options;

/**
 * Get or request permission for protected functionality within the app.
 * It uses separate permission requesters to interact with a single permission.
 * By default, the hook will only retrieve the permission status.
 */
function usePermission<Permission extends PermissionResponse, Options extends object>(
  methods: PermissionHookMethods<Permission, Options>,
  options?: PermissionHookOptions<Options>
): [Permission | null, RequestPermissionMethod<Permission>, GetPermissionMethod<Permission>] {
  const isMounted = useRef(true);
  const [status, setStatus] = useState<Permission | null>(null);
  const { get = true, request = false, ...permissionOptions } = options || {};

  const getPermission = useCallback(async () => {
    let response: Permission;
    if (Object.keys(permissionOptions).length > 0) {
      response = await methods.getMethod(permissionOptions as Options);
    } else {
      response = await methods.getMethod();
    }
    if (isMounted.current) setStatus(response);
    return response;
  }, [methods.getMethod]);

  const requestPermission = useCallback(async () => {
    let response: Permission;
    if (Object.keys(permissionOptions).length > 0) {
      response = await methods.requestMethod(permissionOptions as Options);
    } else {
      response = await methods.requestMethod();
    }
    if (isMounted.current) setStatus(response);
    return response;
  }, [methods.requestMethod]);

  useEffect(
    function runMethods() {
      if (request) requestPermission();
      if (!request && get) getPermission();
    },
    [get, request, requestPermission, getPermission]
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
export function createPermissionHook<Permission extends PermissionResponse, Options extends object>(
  methods: PermissionHookMethods<Permission, Options>
) {
  return (options?: PermissionHookOptions<Options>) =>
    usePermission<Permission, Options>(methods, options);
}
