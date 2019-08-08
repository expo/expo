import { NativeModulesProxy } from '@unimodules/core';

const { ExpoModuleTemplate } = NativeModulesProxy;

export { default as ExpoModuleTemplateView } from './ExpoModuleTemplateView';

export async function someGreatMethodAsync(options: any) {
  return await ExpoModuleTemplate.someGreatMethodAsync(options);
}
