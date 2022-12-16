import { PermissionResponse, PermissionType } from './Permissions.types';
/**
 * Get or ask permission for protected functionality within the app.
 * It returns the permission response after fetching or asking it.
 * The hook fetches the permissions when rendered, by default.
 * To ask the user permission, use the `askPermission` callback or `ask` option.
 *
 * @see https://docs.expo.dev/versions/latest/sdk/permissions/
 * @example
 * ```tsx
 * const [permission, askPermission, getPermission] = usePermissions(Permissions.CAMERA);
 *
 * return permission?.granted
 *   ? <Camera ... />
 *   : <Button onPress={askPermission} />;
 * ```
 */
export declare function usePermissions(type: PermissionType | PermissionType[], options?: PermissionsOptions): [PermissionResponse | undefined, () => Promise<void>, () => Promise<void>];
export interface PermissionsOptions {
    /** If it should ask the permissions when mounted, defaults to `false` */
    ask?: boolean;
    /** If it should fetch information about the permissions when mounted, defaults to `true` */
    get?: boolean;
}
//# sourceMappingURL=PermissionsHooks.d.ts.map