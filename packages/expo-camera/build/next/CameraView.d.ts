import { Subscription } from 'expo-modules-core';
import * as React from 'react';
import { Ref } from 'react';
import { CameraCapturedPicture, CameraOrientation, CameraPictureOptions, CameraProps, CameraRecordingOptions, CameraViewRef, ScanningOptions, ScanningResult, VideoCodec } from './Camera.types';
export default class CameraView extends React.Component<CameraProps> {
    /**
     * Property that determines if the current device has the ability to use `DataScannerViewController` (iOS 16+).
     */
    static isModernBarcodeScannerAvailable: boolean;
    /**
     * Check whether the current device has a camera. This is useful for web and simulators cases.
     * This isn't influenced by the Permissions API (all platforms), or HTTP usage (in the browser).
     * You will still need to check if the native permission has been accepted.
     * @platform web
     */
    static isAvailableAsync(): Promise<boolean>;
    /**
     * Queries the device for the available video codecs that can be used in video recording.
     * @return A promise that resolves to a list of strings that represents available codecs.
     * @platform ios
     */
    static getAvailableVideoCodecsAsync(): Promise<VideoCodec[]>;
    static ConversionTables: {
        type: Record<number | typeof Symbol.iterator | "link" | "search" | "charAt" | "charCodeAt" | "concat" | "indexOf" | "lastIndexOf" | "localeCompare" | "match" | "replace" | "slice" | "split" | "substring" | "toLowerCase" | "toLocaleLowerCase" | "toUpperCase" | "toLocaleUpperCase" | "trim" | "length" | "substr" | "codePointAt" | "includes" | "endsWith" | "normalize" | "repeat" | "startsWith" | "anchor" | "big" | "blink" | "bold" | "fixed" | "fontcolor" | "fontsize" | "italics" | "small" | "strike" | "sub" | "sup" | "padStart" | "padEnd" | "trimEnd" | "trimStart" | "trimLeft" | "trimRight" | "matchAll" | "replaceAll" | "at" | "toString" | "valueOf", string | undefined>;
        flash: Record<number | typeof Symbol.iterator | "link" | "search" | "charAt" | "charCodeAt" | "concat" | "indexOf" | "lastIndexOf" | "localeCompare" | "match" | "replace" | "slice" | "split" | "substring" | "toLowerCase" | "toLocaleLowerCase" | "toUpperCase" | "toLocaleUpperCase" | "trim" | "length" | "substr" | "codePointAt" | "includes" | "endsWith" | "normalize" | "repeat" | "startsWith" | "anchor" | "big" | "blink" | "bold" | "fixed" | "fontcolor" | "fontsize" | "italics" | "small" | "strike" | "sub" | "sup" | "padStart" | "padEnd" | "trimEnd" | "trimStart" | "trimLeft" | "trimRight" | "matchAll" | "replaceAll" | "at" | "toString" | "valueOf", string | undefined>;
    };
    static defaultProps: CameraProps;
    _cameraHandle?: number | null;
    _cameraRef: React.RefObject<CameraViewRef>;
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
     * > On native platforms, the local image URI is temporary. Use [`FileSystem.copyAsync`](filesystem/#filesystemcopyasyncoptions)
     * > to make a permanent copy of the image.
     */
    takePictureAsync(options?: CameraPictureOptions): Promise<CameraCapturedPicture | undefined>;
    /**
     * Presents a modal view controller that uses the [`DataScannerViewController`](https://developer.apple.com/documentation/visionkit/scanning_data_with_the_camera) available on iOS 16+.
     * @platform ios
     */
    static launchScanner(options?: ScanningOptions): Promise<void>;
    /**
     * Dimiss the scanner presented by `launchScanner`.
     * @platform ios
     */
    static dismissScanner(): Promise<void>;
    /**
     * Invokes the `listener` function when a bar code has been successfully scanned. The callback is provided with
     * an object of the `ScanningResult` shape, where the `type` refers to the bar code type that was scanned and the `data` is the information encoded in the bar code
     * (in this case of QR codes, this is often a URL). See [`BarcodeType`](#barcodetype) for supported values.
     * @param listener Invoked with the [ScanningResult](#scanningresult) when a bar code has been successfully scanned.
     *
     * @platform ios
     */
    static onModernBarcodeScanned(listener: (event: ScanningResult) => void): Subscription;
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
    } | undefined>;
    /**
     * Stops recording if any is in progress.
     */
    stopRecording(): void;
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
    _setReference: (ref: Ref<CameraViewRef>) => void;
    render(): JSX.Element;
}
//# sourceMappingURL=CameraView.d.ts.map