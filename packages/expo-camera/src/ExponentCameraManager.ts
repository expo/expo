import { NativeModulesProxy } from '@unimodules/core';

const CameraManager: { [key: string]: any } =
  NativeModulesProxy.ExponentCameraManager || NativeModulesProxy.ExponentCameraModule;

export default CameraManager;
