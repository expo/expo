import { NativeModulesProxy } from 'expo-core';

const { ExpoBrightness } = NativeModulesProxy;

export { default as ExpoBrightnessView } from './ExpoBrightnessView';

export async function someGreatMethodAsync(options: any) {
  return await ExpoBrightness.someGreatMethodAsync(options);
}
