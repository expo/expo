import { requireNativeModule } from 'expo';

const CameraManager: Record<string, any> = requireNativeModule('ExpoCameraLegacy');

export default CameraManager;
