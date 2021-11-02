import { PermissionResponse, PermissionStatus, PermissionExpiration, PermissionHookOptions } from 'expo-modules-core';
import { ViewProps } from 'react-native';
export declare enum CameraType {
    /**
     * @platforms ios, android, web
     */
    front = "front",
    /**
     * @platforms ios, android, web
     */
    back = "back"
}
export declare enum FlashMode {
    /**
     * @platforms ios, android, web
     */
    on = "on",
    /**
     * @platforms ios, android, web
     */
    off = "off",
    /**
     * @platforms ios, android, web
     */
    auto = "auto",
    /**
     * @platforms ios, android, web
     */
    torch = "torch"
}
export declare enum AutoFocus {
    /**
     * @platforms ios, android, web
     */
    on = "on",
    /**
     * @platforms ios, android, web
     */
    off = "off",
    /**
     * @platforms web
     */
    auto = "auto",
    /**
     * @platforms web
     */
    singleShot = "singleShot"
}
export declare enum WhiteBalance {
    /**
     * @platforms ios, android, web
     */
    auto = "auto",
    /**
     * @platforms ios, android
     */
    sunny = "sunny",
    /**
     * @platforms ios, android
     */
    cloudy = "cloudy",
    /**
     * @platforms ios, android
     */
    shadow = "shadow",
    /**
     * @platforms ios, android
     */
    incandescent = "incandescent",
    /**
     * @platforms ios, android
     */
    fluorescent = "fluorescent",
    /**
     * @platforms web
     */
    continuous = "continuous",
    /**
     * @platforms web
     */
    manual = "manual"
}
export declare enum ImageType {
    png = "png",
    jpg = "jpg"
}
/**
 * This option specifies what codec to use when recording a video.
 */
export declare enum VideoCodec {
    /**
     * @platforms ios
     */
    H264 = "avc1",
    /**
     * @platforms ios
     */
    HEVC = "hvc1",
    /**
     * @platforms ios
     */
    JPEG = "jpeg",
    /**
     * @platforms ios
     */
    AppleProRes422 = "apcn",
    /**
     * @platforms ios
     */
    AppleProRes4444 = "ap4h"
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
    videoBitrate?: number;
    codec?: VideoCodec;
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
declare type Point = {
    x: number;
    y: number;
};
export declare type BarCodePoint = Point;
export declare type BarCodeScanningResult = {
    type: string;
    data: string;
    /** @platform web */
    cornerPoints?: BarCodePoint[];
};
export declare type Face = {
    faceID: number;
    bounds: {
        origin: Point;
        size: {
            height: number;
            width: number;
        };
    };
    rollAngle: number;
    yawAngle: number;
    smilingProbability: number;
    leftEarPosition: Point;
    rightEarPosition: Point;
    leftEyePosition: Point;
    leftEyeOpenProbability: number;
    rightEyePosition: Point;
    rightEyeOpenProbability: number;
    leftCheekPosition: Point;
    rightCheekPosition: Point;
    mouthPosition: Point;
    leftMouthPosition: Point;
    rightMouthPosition: Point;
    noseBasePosition: Point;
};
export declare type FaceDetectionResult = {
    faces: Face[];
};
export declare type ConstantsType = {
    Type: typeof CameraType;
    FlashMode: typeof FlashMode;
    AutoFocus: typeof AutoFocus;
    WhiteBalance: typeof WhiteBalance;
    VideoQuality: any;
    VideoStabilization: any;
    VideoCodec: typeof VideoCodec;
};
export declare type CameraProps = ViewProps & {
    type?: number | keyof typeof CameraType;
    flashMode?: number | keyof typeof FlashMode;
    whiteBalance?: number | keyof typeof WhiteBalance;
    autoFocus?: boolean | number | keyof typeof AutoFocus;
    zoom?: number;
    ratio?: string;
    focusDepth?: number;
    onCameraReady?: Function;
    useCamera2Api?: boolean;
    pictureSize?: string;
    videoStabilizationMode?: number;
    onMountError?: (event: CameraMountError) => void;
    barCodeScannerSettings?: object;
    onBarCodeScanned?: (scanningResult: BarCodeScanningResult) => void;
    faceDetectorSettings?: object;
    onFacesDetected?: (faces: FaceDetectionResult) => void;
    poster?: string;
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
    poster?: string;
};
export declare type BarCodeSettings = {
    barCodeTypes: string[];
    interval?: number;
};
export { PermissionResponse, PermissionStatus, PermissionExpiration, PermissionHookOptions };
