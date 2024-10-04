import { Platform } from 'expo-modules-core';
import CameraManager from '../ExpoCameraManager';
// Values under keys from this object will be transformed to native options
export const ConversionTables = {
    type: CameraManager.Type,
    flashMode: CameraManager.FlashMode,
};
export function convertNativeProps(props) {
    if (!props || typeof props !== 'object') {
        return {};
    }
    const nativeProps = {};
    for (const [key, value] of Object.entries(props)) {
        if (typeof value === 'string' && ConversionTables[key]) {
            nativeProps[key] = ConversionTables[key][value];
        }
        else {
            nativeProps[key] = value;
        }
    }
    return nativeProps;
}
export function ensureNativeProps(props) {
    const newProps = convertNativeProps(props);
    if (newProps.onBarcodeScanned) {
        newProps.barcodeScannerEnabled = true;
    }
    if (Platform.OS !== 'web') {
        delete newProps.poster;
    }
    return newProps;
}
//# sourceMappingURL=props.js.map