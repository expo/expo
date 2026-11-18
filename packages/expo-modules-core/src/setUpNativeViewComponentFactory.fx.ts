import { createNativeViewComponent } from './NativeViewComponent';

type ExpoGlobalWithFactory = typeof globalThis.expo & {
  __createNativeViewComponent?: typeof createNativeViewComponent;
};

// Native calls the factory through the `expo` global the first time JS reads a view of Expo Modules v2
// from its module. It's installed when expo-modules-core loads, so before any module object is read.
if (globalThis.expo) {
  (globalThis.expo as ExpoGlobalWithFactory).__createNativeViewComponent =
    createNativeViewComponent;
}
