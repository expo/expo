import * as React from 'react';
import { BarCodeScanningResult, CameraCapturedPicture, CameraMountError, CameraNativeProps, CameraPictureOptions, CameraProps, CameraRecordingOptions, ConstantsType, FaceDetectionResult, PermissionExpiration, PermissionResponse, PermissionStatus } from './Camera.types';
export default class Camera extends React.Component<CameraProps> {
    static isAvailableAsync(): Promise<boolean>;
    static getAvailableCameraTypesAsync(): Promise<('front' | 'back')[]>;
    static Constants: ConstantsType;
    static ConversionTables: {
        type: Record<"front" | "back", string | number | undefined>;
        flashMode: Record<"on" | "off" | "auto" | "torch", string | number | undefined>;
        autoFocus: Record<"on" | "off" | "auto" | "singleShot", string | number | boolean | undefined>;
        whiteBalance: Record<"auto" | "sunny" | "cloudy" | "shadow" | "incandescent" | "fluorescent" | "continuous" | "manual", string | number | undefined>;
    };
    static defaultProps: CameraProps;
    static getPermissionsAsync(): Promise<PermissionResponse>;
    static requestPermissionsAsync(): Promise<PermissionResponse>;
    _cameraHandle?: number | null;
    _cameraRef?: React.Component | null;
    _lastEvents: {
        [eventName: string]: string;
    };
    _lastEventsTimes: {
        [eventName: string]: Date;
    };
    takePictureAsync(options?: CameraPictureOptions): Promise<CameraCapturedPicture>;
    getSupportedRatiosAsync(): Promise<string[]>;
    getAvailablePictureSizesAsync(ratio?: string): Promise<string[]>;
    recordAsync(options?: CameraRecordingOptions): Promise<{
        uri: string;
    }>;
    stopRecording(): void;
    pausePreview(): void;
    resumePreview(): void;
    _onCameraReady: () => void;
    _onMountError: ({ nativeEvent }: {
        nativeEvent: {
            message: string;
        };
    }) => void;
    _onObjectDetected: (callback?: Function | undefined) => ({ nativeEvent }: {
        nativeEvent: any;
    }) => void;
    _setReference: (ref?: React.Component<{}, {}, any> | undefined) => void;
    render(): JSX.Element;
}
export declare const Constants: ConstantsType, getPermissionsAsync: typeof Camera.getPermissionsAsync, requestPermissionsAsync: typeof Camera.requestPermissionsAsync;
export { CameraCapturedPicture, CameraNativeProps, CameraPictureOptions, CameraProps, CameraRecordingOptions, PermissionResponse, PermissionStatus, PermissionExpiration, BarCodeScanningResult, FaceDetectionResult, CameraMountError, };
