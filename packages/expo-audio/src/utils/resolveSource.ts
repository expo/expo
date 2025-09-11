import { Asset } from 'expo-asset';
import { Platform } from 'expo-modules-core';

import { AudioSource } from '../Audio.types';

export function resolveSource(source?: AudioSource | string | number | null): AudioSource | null {
  if (typeof source === 'string') {
    return { uri: source };
  }
  if (typeof source === 'number') {
    const asset = Asset.fromModule(source);
    return { uri: asset.uri, assetId: source };
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
  let asset: Asset | null = null;

  // Get asset from different source types
  if (typeof source === 'number') {
    asset = Asset.fromModule(source);
  } else if (source instanceof Asset) {
    asset = source;
  } else if (typeof source === 'string') {
    // For remote URLs, create an asset from URI
    asset = Asset.fromURI(source);
  } else if (source && typeof source === 'object' && source.uri) {
    // For source objects with URI
    asset = Asset.fromURI(source.uri);
  } else if (source && typeof source === 'object' && source.assetId) {
    // For source objects with assetId
    asset = Asset.fromModule(source.assetId);
  }

  if (asset) {
    try {
      // iOS AVPlayer fails to load the asset if the type is not set or can't be inferred
      // since this is an audio asset, we can safely set the type to mp3 or any other audio type
      // and iOS will be able to download and play the asset
      // Since expo-asset caches, this will only run once per asset, as long as the asset is not deleted from the cache
      if (!asset.type) {
        asset = new Asset({
          name: asset.name,
          type: 'mp3',
          uri: asset.uri,
        });
      }

      // FYI: downloadAsync is a no-op on web and immediately returns a promise that resolves to the original url
      // TODO(@hirbod): evaluate if we should implement downloadAsync for web instead
      await asset.downloadAsync();

      // Use the local URI if available after download
      if (asset.localUri) {
        let finalUri = asset.localUri;

        // On web, we need to fetch the audio file and create a blob URL
        // this fully downloads the file to the user's device memory and makes it available for the user to play
        // fetch() is subject to CORS restrictions, so we need to document this for the users on web
        // TODO(@hirbod): evaluate if we should implement a downloadAsync for web instead of using fetch here
        if (Platform.OS === 'web') {
          const response = await fetch(asset.localUri);
          const blob = await response.blob();
          finalUri = URL.createObjectURL(blob);
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
  return resolveSource(source);
}
