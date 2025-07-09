import { NativeModule } from 'expo-modules-core';

export default class MockNativeSensorModule extends NativeModule {
  startObserving = jest.fn(async () => {});
  stopObserving = jest.fn(async () => {});
  setUpdateInterval = jest.fn(async () => {});
}
