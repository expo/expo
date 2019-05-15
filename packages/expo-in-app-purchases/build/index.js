import { NativeModulesProxy } from '@unimodules/core';
const { ExpoInAppPurchases } = NativeModulesProxy;
export { default as ExpoInAppPurchasesView } from './ExpoInAppPurchasesView';
export async function connectToAppStoreAsync(options) {
    console.log('calling connectToAppStoreAsync from TS');
    return await ExpoInAppPurchases.connectToAppStoreAsync(options);
}
//# sourceMappingURL=index.js.map