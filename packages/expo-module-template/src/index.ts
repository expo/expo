import { NativeModulesProxy } from 'expo-core';

const { ExpoModuleTemplate } = NativeModulesProxy;

export { default as ExpoModuleTemplateView } from './ExpoModuleTemplateView';

export async function someGreatMethod() {
  return await ExpoModuleTemplate.someGreatMethod();
}
