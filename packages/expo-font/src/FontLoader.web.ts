import { Asset } from 'expo-asset';
import ExpoFontLoader from './ExpoFontLoader';
import { FontSource, FontResource } from './Font.types';

export function fontFamilyNeedsScoping(name: string): boolean {
  return false;
}

function isAsset(asset: any): asset is Asset {
  return typeof asset === 'object' && 'uri' in asset && 'name' in asset;
}

export function getAssetForSource(source: FontSource): FontResource {
  if (isAsset(source)) {
    return {
      uri: source.uri || source.localUri!,
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
  const asset = input as any;
  if (asset.downloadAsync) {
    throw new Error('expo-font: loadSingleFontAsync expected an asset of type FontResource on web');
  }

  await ExpoFontLoader.loadAsync(name, input);
}

export function getNativeFontName(name: string): string {
  return name;
}
