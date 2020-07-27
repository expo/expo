import { PermissionStatus, PermissionExpiration } from 'unimodules-permissions-interface';
import { CameraPermissionResponse, CameraRollPermissionResponse, ImagePickerResult, MediaTypeOptions, ImagePickerOptions, VideoExportPreset } from './ImagePicker.types';
export declare function getCameraPermissionsAsync(): Promise<CameraPermissionResponse>;
export declare function getCameraRollPermissionsAsync(): Promise<CameraRollPermissionResponse>;
export declare function requestCameraPermissionsAsync(): Promise<CameraPermissionResponse>;
export declare function requestCameraRollPermissionsAsync(): Promise<CameraRollPermissionResponse>;
export declare function launchImageLibraryAsync(options?: ImagePickerOptions): Promise<ImagePickerResult>;
export declare function launchCameraAsync(options?: ImagePickerOptions): Promise<ImagePickerResult>;
export { MediaTypeOptions, ImagePickerOptions, ImagePickerResult, VideoExportPreset, CameraPermissionResponse, CameraRollPermissionResponse, PermissionStatus, PermissionExpiration, };
