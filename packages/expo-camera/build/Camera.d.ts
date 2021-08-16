import * as React from 'react';
import { BarCodeScanningResult, CameraCapturedPicture, CameraMountError, CameraNativeProps, CameraPictureOptions, CameraProps, CameraRecordingOptions, ConstantsType, FaceDetectionResult, PermissionExpiration, PermissionResponse, PermissionStatus, VideoCodec } from './Camera.types';
export default class Camera extends React.Component<CameraProps> {
    static isAvailableAsync(): Promise<boolean>;
    static getAvailableCameraTypesAsync(): Promise<('front' | 'back')[]>;
    static getAvailableVideoCodecsAsync(): Promise<string[]>;
    static Constants: ConstantsType;
    static ConversionTables: {
        type: Record<"front" | "back", string | number | undefined>;
        flashMode: Record<"on" | "off" | "auto" | "torch", string | number | undefined>;
        autoFocus: Record<"on" | "off" | "auto" | "singleShot", string | number | boolean | undefined>;
        whiteBalance: Record<"auto" | "sunny" | "cloudy" | "shadow" | "incandescent" | "fluorescent" | "continuous" | "manual", string | number | undefined>;
    };
    static defaultProps: CameraProps;
    /**
     * @deprecated Use `getCameraPermissionsAync` or `getMicrophonePermissionsAsync` instead.
     */
    static getPermissionsAsync(): Promise<PermissionResponse>;
    /**
     * @deprecated Use `requestCameraPermissionsAsync` or `requestMicrophonePermissionsAsync` instead.
     */
    static requestPermissionsAsync(): Promise<PermissionResponse>;
    static getCameraPermissionsAsync(): Promise<PermissionResponse>;
    static requestCameraPermissionsAsync(): Promise<PermissionResponse>;
    /**
     * Check or request permissions to access the camera.
     * This uses both `requestCameraPermissionsAsync` and `getCameraPermissionsAsync` to interact with the permissions.
     *
     * @example
     * ```ts
     * const [status, requestPermission] = Camera.useCameraPermissions();
     * ```
     */
    static useCameraPermissions: (options?: import("expo-modules-core").PermissionHookOptions<object> | undefined) => [PermissionResponse | null, () => Promise<PermissionResponse>, () => Promise<PermissionResponse>];
    static getMicrophonePermissionsAsync(): Promise<PermissionResponse>;
    static requestMicrophonePermissionsAsync(): Promise<PermissionResponse>;
    /**
     * Check or request permissions to access the microphone.
     * This uses both `requestMicrophonePermissionsAsync` and `getMicrophonePermissionsAsync` to interact with the permissions.
     *
     * @example
     * ```ts
     * const [status, requestPermission] = Camera.useMicrophonePermissions();
     * ```
     */
    static useMicrophonePermissions: (options?: import("expo-modules-core").PermissionHookOptions<object> | undefined) => [PermissionResponse | null, () => Promise<PermissionResponse>, () => Promise<PermissionResponse>];
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
        codec?: VideoCodec;
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
export declare const Constants: ConstantsType, getPermissionsAsync: typeof Camera.getPermissionsAsync, requestPermissionsAsync: typeof Camera.requestPermissionsAsync, getCameraPermissionsAsync: typeof Camera.getCameraPermissionsAsync, requestCameraPermissionsAsync: typeof Camera.requestCameraPermissionsAsync, getMicrophonePermissionsAsync: typeof Camera.getMicrophonePermissionsAsync, requestMicrophonePermissionsAsync: typeof Camera.requestMicrophonePermissionsAsync;
export { CameraCapturedPicture, CameraNativeProps, CameraPictureOptions, CameraProps, CameraRecordingOptions, PermissionResponse, PermissionStatus, PermissionExpiration, BarCodeScanningResult, FaceDetectionResult, CameraMountError, };
