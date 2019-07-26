import { NativeModulesProxy } from '@unimodules/core';

const { ExpoCellular } = NativeModulesProxy;

export { default as ExpoCellularView } from './ExpoCellularView';

export async function someGreatMethodAsync(options: any) {
  return await ExpoCellular.someGreatMethodAsync(options);
}
