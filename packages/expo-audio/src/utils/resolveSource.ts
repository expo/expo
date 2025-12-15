import { Asset } from 'expo-asset';
import { Platform } from 'expo-modules-core';

import { AudioSource } from '../Audio.types';

type AudioSourceObject = Exclude<AudioSource, string | number | null>;

function getAssetFromSource(source?: AudioSource | string | number | Asset | null): Asset | null {
  if (!source) {
    return null;
  }

  if (source instanceof Asset) {
    return source;
  }

  if (typeof source === 'number') {
    return Asset.fromModule(source);
  }

  if (typeof source === 'object') {
    if ('assetId' in source && typeof source.assetId === 'number') {
      return Asset.fromModule(source.assetId);
    }
    if ('uri' in source && typeof source.uri === 'string') {
      return Asset.fromURI(source.uri);
    }
  }

  if (typeof source === 'string') {
    return Asset.fromURI(source);
  }

  return null;
}

function createSourceFromAsset(
  asset: Asset,
  extras: { assetId?: number; headers?: Record<string, string> } = {}
): AudioSourceObject {
  const uri = asset.localUri ?? asset.uri;
  const result: AudioSourceObject = { uri };

  if (extras.assetId != null) {
    result.assetId = extras.assetId;
  }
  if (extras.headers) {
    result.headers = extras.headers;
  }

  return result;
}

export function resolveSource(source?: AudioSource | string | number | null): AudioSource | null {
  if (source == null) {
    return null;
  }

  if (source instanceof Asset) {
    return createSourceFromAsset(source);
  }

  if (typeof source === 'string') {
    return { uri: source };
  }
  if (typeof source === 'number') {
    const asset = Asset.fromModule(source);
    return createSourceFromAsset(asset, { assetId: source });
  }

  if (typeof source === 'object') {
    if ('assetId' in source && typeof source.assetId === 'number') {
      const asset = Asset.fromModule(source.assetId);
      return {
        ...source,
        uri: asset.localUri ?? asset.uri,
      };
    }
    if ('uri' in source && typeof source.uri === 'string') {
      return source;
    }
  }

  return source ?? null;
}

/**
 * Resolves and optionally downloads an audio source before loading.
 * Similar to expo-av's getNativeSourceAndFullInitialStatusForLoadAsync but simplified for expo-audio.
 */
export async function resolveSourceWithDownload(
  source: AudioSource | string | number | null
): Promise<AudioSource | null> {
  const asset = getAssetFromSource(source);
  const fallbackSource = resolveSource(source);

  if (asset) {
    let assetToDownload: Asset = asset;
    try {
      // iOS AVPlayer fails to load the asset if the type is not set or can't be inferred
      // since this is an audio asset, we can safely set the type to mp3 or any other audio type
      // and iOS will be able to download and play the asset
      // Since expo-asset caches, this will only run once per asset, as long as the asset is not deleted from the cache
      if (!assetToDownload.type) {
        assetToDownload = new Asset({
          name: asset.name,
          type: 'mp3',
          uri: asset.uri,
        });
      }

      // FYI: downloadAsync is a no-op on web and immediately returns a promise that resolves to the original url
      // TODO(@hirbod): evaluate if we should implement downloadAsync for web instead
      await assetToDownload.downloadAsync();

      // Use the local URI if available after download
      if (assetToDownload.localUri) {
        let finalUri = assetToDownload.localUri;

        // On web, we need to fetch the audio file and create a blob URL
        // this fully downloads the file to the user's device memory and makes it available for the user to play
        // fetch() is subject to CORS restrictions, so we need to document this for the users on web
        // TODO(@hirbod): evaluate if we should implement a downloadAsync for web instead of using fetch here
        if (Platform.OS === 'web') {
          const response = await fetch(assetToDownload.localUri);
          const blob = await response.blob();
          finalUri = URL.createObjectURL(blob);
        }

        if (fallbackSource && typeof fallbackSource === 'object') {
          return {
            ...fallbackSource,
            uri: finalUri,
          };
        }

        return { uri: finalUri };
      } else {
        console.warn(
          'No localUri found, asset may not have downloaded properly, returning the original source'
        );
      }
    } catch (error) {
      // If download fails, fall back to original source
      console.warn('expo-audio: Failed to download asset, falling back to original source:', error);
    }
  }

  // Fallback to normal resolution
  return fallbackSource;
}
