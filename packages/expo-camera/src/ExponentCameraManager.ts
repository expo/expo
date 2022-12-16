import { requireNativeModule } from 'expo-modules-core';

const CameraManager: Record<string, any> = requireNativeModule('ExponentCamera');

export default CameraManager;
