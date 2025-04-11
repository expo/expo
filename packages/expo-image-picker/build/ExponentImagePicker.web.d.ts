import { PermissionResponse } from 'expo-modules-core';
import { ImagePickerOptions, ImagePickerResult } from './ImagePicker.types';
declare const _default: {
    launchImageLibraryAsync({ mediaTypes, allowsMultipleSelection, base64, }: ImagePickerOptions): Promise<ImagePickerResult>;
    launchCameraAsync({ mediaTypes, allowsMultipleSelection, base64, cameraType, }: ImagePickerOptions): Promise<ImagePickerResult>;
    getCameraPermissionsAsync(): Promise<PermissionResponse>;
    requestCameraPermissionsAsync(): Promise<PermissionResponse>;
    getMediaLibraryPermissionsAsync(_writeOnly: boolean): Promise<PermissionResponse>;
    requestMediaLibraryPermissionsAsync(_writeOnly: boolean): Promise<PermissionResponse>;
};
export default _default;
//# sourceMappingURL=ExponentImagePicker.web.d.ts.map