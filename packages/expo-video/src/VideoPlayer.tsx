import { useReleasingSharedObject } from 'expo-modules-core';
import resolveAssetSource from 'react-native/Libraries/Image/resolveAssetSource';

import NativeVideoModule from './NativeVideoModule';
import type { VideoPlayer, VideoSource } from './VideoPlayer.types';

const replace = NativeVideoModule.VideoPlayer.prototype.replace;
NativeVideoModule.VideoPlayer.prototype.replace = function (source: VideoSource) {
  return replace.call(this, parseSource(source));
};

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
    return { uri: resolveAssetSource(source).uri };
  } else if (typeof source === 'string') {
    return { uri: source };
  }

  if (typeof source?.uri === 'number') {
    return { ...source, uri: resolveAssetSource(source.uri).uri };
  }
  return source;
}

export default NativeVideoModule.VideoPlayer;
