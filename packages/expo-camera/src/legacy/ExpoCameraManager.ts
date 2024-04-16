import { requireNativeModule } from 'expo-modules-core';

const CameraManager: Record<string, any> = requireNativeModule('ExpoCameraLegacy');

export default CameraManager;
