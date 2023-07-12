import { requireNativeModule } from 'expo-modules-core';

let ExpoDevMenu;
// Use try-catch to prevent crashes in release builds
try {
  ExpoDevMenu = requireNativeModule('ExpoDevMenu');
} catch {
  ExpoDevMenu = null;
}

export default ExpoDevMenu;
