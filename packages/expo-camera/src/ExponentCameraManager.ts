import { NativeModulesProxy } from 'expo-modules-core';

const CameraManager: Record<string, any> = NativeModulesProxy.ExponentCamera;

export default CameraManager;
