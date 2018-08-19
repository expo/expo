// @flow

import { Asset } from 'expo-asset';

// TODO add:
//  disableFocusOnAndroid
//  audio routes (at least did become noisy on android)
//  pan
//  pitch
//  API to explicitly request audio focus / session
//  API to select stream type on Android
//  subtitles API

export type PlaybackSource =
  | number
  | { uri: string, overrideFileExtensionAndroid?: string }
  | Asset;
export type PlaybackNativeSource = { uri: string, overridingExtension?: ?string };

export type PlaybackStatus =
  | {
      isLoaded: false,
      androidImplementation?: string,
      error?: string, // populated exactly once when an error forces the object to unload
    }
  | {
      isLoaded: true,
      androidImplementation?: string,

      uri: string,

      progressUpdateIntervalMillis: number,
      durationMillis?: number,
      positionMillis: number,
      playableDurationMillis?: number,
      seekMillisToleranceBefore?: number,
      seekMillisToleranceAfter?: number,

      shouldPlay: boolean,
      isPlaying: boolean,
      isBuffering: boolean,

      rate: number,
      shouldCorrectPitch: boolean,
      volume: number,
      isMuted: boolean,
      isLooping: boolean,

      didJustFinish: boolean, // true exactly once when the track plays to finish
    };

export type PlaybackStatusToSet = {
  androidImplementation?: string,
  progressUpdateIntervalMillis?: number,
  positionMillis?: number,
  shouldPlay?: boolean,
  rate?: number,
  shouldCorrectPitch?: boolean,
  volume?: number,
  isMuted?: boolean,
  isLooping?: boolean,
};

export const _DEFAULT_PROGRESS_UPDATE_INTERVAL_MILLIS: number = 500;
export const _DEFAULT_INITIAL_PLAYBACK_STATUS: PlaybackStatusToSet = {
  positionMillis: 0,
  progressUpdateIntervalMillis: _DEFAULT_PROGRESS_UPDATE_INTERVAL_MILLIS,
  shouldPlay: false,
  rate: 1.0,
  shouldCorrectPitch: false,
  volume: 1.0,
  isMuted: false,
  isLooping: false,
};

const _getAssetFromPlaybackSource = (source: ?PlaybackSource): ?Asset => {
  if (source == null) {
    return null;
  }

  let asset: ?Asset = null;
  if (typeof source === 'number') {
    asset = Asset.fromModule(source);
  } else if (source instanceof Asset) {
    asset = source;
  }
  return asset;
};

export const _getNativeSourceFromSource = (source: ?PlaybackSource): ?PlaybackNativeSource => {
  let uri: ?string = null;
  let overridingExtension: ?string = null;

  let asset: ?Asset = _getAssetFromPlaybackSource(source);
  if (asset != null) {
    uri = asset.localUri || asset.uri;
  } else if (
    source != null &&
    typeof source !== 'number' &&
    'uri' in source &&
    typeof source.uri === 'string'
  ) {
    uri = source.uri;
  }

  if (uri == null) {
    return null;
  }

  if (
    source != null &&
    typeof source !== 'number' &&
    'overrideFileExtensionAndroid' in source &&
    typeof source.overrideFileExtensionAndroid === 'string'
  ) {
    overridingExtension = source.overrideFileExtensionAndroid;
  }
  return { uri, overridingExtension };
};

export const _throwErrorIfValuesOutOfBoundsInStatus = (status: PlaybackStatusToSet) => {
  if (typeof status.rate === 'number' && (status.rate < 0.0 || status.rate > 32.0)) {
    throw new Error('Rate value must be between 0.0 and 32.0.');
  }
  if (typeof status.volume === 'number' && (status.volume < 0.0 || status.volume > 1.0)) {
    throw new Error('Volume value must be between 0.0 and 1.0.');
  }
};

export const _getNativeSourceAndFullInitialStatusForLoadAsync = async (
  source: ?PlaybackSource,
  initialStatus: ?PlaybackStatusToSet,
  downloadFirst: boolean
): Promise<{
  nativeSource: PlaybackNativeSource,
  fullInitialStatus: PlaybackStatusToSet,
}> => {
  // Download first if necessary.
  let asset: ?Asset = _getAssetFromPlaybackSource(source);
  if (downloadFirst && asset != null) {
    // TODO we can download remote uri too once @nikki93 has integrated this into Asset
    await asset.downloadAsync();
  }

  // Get the native source
  const nativeSource: ?PlaybackNativeSource = _getNativeSourceFromSource(source);

  if (nativeSource == null) {
    throw new Error('Cannot load null source!');
  }

  // Get the full initial status
  const fullInitialStatus: PlaybackStatusToSet =
    initialStatus == null
      ? _DEFAULT_INITIAL_PLAYBACK_STATUS
      : {
          ..._DEFAULT_INITIAL_PLAYBACK_STATUS,
          ...initialStatus,
        };
  _throwErrorIfValuesOutOfBoundsInStatus(fullInitialStatus);

  return { nativeSource, fullInitialStatus };
};

export const _getUnloadedStatus = (error: ?string = null): PlaybackStatus => {
  const status: Object = { isLoaded: false };
  if (error) {
    status.error = error;
  }
  return status;
};

// TODO Unify 8 native calls into 4 by folding out PlayerData and then setting it in the Video component.
export const _COMMON_AV_PLAYBACK_METHODS = {
  // The following are separately defined in each playback object:
  //   getStatusAsync
  //   setOnPlaybackStatusUpdate
  //   loadAsync
  //   unloadAsync
  //   setStatusAsync
  //   replayAsync

  async playAsync(): Promise<PlaybackStatus> {
    return this.setStatusAsync({ shouldPlay: true });
  },
  async playFromPositionAsync(
    positionMillis: number,
    tolerances: { toleranceMillisBefore?: number, toleranceMillisAfter?: number } = {}
  ): Promise<PlaybackStatus> {
    return this.setStatusAsync({
      positionMillis,
      shouldPlay: true,
      seekMillisToleranceAfter: tolerances.toleranceMillisAfter,
      seekMillisToleranceBefore: tolerances.toleranceMillisBefore,
    });
  },
  async pauseAsync(): Promise<PlaybackStatus> {
    return this.setStatusAsync({ shouldPlay: false });
  },
  async stopAsync(): Promise<PlaybackStatus> {
    return this.setStatusAsync({ positionMillis: 0, shouldPlay: false });
  },
  async setPositionAsync(
    positionMillis: number,
    tolerances: { toleranceMillisBefore?: number, toleranceMillisAfter?: number } = {}
  ): Promise<PlaybackStatus> {
    return this.setStatusAsync({
      positionMillis,
      seekMillisToleranceAfter: tolerances.toleranceMillisAfter,
      seekMillisToleranceBefore: tolerances.toleranceMillisBefore,
    });
  },
  async setRateAsync(rate: number, shouldCorrectPitch: boolean): Promise<PlaybackStatus> {
    return this.setStatusAsync({ rate, shouldCorrectPitch });
  },
  async setVolumeAsync(volume: number): Promise<PlaybackStatus> {
    return this.setStatusAsync({ volume });
  },
  async setIsMutedAsync(isMuted: boolean): Promise<PlaybackStatus> {
    return this.setStatusAsync({ isMuted });
  },
  async setIsLoopingAsync(isLooping: boolean): Promise<PlaybackStatus> {
    return this.setStatusAsync({ isLooping });
  },
  async setProgressUpdateIntervalAsync(
    progressUpdateIntervalMillis: number
  ): Promise<PlaybackStatus> {
    return this.setStatusAsync({ progressUpdateIntervalMillis });
  },
};
