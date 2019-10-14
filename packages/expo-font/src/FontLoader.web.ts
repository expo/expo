import ExpoFontLoader from './ExpoFontLoader';
import { FontSource, FontResource } from './Font.types';
import { Asset } from 'expo-asset';

export function fontFamilyNeedsScoping(name: string): boolean {
  return false;
}

export function getAssetForSource(source: FontSource): Asset | FontResource {
  if (typeof source === 'object' && 'uri' in source) {
    return {
      // @ts-ignore
      display: source.display,
      // @ts-ignore
      uri: source.uri || source.localUri,
    };
  }

  if (typeof source !== 'string') {
    throw new Error(
      `Unexpected type ${typeof source} expected a URI string or Asset from expo-asset.`
    );
  }

  return {
    uri: source,
  };
}

export async function loadSingleFontAsync(
  name: string,
  input: Asset | FontResource
): Promise<void> {
  const asset = input as Asset;
  if (asset.downloadAsync) {
    throw new Error('expo-font: loadSingleFontAsync expected an asset of type FontResource on web');
  }

  await ExpoFontLoader.loadAsync(name, input);
}

export function getNativeFontName(name: string): string {
  return name;
}
