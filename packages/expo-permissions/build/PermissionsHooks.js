import { useCallback, useEffect, useState } from 'react';
import { askAsync, getAsync } from './Permissions';
/**
 * Get or ask permission for protected functionality within the app.
 * It returns the permission response after fetching or asking it.
 * The hook fetches the permissions when rendered, by default.
 * To ask the user permission, use the `askPermission` callback or `ask` option.
 *
 * @see https://docs.expo.io/versions/latest/sdk/permissions/
 * @example const [permission, askPermission, getPermission] = usePermissions(...);
 */
export function usePermissions(type, options = {}) {
    const [data, setData] = useState();
    const { ask = false, get = true } = options;
    const types = Array.isArray(type) ? type : [type];
    // note: its intentional to listen to `type`, not `types`.
    // when `type` is casted to an array, it possible creates a new one on every render.
    // to prevent unnecessary function instances we need to listen to the "raw" value.
    const askPermissions = useCallback(() => askAsync(...types).then(setData), [type]); // eslint-disable-line react-hooks/exhaustive-deps
    const getPermissions = useCallback(() => getAsync(...types).then(setData), [type]); // eslint-disable-line react-hooks/exhaustive-deps
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
//# sourceMappingURL=PermissionsHooks.js.map