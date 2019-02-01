import { PermissionMap } from './Permissions.types';
declare const _default: {
    readonly name: string;
    getAsync(permissionTypes: string[]): Promise<PermissionMap>;
    askAsync(permissionTypes: string[]): Promise<PermissionMap>;
};
export default _default;
