import { requireNativeViewManager } from 'expo';
import React from 'react';

const ExpoBarCodeScannerView: React.ComponentType<any> =
  requireNativeViewManager('ExpoBarCodeScanner');

export default ExpoBarCodeScannerView;
