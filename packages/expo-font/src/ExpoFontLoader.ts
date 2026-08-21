import { requireNativeModule } from 'expo-modules-core';

import type { ServerFontResourceDescriptor, UnloadFontOptions } from './Font.types';

export type NativeFontFace = {
  localUri: string;
  weight?: number;
  style?: 'normal' | 'italic';
};

export type ExpoFontLoaderModule = {
  getLoadedFonts: () => string[];
  loadAsync: (fontFamilyName: string, localUriOrWebAsset: any) => Promise<void>;
  // only available on native runtimes; web loads faces individually via `@font-face` instead
  loadFontFamilyAsync?: (fontFamilyName: string, faces: NativeFontFace[]) => Promise<void>;
  // the following methods are only available on web
  unloadAllAsync?: () => Promise<void>;
  unloadAsync?: (fontFamilyName: string, options?: UnloadFontOptions) => Promise<void>;
  isLoaded?: (fontFamilyName: string, options?: UnloadFontOptions) => boolean;
  getServerResources?: () => string[];
  getServerResourceDescriptors?: () => ServerFontResourceDescriptor[];
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
