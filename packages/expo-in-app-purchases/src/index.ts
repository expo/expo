import { NativeModulesProxy } from '@unimodules/core';

const { ExpoInAppPurchases } = NativeModulesProxy;

export { default as ExpoInAppPurchasesView } from './ExpoInAppPurchasesView';

export async function connectToAppStoreAsync(options: any) {
  console.log('calling connectToAppStoreAsync from TS');
  return await ExpoInAppPurchases.connectToAppStoreAsync(options);
}
