import * as React from 'react';
import { CameraCapturedPicture, CameraOrientation, CameraPictureOptions, CameraProps, CameraRecordingOptions, CameraType, ConstantsType, PermissionResponse, VideoCodec } from './Camera.types';
export default class Camera extends React.Component<CameraProps> {
    /**
     * Check whether the current device has a camera. This is useful for web and simulators cases.
     * This isn't influenced by the Permissions API (all platforms), or HTTP usage (in the browser).
     * You will still need to check if the native permission has been accepted.
     * @platform web
     */
    static isAvailableAsync(): Promise<boolean>;
    /**
     * Returns a list of camera types `['front', 'back']`. This is useful for desktop browsers which only have front-facing cameras.
     * @platform web
     */
    static getAvailableCameraTypesAsync(): Promise<CameraType[]>;
    /**
     * Queries the device for the available video codecs that can be used in video recording.
     * @return A promise that resolves to a list of strings that represents available codecs.
     * @platform ios
     */
    static getAvailableVideoCodecsAsync(): Promise<VideoCodec[]>;
    static Constants: ConstantsType;
    static ConversionTables: {
        type: Record<"front" | "back", string | number | undefined>;
        flashMode: Record<"on" | "off" | "auto" | "torch", string | number | undefined>;
        autoFocus: Record<"on" | "off" | "auto" | "singleShot", string | number | boolean | undefined>;
        whiteBalance: Record<"auto" | "sunny" | "cloudy" | "shadow" | "incandescent" | "fluorescent" | "continuous" | "manual", string | number | undefined>;
    };
    static defaultProps: CameraProps;
    /**
     * @deprecated Use `getCameraPermissionsAsync` or `getMicrophonePermissionsAsync` instead.
     * Checks user's permissions for accessing camera.
     */
    static getPermissionsAsync(): Promise<PermissionResponse>;
    /**
     * Asks the user to grant permissions for accessing camera.
     * On iOS this will require apps to specify both `NSCameraUsageDescription` and `NSMicrophoneUsageDescription` entries in the **Info.plist**.
     * @return A promise that resolves to an object of type [PermissionResponse](#permissionresponse).
     * @deprecated Use `requestCameraPermissionsAsync` or `requestMicrophonePermissionsAsync` instead.
     */
    static requestPermissionsAsync(): Promise<PermissionResponse>;
    /**
     * Checks user's permissions for accessing camera.
     * @return A promise that resolves to an object of type [PermissionResponse](#permissionresponse).
     */
    static getCameraPermissionsAsync(): Promise<PermissionResponse>;
    /**
     * Asks the user to grant permissions for accessing camera.
     * On iOS this will require apps to specify an `NSCameraUsageDescription` entry in the **Info.plist**.
     * @return A promise that resolves to an object of type [PermissionResponse](#permissionresponse).
     */
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
    /**
     * Checks user's permissions for accessing microphone.
     * @return A promise that resolves to an object of type [PermissionResponse](#permissionresponse).
     */
    static getMicrophonePermissionsAsync(): Promise<PermissionResponse>;
    /**
     * Asks the user to grant permissions for accessing the microphone.
     * On iOS this will require apps to specify an `NSMicrophoneUsageDescription` entry in the **Info.plist**.
     * @return A promise that resolves to an object of type [PermissionResponse](#permissionresponse).
     */
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
    /**
     * Takes a picture and saves it to app's cache directory. Photos are rotated to match device's orientation
     * (if `options.skipProcessing` flag is not enabled) and scaled to match the preview. Anyway on Android it is essential
     * to set ratio prop to get a picture with correct dimensions.
     * > **Note**: Make sure to wait for the [`onCameraReady`](#oncameraready) callback before calling this method.
     * @param options An object in form of `CameraPictureOptions` type.
     * @return Returns a Promise that resolves to `CameraCapturedPicture` object, where `uri` is a URI to the local image file on iOS,
     * Android, and a base64 string on web (usable as the source for an `Image` element). The `width` and `height` properties specify
     * the dimensions of the image. `base64` is included if the `base64` option was truthy, and is a string containing the JPEG data
     * of the image in Base64--prepend that with `'data:image/jpg;base64,'` to get a data URI, which you can use as the source
     * for an `Image` element for example. `exif` is included if the `exif` option was truthy, and is an object containing EXIF
     * data for the image--the names of its properties are EXIF tags and their values are the values for those tags.
     *
     * > On native platforms, the local image URI is temporary. Use [`FileSystem.copyAsync`](filesystem/#filesystemcachedirectory)
     * > to make a permanent copy of the image.
     */
    takePictureAsync(options?: CameraPictureOptions): Promise<CameraCapturedPicture>;
    /**
     * Get aspect ratios that are supported by the device and can be passed via `ratio` prop.
     * @return Returns a Promise that resolves to an array of strings representing ratios, eg. `['4:3', '1:1']`.
     * @platform android
     */
    getSupportedRatiosAsync(): Promise<string[]>;
    /**
     * Get picture sizes that are supported by the device for given `ratio`.
     * @param ratio A string representing aspect ratio of sizes to be returned.
     * @return Returns a Promise that resolves to an array of strings representing picture sizes that can be passed to `pictureSize` prop.
     * The list varies across Android devices but is the same for every iOS.
     */
    getAvailablePictureSizesAsync(ratio: string): Promise<string[]>;
    /**
     * Starts recording a video that will be saved to cache directory. Videos are rotated to match device's orientation.
     * Flipping camera during a recording results in stopping it.
     * @param options A map of `CameraRecordingOptions` type.
     * @return Returns a Promise that resolves to an object containing video file `uri` property and a `codec` property on iOS.
     * The Promise is returned if `stopRecording` was invoked, one of `maxDuration` and `maxFileSize` is reached or camera preview is stopped.
     * @platform android
     * @platform ios
     */
    recordAsync(options?: CameraRecordingOptions): Promise<{
        uri: string;
    }>;
    /**
     * Stops recording if any is in progress.
     */
    stopRecording(): Promise<void>;
    /**
     * Pauses the camera preview. It is not recommended to use `takePictureAsync` when preview is paused.
     */
    pausePreview(): Promise<void>;
    /**
     * Resumes the camera preview.
     */
    resumePreview(): Promise<void>;
    _onCameraReady: () => void;
    _onMountError: ({ nativeEvent }: {
        nativeEvent: {
            message: string;
        };
    }) => void;
    _onResponsiveOrientationChanged: ({ nativeEvent, }: {
        nativeEvent: {
            orientation: CameraOrientation;
        };
    }) => void;
    _onObjectDetected: (callback?: Function) => ({ nativeEvent }: {
        nativeEvent: any;
    }) => void;
    _setReference: (ref?: React.Component) => void;
    render(): JSX.Element;
}
export declare const Constants: ConstantsType, getPermissionsAsync: typeof Camera.getPermissionsAsync, requestPermissionsAsync: typeof Camera.requestPermissionsAsync, getCameraPermissionsAsync: typeof Camera.getCameraPermissionsAsync, requestCameraPermissionsAsync: typeof Camera.requestCameraPermissionsAsync, getMicrophonePermissionsAsync: typeof Camera.getMicrophonePermissionsAsync, requestMicrophonePermissionsAsync: typeof Camera.requestMicrophonePermissionsAsync;
//# sourceMappingURL=Camera.d.ts.map