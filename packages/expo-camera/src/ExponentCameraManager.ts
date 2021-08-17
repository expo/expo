import { NativeModulesProxy } from 'expo-modules-core';

const CameraManager: Record<string, any> =
  NativeModulesProxy.ExponentCameraManager || NativeModulesProxy.ExponentCameraModule;

export default CameraManager;
