import { PermissionResponse, PermissionStatus, PermissionExpiration } from 'unimodules-permissions-interface';
import { ImagePickerResult, MediaTypeOptions, ImagePickerOptions, VideoExportPreset } from './ImagePicker.types';
export declare function getCameraPermissionsAsync(): Promise<PermissionResponse>;
export declare function getCameraRollPermissionsAsync(): Promise<PermissionResponse>;
export declare function requestCameraPermissionsAsync(): Promise<PermissionResponse>;
export declare function requestCameraRollPermissionsAsync(): Promise<PermissionResponse>;
export declare function launchImageLibraryAsync(options?: ImagePickerOptions): Promise<ImagePickerResult>;
export declare function launchCameraAsync(options?: ImagePickerOptions): Promise<ImagePickerResult>;
export { MediaTypeOptions, ImagePickerOptions, ImagePickerResult, VideoExportPreset, PermissionResponse, PermissionStatus, PermissionExpiration, };
