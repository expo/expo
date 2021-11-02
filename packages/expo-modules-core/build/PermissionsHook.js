import { useCallback, useEffect, useRef, useState } from 'react';
/**
 * Get or request permission for protected functionality within the app.
 * It uses separate permission requesters to interact with a single permission.
 * By default, the hook will only retrieve the permission status.
 */
function usePermission(methods, options) {
    const isMounted = useRef(true);
    const [status, setStatus] = useState(null);
    const { get = true, request = false, ...permissionOptions } = options || {};
    const getPermission = useCallback(async () => {
        const response = await methods.getMethod(Object.keys(permissionOptions).length > 0 ? permissionOptions : undefined);
        if (isMounted.current)
            setStatus(response);
        return response;
    }, [methods.getMethod]);
    const requestPermission = useCallback(async () => {
        const response = await methods.requestMethod(Object.keys(permissionOptions).length > 0 ? permissionOptions : undefined);
        if (isMounted.current)
            setStatus(response);
        return response;
    }, [methods.requestMethod]);
    useEffect(function runMethods() {
        if (request)
            requestPermission();
        if (!request && get)
            getPermission();
    }, [get, request, requestPermission, getPermission]);
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
export function createPermissionHook(methods) {
    return (options) => usePermission(methods, options);
}
//# sourceMappingURL=PermissionsHook.js.map