import type { ExpoFontLoaderModule } from '../src/ExpoFontLoader';

export const loadAsync: ExpoFontLoaderModule['loadAsync'] = jest.fn(async function mockLoadAsync(
  fontFamilyName: string,
  localUriOrWebAsset: any
): Promise<void> {
  return Promise.resolve();
});

export const getLoadedFonts: ExpoFontLoaderModule['getLoadedFonts'] = jest.fn(
  function mockGetLoadedFonts() {
    return [];
  }
);

export const loadFontFamilyAsync: ExpoFontLoaderModule['loadFontFamilyAsync'] = jest.fn(
  async function mockLoadFontFamilyAsync(fontFamilyName: string, faces: any[]): Promise<void> {
    return Promise.resolve();
  }
);

// the below are used only on web
const mod = jest.requireActual('../src/ExpoFontLoader.web');

export const unloadAllAsync: ExpoFontLoaderModule['unloadAllAsync'] = jest.fn(
  mod.default.unloadAllAsync
);

export const unloadAsync: ExpoFontLoaderModule['unloadAsync'] = jest.fn(mod.default.unloadAsync);

export const isLoaded: ExpoFontLoaderModule['isLoaded'] = jest.fn(mod.default.isLoaded);
