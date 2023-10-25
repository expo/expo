import { requireNativeModule } from 'expo-modules-core';

const CameraManager: Record<string, any> = requireNativeModule('ExpoCameraNext');

export default CameraManager;
