import { UnavailabilityError } from 'expo-errors';
import mapValues from 'lodash.mapvalues';
import PropTypes from 'prop-types';
import React from 'react';
import { findNodeHandle, Platform, ViewPropTypes } from 'react-native';
import ExpoBarCodeScannerModule from './ExpoBarCodeScannerModule';
import ExpoBarCodeScannerView from './ExpoBarCodeScannerView';
const { BarCodeType, Type } = ExpoBarCodeScannerModule;
const EVENT_THROTTLE_MS = 500;
export class BarCodeScanner extends React.Component {
    constructor(props) {
        super(props);
        this.barCodeScannerRef = null;
        this.barCodeScannerHandle = null;
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
        this.lastEvents = {};
        this.lastEventsTimes = {};
    }
    static async scanFromURLAsync(url, barCodeTypes) {
        if (!ExpoBarCodeScannerModule.scanFromURLAsync) {
            throw new UnavailabilityError('expo-barcode-scanner', 'scanFromURLAsync');
        }
        if (Array.isArray(barCodeTypes) && !barCodeTypes.length) {
            throw new Error('No barCodeTypes requested, provide at least one barCodeType for scanner');
        }
        if (Platform.OS === 'ios') {
            if (Array.isArray(barCodeTypes) && !barCodeTypes.includes(BarCodeType.qr)) {
                // Only QR type is supported on iOS, fail if one tries to use other types
                throw new Error('Only QR type is supported by scanFromURLAsync() on iOS');
            }
            // on iOS use only supported QR type
            return await ExpoBarCodeScannerModule.scanFromURLAsync(url, [BarCodeType.qr]);
        }
        // on Android if barCodeTypes not provided use all available types
        const effectiveBarCodeTypes = barCodeTypes || Object.values(BarCodeType);
        return await ExpoBarCodeScannerModule.scanFromURLAsync(url, effectiveBarCodeTypes);
    }
    render() {
        const nativeProps = this.convertNativeProps(this.props);
        const { onBarCodeScanned, onBarCodeRead } = this.props;
        return (<ExpoBarCodeScannerView {...nativeProps} ref={this.setReference} onBarCodeScanned={this.onObjectDetected(onBarCodeScanned || onBarCodeRead)} // onBarCodeRead is deprecated
        />);
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
    BarCodeType,
    Type,
};
BarCodeScanner.ConversionTables = {
    type: Type,
};
BarCodeScanner.propTypes = {
    ...ViewPropTypes,
    onBarCodeScanned: PropTypes.func,
    barCodeTypes: PropTypes.array,
    type: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};
BarCodeScanner.defaultProps = {
    type: Type.back,
    barCodeTypes: Object.values(BarCodeType),
};
export const { Constants } = BarCodeScanner;
//# sourceMappingURL=BarCodeScanner.js.map