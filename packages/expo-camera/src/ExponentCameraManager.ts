import { NativeModulesProxy } from '@unimodules/core';

const CameraManager: Object =
  NativeModulesProxy.ExponentCameraManager || NativeModulesProxy.ExponentCameraModule;

export default CameraManager;
