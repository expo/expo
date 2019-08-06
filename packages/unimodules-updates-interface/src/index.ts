import { NativeModulesProxy } from '@unimodules/core';

const { UnimodulesUpdatesInterface } = NativeModulesProxy;

export { default as UnimodulesUpdatesInterfaceView } from './UnimodulesUpdatesInterfaceView';

export async function someGreatMethodAsync(options: any) {
  return await UnimodulesUpdatesInterface.someGreatMethodAsync(options);
}
