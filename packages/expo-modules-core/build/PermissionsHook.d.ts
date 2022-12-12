import { PermissionResponse } from './PermissionsInterface';
type RequestPermissionMethod<Permission extends PermissionResponse> = () => Promise<Permission>;
type GetPermissionMethod<Permission extends PermissionResponse> = () => Promise<Permission>;
interface PermissionHookMethods<Permission extends PermissionResponse, Options = never> {
    /** The permission method that requests the user to grant permission. */
    requestMethod: (options?: Options) => Promise<Permission>;
    /** The permission method that only fetches the current permission status. */
    getMethod: (options?: Options) => Promise<Permission>;
}
interface PermissionHookBehavior {
    /** If the hook should automatically fetch the current permission status, without asking the user. */
    get?: boolean;
    /** If the hook should automatically request the user to grant permission. */
    request?: boolean;
}
export type PermissionHookOptions<Options extends object> = PermissionHookBehavior & Options;
/**
 * Create a new permission hook with the permission methods built-in.
 * This can be used to quickly create specific permission hooks in every module.
 */
export declare function createPermissionHook<Permission extends PermissionResponse, Options extends object>(methods: PermissionHookMethods<Permission, Options>): (options?: PermissionHookOptions<Options>) => [Permission | null, RequestPermissionMethod<Permission>, GetPermissionMethod<Permission>];
export {};
//# sourceMappingURL=PermissionsHook.d.ts.map