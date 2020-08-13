import { PermissionResponse } from 'unimodules-permissions-interface';
import { ImagePickerResult, MediaTypeOptions, ImagePickerMultipleResult } from './ImagePicker.types';
declare const _default: {
    readonly name: string;
    launchImageLibraryAsync({ mediaTypes, allowsMultipleSelection, }: {
        mediaTypes?: MediaTypeOptions | undefined;
        allowsMultipleSelection?: boolean | undefined;
    }): Promise<ImagePickerResult | ImagePickerMultipleResult>;
    launchCameraAsync({ mediaTypes, allowsMultipleSelection, }: {
        mediaTypes?: MediaTypeOptions | undefined;
        allowsMultipleSelection?: boolean | undefined;
    }): Promise<ImagePickerResult | ImagePickerMultipleResult>;
    getCameraPermissionsAsync(): Promise<PermissionResponse>;
    requestCameraPermissionsAsync(): Promise<PermissionResponse>;
    getCameraRollPermissionsAsync(): Promise<PermissionResponse>;
    requestCameraRollPermissionsAsync(): Promise<PermissionResponse>;
};
export default _default;
