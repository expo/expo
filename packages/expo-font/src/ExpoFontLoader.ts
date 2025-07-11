import { requireNativeModule } from 'expo-modules-core';

import { UnloadFontOptions } from './Font.types';

export interface ExpoFontLoaderModule {
  getLoadedFonts: () => string[];
  loadAsync: (fontFamilyName: string, localUriOrWebAsset: any) => Promise<void>;
  unloadAllAsync?: () => Promise<void>; // web-only
  unloadAsync?: (fontFamilyName: string, options?: UnloadFontOptions) => Promise<void>; // web-only
  isLoaded?: (fontFamilyName: string, options?: UnloadFontOptions) => boolean; // web-only
  getServerResources?: () => string[]; // server-only
  resetServerContext?: () => void; // server-only
}

const m: ExpoFontLoaderModule =
  typeof window === 'undefined'
    ? // React server mock
      {
        getLoadedFonts() {
          return [];
        },
        loadAsync() {
          return Promise.resolve();
        },
      }
    : requireNativeModule('ExpoFontLoader');
export default m;
