import { NativeModulesProxy } from 'expo-modules-core';
export default NativeModulesProxy.ExpoWebBrowser || ({} as any);
