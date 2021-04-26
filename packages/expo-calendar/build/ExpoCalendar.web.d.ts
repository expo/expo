import { PermissionResponse } from 'unimodules-permissions-interface';
declare const _default: {
    readonly name: string;
    requestCalendarPermissionsAsync(): Promise<PermissionResponse>;
    getCalendarPermissionsAsync(): Promise<PermissionResponse>;
    getRemindersPermissionsAsync(): Promise<PermissionResponse>;
    requestRemindersPermissionsAsync(): Promise<PermissionResponse>;
};
export default _default;
