import { PermissionResponse } from 'unimodules-permissions-interface';
import { ImagePickerResult, ImagePickerOptions } from './ImagePicker.types';
declare const _default: {
    readonly name: string;
    launchImageLibraryAsync({ mediaTypes, allowsMultipleSelection, }: ImagePickerOptions): Promise<ImagePickerResult>;
    launchCameraAsync({ mediaTypes, allowsMultipleSelection, }: ImagePickerOptions): Promise<ImagePickerResult>;
    getCameraPermissionsAsync(): Promise<PermissionResponse>;
    requestCameraPermissionsAsync(): Promise<PermissionResponse>;
    getCameraRollPermissionsAsync(): Promise<PermissionResponse>;
    requestCameraRollPermissionsAsync(): Promise<PermissionResponse>;
};
export default _default;
