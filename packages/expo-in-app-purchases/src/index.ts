import { NativeModulesProxy } from '@unimodules/core';

const { ExpoInAppPurchases } = NativeModulesProxy;

export { default as ExpoInAppPurchasesView } from './ExpoInAppPurchasesView';

export async function someGreatMethodAsync(options: any) {
  return await ExpoInAppPurchases.someGreatMethodAsync(options);
}
