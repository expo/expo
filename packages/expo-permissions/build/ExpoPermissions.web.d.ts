import { PermissionMap, PermissionType } from './Permissions.types';
declare const _default: {
    readonly name: string;
    getAsync(permissionTypes: PermissionType[]): Promise<PermissionMap>;
    askAsync(permissionTypes: PermissionType[]): Promise<PermissionMap>;
};
export default _default;
export declare function getRequestMotionPermission(): () => Promise<PermissionState> | null;
