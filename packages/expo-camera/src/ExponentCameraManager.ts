import { NativeModulesProxy } from '@unimodules/core';

const CameraManager: Record<string, any> =
  NativeModulesProxy.ExponentCameraManager || NativeModulesProxy.ExponentCameraModule;

export default CameraManager;
