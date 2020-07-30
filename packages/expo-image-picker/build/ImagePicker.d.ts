import { PermissionResponse, PermissionStatus, PermissionExpiration } from 'unimodules-permissions-interface';
import { ImagePickerResult, MediaTypeOptions, ImagePickerOptions, VideoExportPreset, Expand, ImagePickerMultipleResult } from './ImagePicker.types';
export declare function getCameraPermissionsAsync(): Promise<PermissionResponse>;
export declare function getCameraRollPermissionsAsync(): Promise<PermissionResponse>;
export declare function requestCameraPermissionsAsync(): Promise<PermissionResponse>;
export declare function requestCameraRollPermissionsAsync(): Promise<PermissionResponse>;
export declare function launchCameraAsync(options?: ImagePickerOptions): Promise<ImagePickerResult>;
export declare function launchImageLibraryAsync(options: ImagePickerOptions & {
    allowsMultipleSelection?: false;
}): Promise<Expand<ImagePickerResult>>;
export declare function launchImageLibraryAsync(options: ImagePickerOptions & {
    allowsMultipleSelection: true;
}): Promise<Expand<ImagePickerMultipleResult>>;
export { MediaTypeOptions, ImagePickerOptions, ImagePickerResult, VideoExportPreset, PermissionResponse, PermissionStatus, PermissionExpiration, };