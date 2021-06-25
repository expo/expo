import { PermissionResponse } from 'expo-modules-core';
declare const _default: {
    readonly name: string;
    readonly CHANGE_LISTENER_NAME: string;
    readonly MediaType: {
        [key: string]: string;
    };
    readonly SortBy: {
        [key: string]: string;
    };
    getPermissionsAsync(_writeOnly: boolean): Promise<PermissionResponse>;
    requestPermissionsAsync(_writeOnly: boolean): Promise<PermissionResponse>;
};
export default _default;
