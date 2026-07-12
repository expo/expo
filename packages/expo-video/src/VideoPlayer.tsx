import { useReleasingSharedObjectWithLifecycle } from 'expo-modules-core';
import { useState } from 'react';

import NativeVideoModule from './NativeVideoModule';
import type { VideoSource, VideoPlayer, PlayerBuilderOptions } from './VideoPlayer.types';
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
 * @param source -  A video source that is used to initialize the player.
 * @param playerBuilderOptions - Options to apply to the Android player builder before the native constructor is invoked.
 */
export function createVideoPlayer(
  source: VideoSource,
  playerBuilderOptions?: PlayerBuilderOptions
): VideoPlayer {
  const parsedSource = parseSource(source);
  return new NativeVideoModule.VideoPlayer(parsedSource, false, playerBuilderOptions);
}

/**
 * Creates a `VideoPlayer`, which will be automatically cleaned up when the component is unmounted.
 * @param source - A video source that is used to initialize the player.
 * @param setup - A function that allows setting up the player. It will run after the player is created.
 * @param playerBuilderOptions - Options to apply to the Android player builder before the native constructor is invoked.
 */
export function useVideoPlayer(
  source: VideoSource,
  setup?: (player: VideoPlayer) => void,
  playerBuilderOptions?: PlayerBuilderOptions
): VideoPlayer {
  const parsedSource = parseSource(source);
  const parsedSourceKey = JSON.stringify(parsedSource);
  const playerBuilderOptionsKey = JSON.stringify(playerBuilderOptions);
  const [forceRecreateCount, setForceRecreateCount] = useState(0);

  return useReleasingSharedObjectWithLifecycle(
    {
      factory: () => {
        const player = new NativeVideoModule.VideoPlayer(parsedSource, false, playerBuilderOptions);
        setup?.(player);
        return player;
      },
      shouldRecreate: (_player, { previousDependencies, dependencies }) => {
        // Recreate if builder options ([1]) changed or if replaceAsync failed ([2]).
        return (
          previousDependencies[1] !== dependencies[1] || previousDependencies[2] !== dependencies[2]
        );
      },
      update: (player, { previousDependencies, dependencies }) => {
        // Source ([0]) changed — use replaceAsync; fall back to recreate on failure.
        if (previousDependencies[0] !== dependencies[0]) {
          player.replaceAsync(parsedSource).catch(() => {
            setForceRecreateCount((c) => c + 1);
          });
        }
      },
    },
    [parsedSourceKey, playerBuilderOptionsKey, forceRecreateCount] // [0] source, [1] options, [2] recreate counter
  );
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
