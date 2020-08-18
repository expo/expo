import { ViewProps } from 'react-native';
import { PermissionResponse, PermissionStatus, PermissionExpiration } from 'unimodules-permissions-interface';
export declare enum CameraType {
    front = "front",
    back = "back"
}
export declare enum ImageType {
    png = "png",
    jpg = "jpg"
}
export declare type ImageParameters = {
    imageType: ImageType;
    quality: number | null;
};
export declare type ImageSize = {
    width: number;
    height: number;
};
export declare type WebCameraSettings = Partial<{
    autoFocus: string;
    flashMode: string;
    whiteBalance: string;
    exposureCompensation: number;
    colorTemperature: number;
    iso: number;
    brightness: number;
    contrast: number;
    saturation: number;
    sharpness: number;
    focusDistance: number;
    zoom: number;
}>;
export declare type CapturedPicture = {
    width: number;
    height: number;
    uri: string;
    base64?: string;
    exif?: Partial<MediaTrackSettings>;
};
export declare type CameraPictureOptions = {
    quality?: number;
    base64?: boolean;
    exif?: boolean;
    onPictureSaved?: (picture: CameraCapturedPicture) => void;
    skipProcessing?: boolean;
    scale?: number;
    imageType?: ImageType;
    isImageMirror?: boolean;
    id?: number;
    fastMode?: boolean;
};
export declare type CameraRecordingOptions = {
    maxDuration?: number;
    maxFileSize?: number;
    quality?: number | string;
    mute?: boolean;
    mirror?: boolean;
};
export declare type CameraCapturedPicture = {
    width: number;
    height: number;
    uri: string;
    base64?: string;
    exif?: any;
};
export declare type PictureSavedListener = (event: {
    nativeEvent: {
        data: CapturedPicture;
        id: number;
    };
}) => void;
export declare type CameraReadyListener = () => void;
export declare type MountErrorListener = (event: {
    nativeEvent: CameraMountError;
}) => void;
export declare type CameraMountError = {
    message: string;
};
export declare type BarCodePoint = {
    x: number;
    y: number;
};
export declare type BarCodeScanningResult = {
    type: string;
    data: string;
    /** @platform web */
    cornerPoints?: BarCodePoint[];
};
export declare type FaceDetectionResult = {
    faces: any[];
};
export declare type CameraProps = ViewProps & {
    zoom?: number;
    ratio?: string;
    focusDepth?: number;
    type?: number | string;
    onCameraReady?: Function;
    useCamera2Api?: boolean;
    flashMode?: number | string;
    whiteBalance?: number | string;
    autoFocus?: string | boolean | number;
    pictureSize?: string;
    videoStabilizationMode?: number;
    onMountError?: (event: CameraMountError) => void;
    barCodeScannerSettings?: object;
    onBarCodeScanned?: (scanningResult: BarCodeScanningResult) => void;
    faceDetectorSettings?: object;
    onFacesDetected?: (faces: FaceDetectionResult) => void;
};
export declare type CameraNativeProps = {
    pointerEvents?: any;
    style?: any;
    ref?: Function;
    onCameraReady?: CameraReadyListener;
    onMountError?: MountErrorListener;
    onBarCodeScanned?: (event: {
        nativeEvent: BarCodeScanningResult;
    }) => void;
    onFacesDetected?: (event: {
        nativeEvent: FaceDetectionResult;
    }) => void;
    onFaceDetectionError?: (event: {
        nativeEvent: Error;
    }) => void;
    onPictureSaved?: PictureSavedListener;
    type?: number | string;
    flashMode?: number | string;
    autoFocus?: string | boolean | number;
    focusDepth?: number;
    zoom?: number;
    whiteBalance?: number | string;
    pictureSize?: string;
    barCodeScannerSettings?: BarCodeSettings;
    faceDetectorSettings?: object;
    barCodeScannerEnabled?: boolean;
    faceDetectorEnabled?: boolean;
    ratio?: string;
    useCamera2Api?: boolean;
};
export declare type BarCodeSettings = {
    barCodeTypes: string[];
    interval?: number;
};
export { PermissionResponse, PermissionStatus, PermissionExpiration };
