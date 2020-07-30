import { PermissionResponse } from 'unimodules-permissions-interface';
import { ImagePickerResult, ImagePickerOptions, Expand, ImagePickerMultipleResult } from './ImagePicker.types';
declare const _default: {
    readonly name: string;
    launchImageLibraryAsync({ mediaTypes, allowsMultipleSelection, }: ImagePickerOptions): Promise<ImagePickerResult | ImagePickerMultipleResult>;
    launchCameraAsync({ mediaTypes, allowsMultipleSelection, }: ImagePickerOptions): Promise<ImagePickerResult | ImagePickerMultipleResult>;
    getCameraPermissionsAsync(): Promise<PermissionResponse>;
    requestCameraPermissionsAsync(): Promise<PermissionResponse>;
    getCameraRollPermissionsAsync(): Promise<PermissionResponse>;
    requestCameraRollPermissionsAsync(): Promise<PermissionResponse>;
};
export default _default;
export declare function WEB_launchImageLibraryAsync({ allowsMultipleSelection, }: ImagePickerOptions & {
    allowsMultipleSelection?: false;
}): Promise<Expand<ImagePickerResult>>;
export declare function WEB_launchImageLibraryAsync({ allowsMultipleSelection, }: ImagePickerOptions & {
    allowsMultipleSelection: true;
}): Promise<Expand<ImagePickerMultipleResult>>;
