import { useReleasingSharedObject } from 'expo-modules-core';

import NativeVideoModule from './NativeVideoModule';
import { VideoSource, VideoPlayer } from './VideoPlayer.types';
import resolveAssetSource from './resolveAssetSource';

// TODO: Temporary solution until we develop a way of overriding prototypes that won't break the lazy loading of the module.
const replace = NativeVideoModule.VideoPlayer.prototype.replace;
NativeVideoModule.VideoPlayer.prototype.replace = function (
  source: VideoSource,
  disableWarning: boolean = false
) {
  if (!disableWarning) {
    console.warn(
      'On iOS `VideoPlayer.replace` loads the asset data synchronously on the main thread, which can lead to UI freezes and will be deprecated in a future release. Switch to `replaceAsync` for better user experience.'
    );
  }

  return replace.call(this, parseSource(source));
};

const replaceAsync = NativeVideoModule.VideoPlayer.prototype.replaceAsync;
NativeVideoModule.VideoPlayer.prototype.replaceAsync = function (source: VideoSource) {
  return replaceAsync.call(this, parseSource(source));
};
/**
 * Creates a direct instance of `VideoPlayer` that doesn't release automatically.
 *
 * > **info** For most use cases you should use the [`useVideoPlayer`](#usevideoplayer) hook instead. See the [Using the VideoPlayer Directly](#using-the-videoplayer-directly) section for more details.
 * @param source
 */
export function createVideoPlayer(source: VideoSource): VideoPlayer {
  return new NativeVideoModule.VideoPlayer(parseSource(source));
}

/**
 * Creates a `VideoPlayer`, which will be automatically cleaned up when the component is unmounted.
 * @param source - A video source that is used to initialize the player.
 * @param setup - A function that allows setting up the player. It will run after the player is created.
 */
export function useVideoPlayer(
  source: VideoSource,
  setup?: (player: VideoPlayer) => void
): VideoPlayer {
  const parsedSource = parseSource(source);

  return useReleasingSharedObject(() => {
    const player = new NativeVideoModule.VideoPlayer(parsedSource);
    setup?.(player);
    return player;
  }, [JSON.stringify(parsedSource)]);
}

function parseSource(source: VideoSource): VideoSource {
  if (typeof source === 'number') {
    // TODO(@kitten): This seems to not handle the `null` case. Is this correct?
    return { uri: resolveAssetSource(source)!.uri };
  } else if (typeof source === 'string') {
    return { uri: source };
  }

  if (typeof source?.assetId === 'number' && !source.uri) {
    // TODO(@kitten): This seems to not handle the `null` case. Is this correct?
    return { ...source, uri: resolveAssetSource(source.assetId)!.uri };
  }
  return source;
}
