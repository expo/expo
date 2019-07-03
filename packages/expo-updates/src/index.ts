import { NativeModulesProxy } from '@unimodules/core';

const { ExpoUpdates } = NativeModulesProxy;

export async function someGreatMethodAsync(options: any) {
  return await ExpoUpdates.someGreatMethodAsync(options);
}
