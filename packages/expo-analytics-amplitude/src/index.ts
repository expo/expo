import { NativeModulesProxy } from 'expo-core';

const { ExpoAmplitude } = NativeModulesProxy;

export { default as ExpoAmplitudeView } from './ExpoAmplitudeView';

export async function someGreatMethodAsync(options: any) {
  return await ExpoAmplitude.someGreatMethodAsync(options);
}
