import { PermissionStatus, PermissionExpiration } from 'expo-modules-core';
import { CameraPermissionResponse, CameraRollPermissionResponse, MediaLibraryPermissionResponse, ImagePickerResult, ImagePickerErrorResult, MediaTypeOptions, ImagePickerOptions, VideoExportPreset, ExpandImagePickerResult } from './ImagePicker.types';
export declare function getCameraPermissionsAsync(): Promise<CameraPermissionResponse>;
/**
 * @deprecated in favor of getMediaLibraryPermissionsAsync()
 */
export declare function getCameraRollPermissionsAsync(): Promise<MediaLibraryPermissionResponse>;
export declare function getMediaLibraryPermissionsAsync(writeOnly?: boolean): Promise<MediaLibraryPermissionResponse>;
export declare function requestCameraPermissionsAsync(): Promise<CameraPermissionResponse>;
/**
 * @deprecated in favor of requestMediaLibraryPermissionsAsync()
 */
export declare function requestCameraRollPermissionsAsync(): Promise<MediaLibraryPermissionResponse>;
export declare function requestMediaLibraryPermissionsAsync(writeOnly?: boolean): Promise<MediaLibraryPermissionResponse>;
export declare function getPendingResultAsync(): Promise<(ImagePickerResult | ImagePickerErrorResult)[]>;
export declare function launchCameraAsync(options?: ImagePickerOptions): Promise<ImagePickerResult>;
export declare function launchImageLibraryAsync<T extends ImagePickerOptions>(options?: T): Promise<ExpandImagePickerResult<T>>;
export { MediaTypeOptions, ImagePickerOptions, ImagePickerResult, ImagePickerErrorResult, VideoExportPreset, CameraPermissionResponse, CameraRollPermissionResponse, MediaLibraryPermissionResponse, PermissionStatus, PermissionExpiration, };
