import { ImagePickerResult, MediaTypeOptions, ImagePickerOptions, PermissionsRespone } from './ImagePicker.types';
export declare function getCameraPermissionsAsync(): Promise<PermissionsRespone>;
export declare function getCameraRollPermissionsAsync(): Promise<PermissionsRespone>;
export declare function requestCameraPermissionsAsync(): Promise<PermissionsRespone>;
export declare function requestCameraRollPermissionsAsync(): Promise<PermissionsRespone>;
export declare function launchImageLibraryAsync(options?: ImagePickerOptions): Promise<ImagePickerResult>;
export declare function launchCameraAsync(options?: ImagePickerOptions): Promise<ImagePickerResult>;
export { MediaTypeOptions, ImagePickerOptions, ImagePickerResult };
