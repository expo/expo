import { PermissionResponse } from 'unimodules-permissions-interface';
declare const _default: {
    readonly name: string;
    getPermissionsAsync(): Promise<PermissionResponse>;
    requestPermissionsAsync(): Promise<PermissionResponse>;
};
export default _default;
