import React from 'react';
import PropTypes from 'prop-types';
import mapValues from 'lodash.mapvalues';
import { NativeModulesProxy, requireNativeViewManager } from 'expo-core';
import { findNodeHandle, ViewPropTypes, Platform } from 'react-native';
const { ExpoBarCodeScannerModule } = NativeModulesProxy;
const EVENT_THROTTLE_MS = 500;
export default class BarCodeScanner extends React.Component {
    constructor(props) {
        super(props);
        this.setReference = (ref) => {
            if (ref) {
                this.barCodeScannerRef = ref;
                this.barCodeScannerHandle = findNodeHandle(ref);
            }
            else {
                this.barCodeScannerRef = null;
                this.barCodeScannerHandle = null;
            }
        };
        this.onObjectDetected = (callback) => ({ nativeEvent }) => {
            const { type } = nativeEvent;
            if (this.lastEvents[type] &&
                this.lastEventsTimes[type] &&
                JSON.stringify(nativeEvent) === this.lastEvents[type] &&
                new Date().getTime() - this.lastEventsTimes[type].getTime() < EVENT_THROTTLE_MS) {
                return;
            }
            if (callback) {
                callback(nativeEvent);
                this.lastEventsTimes[type] = new Date();
                this.lastEvents[type] = JSON.stringify(nativeEvent);
            }
        };
        this.lastEvents = {};
        this.lastEventsTimes = {};
    }
    static async scanFromURLAsync(url, barCodeTypes) {
        if (Array.isArray(barCodeTypes) && barCodeTypes.length === 0) {
            throw new Error('No barCodeTypes requested, provide at least one barCodeType for scanner');
        }
        if (Platform.OS === 'ios') {
            if (Array.isArray(barCodeTypes) && !barCodeTypes.includes(BarCodeScanner.Constants.BarCodeType.qr)) {
                // Only QR type is supported on iOS, fail if one tries to use other types
                throw new Error('Only QR type is supported by scanFromURLAsync() on iOS');
            }
            // on iOS use only supported QR type
            return ExpoBarCodeScannerModule.scanFromURLAsync(url, [BarCodeScanner.Constants.BarCodeType.qr]);
        }
        // on Android if barCodeTypes not provided use all available types
        const effectiveBarCodeTypes = barCodeTypes || Object.values(ExpoBarCodeScannerModule.BarCodeType);
        return ExpoBarCodeScannerModule.scanFromURLAsync(url, effectiveBarCodeTypes);
    }
    render() {
        const nativeProps = this.convertNativeProps(this.props);
        const { onBarCodeScanned } = this.props;
        return (<ExpoBarCodeScannerView {...nativeProps} ref={this.setReference} onBarCodeScanned={this.onObjectDetected(onBarCodeScanned)}/>);
    }
    convertNativeProps(props) {
        const newProps = mapValues(props, this.convertProp);
        return newProps;
    }
    convertProp(value, key) {
        if (typeof value === 'string' && BarCodeScanner.ConversionTables[key]) {
            return BarCodeScanner.ConversionTables[key][value];
        }
        return value;
    }
}
BarCodeScanner.Constants = {
    BarCodeType: ExpoBarCodeScannerModule.BarCodeType,
    Type: ExpoBarCodeScannerModule.Type,
};
BarCodeScanner.ConversionTables = {
    type: ExpoBarCodeScannerModule.Type,
};
BarCodeScanner.propTypes = {
    ...ViewPropTypes,
    onBarCodeScanned: PropTypes.func,
    barCodeTypes: PropTypes.array,
    type: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};
BarCodeScanner.defaultProps = {
    type: ExpoBarCodeScannerModule.Type.back,
    barCodeTypes: Object.values(ExpoBarCodeScannerModule.BarCodeType),
};
export const Constants = BarCodeScanner.Constants;
const ExpoBarCodeScannerView = requireNativeViewManager('ExpoBarCodeScannerView');
//# sourceMappingURL=BarCodeScanner.js.map