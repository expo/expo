it(`native only`, () => {
  const { Platform } = require('expo-modules-core');
  expect(['ios', 'android'].includes(Platform.OS)).toBe(true);
  expect(Platform.OS).toMatchSnapshot();
});

it('mocks the AssetRegistry from react-native', () => {
  const { AssetRegistry } = require('react-native');
  expect(AssetRegistry.getAssetByID(1)).toMatchObject({ name: 'name' });
});

it('mocks the SharedObject classes that @expo/ui constructs', () => {
  const { requireNativeModule } = require('expo-modules-core');
  const ExpoUI = requireNativeModule('ExpoUI');
  const state = new ExpoUI.ObservableState({ value: 1 });
  state.setValue({ value: 2 });
  expect(state.getValue()).toBe(2);
  expect(new ExpoUI.WorkletCallback(null)).toBeInstanceOf(globalThis.expo.SharedObject);
});

it('mocks the views that @expo/ui reads from its package object', () => {
  const { requireNative } = require('expo-modules-core');
  const { GridRowView } = requireNative('@expo/ui');
  expect(GridRowView.displayName).toBe('GridRowView');
});
