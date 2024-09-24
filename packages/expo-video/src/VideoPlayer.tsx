import { applicationName } from 'expo-application';
import { useReleasingSharedObject } from 'expo-modules-core';
import { useEffect } from 'react';
import resolveAssetSource from 'react-native/Libraries/Image/resolveAssetSource';

import NativeVideoModule from './NativeVideoModule';
import type { VideoPlayer, VideoSource } from './VideoPlayer.types';

// TODO: Temporary solution until we develop a way of overriding prototypes that won't break the lazy loading of the module.
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

  // If the application name contains ANY non-ascii characters, raise a warning to the user because it can cause video playback issues on Android.
  useEffect(() => {
    if (applicationName && /[^\x00-\x7F]/.test(applicationName)) {
      console.warn(
        `The application name "${applicationName}" contains non-ASCII characters. ` +
          'This can cause video playback issues on Android. To work around this issue, specify a custom User-Agent string containing ASCII-only characters via the headers property on the video source.'
      );
    }
  }, []);

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

  if (typeof source?.assetId === 'number' && !source.uri) {
    return { ...source, uri: resolveAssetSource(source.assetId).uri };
  }
  return source;
}

export default NativeVideoModule.VideoPlayer;
