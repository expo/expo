import { PermissionResponse } from 'expo-modules-core';
import { ImagePickerMultipleResult, ImagePickerResult, MediaTypeOptions } from './ImagePicker.types';
declare const _default: {
    readonly name: string;
    launchImageLibraryAsync({ mediaTypes, allowsMultipleSelection, base64, }: {
        mediaTypes?: MediaTypeOptions | undefined;
        allowsMultipleSelection?: boolean | undefined;
        base64?: boolean | undefined;
    }): Promise<ImagePickerResult | ImagePickerMultipleResult>;
    launchCameraAsync({ mediaTypes, allowsMultipleSelection, base64, }: {
        mediaTypes?: MediaTypeOptions | undefined;
        allowsMultipleSelection?: boolean | undefined;
        base64?: boolean | undefined;
    }): Promise<ImagePickerResult | ImagePickerMultipleResult>;
    getCameraPermissionsAsync(): Promise<PermissionResponse>;
    requestCameraPermissionsAsync(): Promise<PermissionResponse>;
    getMediaLibraryPermissionsAsync(_writeOnly: boolean): Promise<PermissionResponse>;
    requestMediaLibraryPermissionsAsync(_writeOnly: boolean): Promise<PermissionResponse>;
};
export default _default;
