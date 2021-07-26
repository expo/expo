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
declare type RequestPermissionMethod = () => Promise<PermissionResponse | null>;
declare type GetPermissionMethod = () => Promise<PermissionResponse | null>;
/**
 * Create a new permission hook with the permission methods built-in.
 * This can be used to quickly create specific permission hooks in every module.
 */
export declare function createPermissionHook(factoryOptions: PermissionHookFactoryOptions): (options: PermissionHookOptions) => [PermissionResponse | null, RequestPermissionMethod, GetPermissionMethod];
export {};
