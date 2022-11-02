import { PermissionStatus, createPermissionHook, UnavailabilityError, } from 'expo-modules-core';
import * as React from 'react';
import { Platform } from 'react-native';
import ExpoBarCodeScannerModule from './ExpoBarCodeScannerModule';
import ExpoBarCodeScannerView from './ExpoBarCodeScannerView';
const { BarCodeType, Type } = ExpoBarCodeScannerModule;
const EVENT_THROTTLE_MS = 500;
export class BarCodeScanner extends React.Component {
    lastEvents = {};
    lastEventsTimes = {};
    static Constants = {
        BarCodeType,
        Type,
    };
    static ConversionTables = {
        type: Type,
    };
    static defaultProps = {
        type: Type.back,
        barCodeTypes: Object.values(BarCodeType),
    };
    // @needsAudit
    /**
     * Checks user's permissions for accessing the camera.
     * @return Return a promise that fulfills to an object of type [`PermissionResponse`](#permissionresponse).
     */
    static async getPermissionsAsync() {
        return ExpoBarCodeScannerModule.getPermissionsAsync();
    }
    // @needsAudit
    /**
     * Asks the user to grant permissions for accessing the camera.
     *
     * On iOS this will require apps to specify the `NSCameraUsageDescription` entry in the `Info.plist`.
     * @return Return a promise that fulfills to an object of type [`PermissionResponse`](#permissionresponse).
     */
    static async requestPermissionsAsync() {
        return ExpoBarCodeScannerModule.requestPermissionsAsync();
    }
    // @needsAudit
    /**
     * Check or request permissions for the barcode scanner.
     * This uses both `requestPermissionAsync` and `getPermissionsAsync` to interact with the permissions.
     *
     * @example
     * ```ts
     * const [permissionResponse, requestPermission] = BarCodeScanner.usePermissions();
     * ```
     */
    static usePermissions = createPermissionHook({
        getMethod: BarCodeScanner.getPermissionsAsync,
        requestMethod: BarCodeScanner.requestPermissionsAsync,
    });
    // @needsAudit
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
    static async scanFromURLAsync(url, barCodeTypes = Object.values(BarCodeType)) {
        if (!ExpoBarCodeScannerModule.scanFromURLAsync) {
            throw new UnavailabilityError('expo-barcode-scanner', 'scanFromURLAsync');
        }
        if (Array.isArray(barCodeTypes) && !barCodeTypes.length) {
            throw new Error('No barCodeTypes specified; provide at least one barCodeType for scanner');
        }
        if (Platform.OS === 'ios') {
            if (Array.isArray(barCodeTypes) && !barCodeTypes.includes(BarCodeType.qr)) {
                // Only QR type is supported on iOS, fail if one tries to use other types
                throw new Error('Only QR type is supported by scanFromURLAsync() on iOS');
            }
            // on iOS use only supported QR type
            return await ExpoBarCodeScannerModule.scanFromURLAsync(url, [BarCodeType.qr]);
        }
        // On other platforms, if barCodeTypes is not provided, use all available types
        return await ExpoBarCodeScannerModule.scanFromURLAsync(url, barCodeTypes);
    }
    render() {
        const nativeProps = this.convertNativeProps(this.props);
        const { onBarCodeScanned } = this.props;
        return (React.createElement(ExpoBarCodeScannerView, { ...nativeProps, onBarCodeScanned: this.onObjectDetected(onBarCodeScanned) }));
    }
    /**
     * @hidden
     */
    onObjectDetected = (callback) => ({ nativeEvent }) => {
        const { type } = nativeEvent;
        if (this.lastEvents[type] &&
            this.lastEventsTimes[type] &&
            JSON.stringify(nativeEvent) === this.lastEvents[type] &&
            Date.now() - this.lastEventsTimes[type] < EVENT_THROTTLE_MS) {
            return;
        }
        if (callback) {
            callback(nativeEvent);
            this.lastEventsTimes[type] = new Date();
            this.lastEvents[type] = JSON.stringify(nativeEvent);
        }
    };
    /**
     * @hidden
     */
    convertNativeProps(props) {
        const nativeProps = {};
        for (const [key, value] of Object.entries(props)) {
            if (typeof value === 'string' && BarCodeScanner.ConversionTables[key]) {
                nativeProps[key] = BarCodeScanner.ConversionTables[key][value];
            }
            else {
                nativeProps[key] = value;
            }
        }
        return nativeProps;
    }
}
export { PermissionStatus };
export const { Constants, getPermissionsAsync, requestPermissionsAsync, scanFromURLAsync } = BarCodeScanner;
//# sourceMappingURL=BarCodeScanner.js.map