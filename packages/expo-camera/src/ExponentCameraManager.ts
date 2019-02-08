import { NativeModulesProxy } from 'expo-core';

const CameraManager: Object =
  NativeModulesProxy.ExponentCameraManager || NativeModulesProxy.ExponentCameraModule;

export default CameraManager;
