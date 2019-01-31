import { NativeModulesProxy } from 'expo-core';

const { ExpoWebBrowser } = NativeModulesProxy;

export { default as ExpoWebBrowserView } from './ExpoWebBrowserView';

export async function someGreatMethodAsync(options: any) {
  return await ExpoWebBrowser.someGreatMethodAsync(options);
}
