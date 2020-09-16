import { PermissionResponse } from 'unimodules-permissions-interface';
declare const _default: {
    readonly name: string;
    readonly CHANGE_LISTENER_NAME: string;
    readonly MediaType: {
        [key: string]: string;
    };
    readonly SortBy: {
        [key: string]: string;
    };
    getPermissionsAsync(): Promise<PermissionResponse>;
    requestPermissionsAsync(): Promise<PermissionResponse>;
};
export default _default;
