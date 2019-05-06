import { NativeModulesProxy } from '@unimodules/core';

const { ExpoUpdates } = NativeModulesProxy;

export { default as ExpoUpdatesView } from './ExpoUpdatesView';

export async function someGreatMethodAsync(options: any) {
  return await ExpoUpdates.someGreatMethodAsync(options);
}
