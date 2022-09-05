import { NativeModulesProxy } from 'expo-modules-core';

const CameraManager: Record<string, any> =
  NativeModulesProxy.ExponentCamera || NativeModulesProxy.ExponentCameraModule;

export default CameraManager;
