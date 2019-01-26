import { NativeModulesProxy } from 'expo-core';

const { ExpoModuleTemplate } = NativeModulesProxy;

export { default as ExpoModuleTemplateView } from './ExpoModuleTemplateView';

export async function someGreatMethodAsync(options: any) {
  return await ExpoModuleTemplate.someGreatMethodAsync(options);
}
