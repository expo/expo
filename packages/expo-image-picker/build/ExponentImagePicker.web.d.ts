import { PermissionResponse } from 'expo-modules-core';
import { ImagePickerResult, MediaTypeOptions } from './ImagePicker.types';
declare const _default: {
    launchImageLibraryAsync({ mediaTypes, allowsMultipleSelection, base64, }: {
        mediaTypes?: MediaTypeOptions | undefined;
        allowsMultipleSelection?: boolean | undefined;
        base64?: boolean | undefined;
    }): Promise<ImagePickerResult>;
    launchCameraAsync({ mediaTypes, allowsMultipleSelection, base64, }: {
        mediaTypes?: MediaTypeOptions | undefined;
        allowsMultipleSelection?: boolean | undefined;
        base64?: boolean | undefined;
    }): Promise<ImagePickerResult>;
    getCameraPermissionsAsync(): Promise<PermissionResponse>;
    requestCameraPermissionsAsync(): Promise<PermissionResponse>;
    getMediaLibraryPermissionsAsync(_writeOnly: boolean): Promise<PermissionResponse>;
    requestMediaLibraryPermissionsAsync(_writeOnly: boolean): Promise<PermissionResponse>;
};
export default _default;
//# sourceMappingURL=ExponentImagePicker.web.d.ts.map