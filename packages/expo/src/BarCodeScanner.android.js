import { NativeModules } from 'react-native';

const BarCodeScannerManager = NativeModules.ExponentBarCodeScannerModule;

// CameraBasedBarCodeScanner is broken in Android SDK 23 (black screen after first successful scan)
// We added back OldBarCodeScanner in a minor release so default to that but fall
// back to CameraBasedBarCodeScanner for SDK 23 clients before that minor release.
let BarCodeScannerImplementation;
if (BarCodeScannerManager) {
  BarCodeScannerImplementation = require('./OldBarCodeScanner').default;
} else {
  BarCodeScannerImplementation = require('./CameraBasedBarCodeScanner').default;
}

export default BarCodeScannerImplementation;
