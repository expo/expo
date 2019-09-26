import { PermissionExpiration, PermissionMap, PermissionStatus } from './Permissions.types';
export declare function coalesceStatuses(permissions: PermissionMap): PermissionStatus;
export declare function coalesceExpirations(permissions: PermissionMap): PermissionExpiration;
