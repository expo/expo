import { requireNativeModule } from 'expo-modules-core';

let ExponentConstants;
try {
  ExponentConstants = requireNativeModule('ExponentConstants');
} catch {}
export default ExponentConstants;
