import type { ExpoFontLoaderModule } from '../src/ExpoFontLoader';

export const getLoadedFonts: ExpoFontLoaderModule['getLoadedFonts'] = (): string[] => {
  return [];
};

export const loadAsync: ExpoFontLoaderModule['loadAsync'] = async (
  fontFamilyName: string,
  localUriOrWebAsset: any
): Promise<void> => {};
