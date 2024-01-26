import { requireNativeModule } from 'expo-modules-core';

const CameraManager: Record<string, any> = requireNativeModule('ExpoCamera');

export default CameraManager;
