import { requireNativeModule } from 'expo-modules-core';

import { UnloadFontOptions } from './Font.types';

export type ExpoFontLoaderModule = {
  getLoadedFonts: () => string[];
  loadAsync: (fontFamilyName: string, localUriOrWebAsset: any) => Promise<void>;
  // the following methods are only available on web
  unloadAllAsync?: () => Promise<void>;
  unloadAsync?: (fontFamilyName: string, options?: UnloadFontOptions) => Promise<void>;
  isLoaded?: (fontFamilyName: string, options?: UnloadFontOptions) => boolean;
  getServerResources?: () => string[];
  resetServerContext?: () => void;
};

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
