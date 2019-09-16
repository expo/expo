import { ImagePickerResult, MediaTypeOptions, ImagePickerOptions, PermissionsResponse } from './ImagePicker.types';
export declare function getCameraPermissionsAsync(): Promise<PermissionsResponse>;
export declare function getCameraRollPermissionsAsync(): Promise<PermissionsResponse>;
export declare function requestCameraPermissionsAsync(): Promise<PermissionsResponse>;
export declare function requestCameraRollPermissionsAsync(): Promise<PermissionsResponse>;
export declare function launchImageLibraryAsync(options?: ImagePickerOptions): Promise<ImagePickerResult>;
export declare function launchCameraAsync(options?: ImagePickerOptions): Promise<ImagePickerResult>;
export { MediaTypeOptions, ImagePickerOptions, ImagePickerResult };
