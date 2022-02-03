import { PermissionExpiration, PermissionMap, PermissionStatus } from './Permissions.types';
export declare function coalesceStatuses(permissions: PermissionMap): PermissionStatus;
export declare function coalesceExpirations(permissions: PermissionMap): PermissionExpiration;
export declare function coalesceCanAskAgain(permissions: PermissionMap): boolean;
export declare function coalesceGranted(permissions: PermissionMap): boolean;
//# sourceMappingURL=CoalescedPermissions.d.ts.map