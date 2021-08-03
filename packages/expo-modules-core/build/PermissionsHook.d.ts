import { PermissionResponse } from './PermissionsInterface';
interface PermissionHookFactoryOptions<T extends PermissionResponse> {
    /** The permission method that requests the user to grant permission. */
    requestMethod?: () => Promise<T>;
    /** The permission method that only fetches the current permission status. */
    getMethod?: () => Promise<T>;
}
export interface PermissionHookOptions {
    /** If the hook should automatically fetch the current permission status, without asking the user. */
    get?: boolean;
    /** If the hook should automatically request the user to grant permission. */
    request?: boolean;
}
declare type RequestPermissionMethod<T extends PermissionResponse> = () => Promise<T | null>;
declare type GetPermissionMethod<T extends PermissionResponse> = () => Promise<T | null>;
/**
 * Create a new permission hook with the permission methods built-in.
 * This can be used to quickly create specific permission hooks in every module.
 */
export declare function createPermissionHook<T extends PermissionResponse>(factoryOptions: PermissionHookFactoryOptions<T>): (options?: PermissionHookOptions) => [T | null, RequestPermissionMethod<T>, GetPermissionMethod<T>];
export {};
