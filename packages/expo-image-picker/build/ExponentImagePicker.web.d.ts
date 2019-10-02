import { ImagePickerResult, ImagePickerOptions } from './ImagePicker.types';
declare const _default: {
    readonly name: string;
    launchImageLibraryAsync({ mediaTypes, allowsMultipleSelection, }: ImagePickerOptions): Promise<ImagePickerResult>;
    launchCameraAsync({ mediaTypes, allowsMultipleSelection, }: ImagePickerOptions): Promise<ImagePickerResult>;
};
export default _default;
