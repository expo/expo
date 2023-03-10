import { requireNativeModule, NativeModulesProxy, Platform } from 'expo-modules-core';

const printModule =
  Platform.OS === 'ios' ? requireNativeModule('ExpoPrint') : NativeModulesProxy.ExponentPrint;

export default printModule;
