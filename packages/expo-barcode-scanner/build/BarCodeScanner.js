import { UnavailabilityError } from '@unimodules/core';
import { PermissionStatus } from 'expo-modules-core';
import * as React from 'react';
import { Platform } from 'react-native';
import ExpoBarCodeScannerModule from './ExpoBarCodeScannerModule';
import ExpoBarCodeScannerView from './ExpoBarCodeScannerView';
const { BarCodeType, Type } = ExpoBarCodeScannerModule;
const EVENT_THROTTLE_MS = 500;
export { PermissionStatus };
export class BarCodeScanner extends React.Component {
    constructor() {
        super(...arguments);
        this.lastEvents = {};
        this.lastEventsTimes = {};
        this.onObjectDetected = (callback) => ({ nativeEvent, }) => {
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
    }
    static async getPermissionsAsync() {
        return ExpoBarCodeScannerModule.getPermissionsAsync();
    }
    static async requestPermissionsAsync() {
        return ExpoBarCodeScannerModule.requestPermissionsAsync();
    }
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
        return (React.createElement(ExpoBarCodeScannerView, Object.assign({}, nativeProps, { onBarCodeScanned: this.onObjectDetected(onBarCodeScanned) })));
    }
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
BarCodeScanner.Constants = {
    BarCodeType,
    Type,
};
BarCodeScanner.ConversionTables = {
    type: Type,
};
BarCodeScanner.defaultProps = {
    type: Type.back,
    barCodeTypes: Object.values(BarCodeType),
};
export const { Constants, getPermissionsAsync, requestPermissionsAsync } = BarCodeScanner;
//# sourceMappingURL=BarCodeScanner.js.map