import { NativeModulesProxy } from '@unimodules/core';

const { ExpoNetwork } = NativeModulesProxy;

export { default as ExpoNetworkView } from './ExpoNetworkView';

export async function someGreatMethodAsync(options: any) {
  return await ExpoNetwork.someGreatMethodAsync(options);
}
