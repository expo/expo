import { PermissionResponse } from 'expo-modules-core';
import { MediaTypeObject, SortByObject } from './MediaLibrary';
declare const _default: {
    readonly name: string;
    readonly CHANGE_LISTENER_NAME: string;
    readonly MediaType: MediaTypeObject;
    readonly SortBy: SortByObject;
    getPermissionsAsync(_writeOnly: boolean): Promise<PermissionResponse>;
    requestPermissionsAsync(_writeOnly: boolean): Promise<PermissionResponse>;
};
export default _default;
//# sourceMappingURL=ExponentMediaLibrary.web.d.ts.map