import { PermissionResponse, PermissionStatus, PermissionHookOptions } from 'expo-modules-core';
import * as React from 'react';
import { ViewProps } from 'react-native';
/**
 * Those coordinates are represented in the coordinate space of the barcode source (e.g. when you
 * are using the barcode scanner view, these values are adjusted to the dimensions of the view).
 */
export type BarCodePoint = {
    /**
     * The `x` coordinate value.
     */
    x: number;
    /**
     * The `y` coordinate value.
     */
    y: number;
};
export type BarCodeSize = {
    /**
     * The height value.
     */
    height: number;
    /**
     * The width value.
     */
    width: number;
};
export type BarCodeBounds = {
    /**
     * The origin point of the bounding box.
     */
    origin: BarCodePoint;
    /**
     * The size of the bounding box.
     */
    size: BarCodeSize;
};
export type BarCodeScannerResult = {
    /**
     * The barcode type.
     */
    type: string;
    /**
     * The parsed information encoded in the bar code.
     */
    data: string;
    /**
     * The raw information encoded in the bar code.
     * May be different from `data` depending on the barcode type.
     * @platform android
     * @hidden
     */
    raw?: string;
    /**
     * The [BarCodeBounds](#barcodebounds) object.
     * `bounds` in some case will be representing an empty rectangle.
     * Moreover, `bounds` doesn't have to bound the whole barcode.
     * For some types, they will represent the area used by the scanner.
     */
    bounds: BarCodeBounds;
    /**
     * Corner points of the bounding box.
     * `cornerPoints` is not always available and may be empty. On iOS, for `code39` and `pdf417`
     * you don't get this value.
     */
    cornerPoints: BarCodePoint[];
};
export type BarCodeEvent = BarCodeScannerResult & {
    target?: number;
};
export type BarCodeEventCallbackArguments = {
    nativeEvent: BarCodeEvent;
};
export type BarCodeScannedCallback = (params: BarCodeEvent) => void;
export type BarCodeScannerProps = ViewProps & {
    /**
     * Camera facing. Use one of `BarCodeScanner.Constants.Type`. Use either `Type.front` or `Type.back`.
     * Same as `Camera.Constants.Type`.
     * @default Type.back
     */
    type?: 'front' | 'back' | number;
    /**
     * An array of bar code types. Usage: `BarCodeScanner.Constants.BarCodeType.<codeType>` where
     * `codeType` is one of these [listed above](#supported-formats). Defaults to all supported bar
     * code types. It is recommended to provide only the bar code formats you expect to scan to
     * minimize battery usage.
     *
     * For example: `barCodeTypes={[BarCodeScanner.Constants.BarCodeType.qr]}`.
     */
    barCodeTypes?: string[];
    /**
     * A callback that is invoked when a bar code has been successfully scanned. The callback is
     * provided with an [BarCodeScannerResult](#barcodescannerresult).
     * > __Note:__ Passing `undefined` to the `onBarCodeScanned` prop will result in no scanning. This
     * > can be used to effectively "pause" the scanner so that it doesn't continually scan even after
     * > data has been retrieved.
     */
    onBarCodeScanned?: BarCodeScannedCallback;
};
/**
 * @deprecated
 * BarCodeScanner has been deprecated and will be removed in a future SDK version. Use `expo-camera` instead.
 * See [How to migrate from `expo-barcode-scanner` to `expo-camera`](https://expo.fyi/barcode-scanner-to-expo-camera)
 * for more details.
 */
export declare class BarCodeScanner extends React.Component<BarCodeScannerProps> {
    lastEvents: {
        [key: string]: any;
    };
    lastEventsTimes: {
        [key: string]: any;
    };
    static Constants: {
        BarCodeType: any;
        Type: any;
    };
    static ConversionTables: {
        type: any;
    };
    static defaultProps: {
        type: any;
        barCodeTypes: unknown[];
    };
    componentDidMount(): void;
    /**
     * Checks user's permissions for accessing the camera.
     * @return Return a promise that fulfills to an object of type [`PermissionResponse`](#permissionresponse).
     */
    static getPermissionsAsync(): Promise<PermissionResponse>;
    /**
     * Asks the user to grant permissions for accessing the camera.
     *
     * On iOS this will require apps to specify the `NSCameraUsageDescription` entry in the `Info.plist`.
     * @return Return a promise that fulfills to an object of type [`PermissionResponse`](#permissionresponse).
     */
    static requestPermissionsAsync(): Promise<PermissionResponse>;
    /**
     * Check or request permissions for the barcode scanner.
     * This uses both `requestPermissionAsync` and `getPermissionsAsync` to interact with the permissions.
     *
     * @example
     * ```ts
     * const [permissionResponse, requestPermission] = BarCodeScanner.usePermissions();
     * ```
     */
    static usePermissions: (options?: PermissionHookOptions<object> | undefined) => [PermissionResponse | null, () => Promise<PermissionResponse>, () => Promise<PermissionResponse>];
    /**
     * Scan bar codes from the image given by the URL.
     * @param url URL to get the image from.
     * @param barCodeTypes An array of bar code types. Defaults to all supported bar code types on
     * the platform.
     * > __Note:__ Only QR codes are supported on iOS.
     * @return A possibly empty array of objects of the `BarCodeScannerResult` shape, where the type
     * refers to the bar code type that was scanned and the data is the information encoded in the bar
     * code.
     */
    static scanFromURLAsync(url: string, barCodeTypes?: string[]): Promise<BarCodeScannerResult[]>;
    render(): JSX.Element;
    /**
     * @hidden
     */
    onObjectDetected: (callback?: BarCodeScannedCallback) => ({ nativeEvent }: BarCodeEventCallbackArguments) => void;
    /**
     * @hidden
     */
    convertNativeProps(props: BarCodeScannerProps): BarCodeScannerProps;
}
export { PermissionResponse, PermissionStatus, PermissionHookOptions };
export declare const Constants: {
    BarCodeType: any;
    Type: any;
}, getPermissionsAsync: typeof BarCodeScanner.getPermissionsAsync, requestPermissionsAsync: typeof BarCodeScanner.requestPermissionsAsync, scanFromURLAsync: typeof BarCodeScanner.scanFromURLAsync;
//# sourceMappingURL=BarCodeScanner.d.ts.map