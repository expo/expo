import { requireNativeModule } from 'expo-modules-core';

const m =
  typeof window === 'undefined'
    ? // React server mock
      {
        getLoadedFonts() {
          return [];
        },
      }
    : requireNativeModule('ExpoFontLoader');
export default m;
