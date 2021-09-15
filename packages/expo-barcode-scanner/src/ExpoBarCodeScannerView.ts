import { requireNativeViewManager } from 'expo-modules-core';
import React from 'react';

const ExpoBarCodeScannerView: React.ComponentType<any> =
  requireNativeViewManager('ExpoBarCodeScannerView');

export default ExpoBarCodeScannerView;
