import ExpoFontLoader from './ExpoFontLoader';
import { canUseDOM } from 'fbjs/lib/ExecutionEnvironment';
import { FontSource, FontResource } from './FontTypes.web';
/**
 * A font source can be a URI, a module ID, or an Expo Asset.
 */

export function fontFamilyNeedsScoping(name: string): boolean {
  return false;
}

export function getAssetForSource(source: FontSource): FontResource {
  if (typeof source === 'object' && 'uri' in source) {
    return {
        display: source.display,
        // @ts-ignore
        uri: source.uri || source.localUri
    }
  }

  if (typeof source !== 'string') {
    throw new Error(`Unexpected type ${typeof source} expected a URI string or Asset from expo-asset.`);
  }

  return {
      uri: source
    };
}

export async function loadSingleFontAsync(name: string, asset: FontResource): Promise<void> {
    if (canUseDOM) {
        await ExpoFontLoader.loadAsync(name, asset);
    }
}

export function getNativeFontName(name: string): string {
    return name;
}
