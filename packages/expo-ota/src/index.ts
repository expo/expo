import { NativeModulesProxy } from '@unimodules/core';

const { ExpoOta } = NativeModulesProxy;

export { default as ExpoOtaView } from './ExpoOtaView';

export async function someGreatMethodAsync(options: any) {
  return await ExpoOta.someGreatMethodAsync(options);
}
