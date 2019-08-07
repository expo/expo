import ExponentAV from './ExponentAV';
import { Asset } from 'expo-asset';
import { Platform } from '@unimodules/core';
// TODO add:
//  disableFocusOnAndroid
//  audio routes (at least did become noisy on android)
//  pan
//  pitch
//  API to explicitly request audio focus / session
//  API to select stream type on Android
//  subtitles API

export enum PitchCorrectionQuality {
  Low = ExponentAV && ExponentAV.Qualities && ExponentAV.Qualities.Low,
  Medium = ExponentAV && ExponentAV.Qualities && ExponentAV.Qualities.Medium,
  High = ExponentAV && ExponentAV.Qualities && ExponentAV.Qualities.High,
}

export type PlaybackSource =
  | number
  | {
    uri: string;
    overrideFileExtensionAndroid?: string;
    headers?: { [fieldName: string]: string };
  }
  | Asset;

export type PlaybackNativeSource = {
  uri: string;
  overridingExtension?: string | null;
  headers?: { [fieldName: string]: string };
};

export type PlaybackStatus =
  | {
      isLoaded: false;
      androidImplementation?: string;
      error?: string; // populated exactly once when an error forces the object to unload
    }
  | {
      isLoaded: true;
      androidImplementation?: string;

      uri: string;

      progressUpdateIntervalMillis: number;
      durationMillis?: number;
      positionMillis: number;
      playableDurationMillis?: number;
      seekMillisToleranceBefore?: number;
      seekMillisToleranceAfter?: number;

      shouldPlay: boolean;
      isPlaying: boolean;
      isBuffering: boolean;

      rate: number;
      shouldCorrectPitch: boolean;
      volume: number;
      isMuted: boolean;
      isLooping: boolean;

      didJustFinish: boolean; // true exactly once when the track plays to finish
    };

export type PlaybackStatusToSet = {
  androidImplementation?: string;
  progressUpdateIntervalMillis?: number;
  positionMillis?: number;
  seekMillisToleranceBefore?: number;
  seekMillisToleranceAfter?: number;
  shouldPlay?: boolean;
  rate?: number;
  shouldCorrectPitch?: boolean;
  volume?: number;
  isMuted?: boolean;
  isLooping?: boolean;
  pitchCorrectionQuality?: PitchCorrectionQuality;
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

export function getNativeSourceFromSource(
  source?: PlaybackSource | null
): PlaybackNativeSource | null {
  let uri: string | null = null;
  let overridingExtension: string | null = null;
  let headers: { [fieldName: string]: string } | undefined;

  if (typeof source === 'string' && Platform.OS === 'web') {
    return {
      uri: source,
      overridingExtension,
      headers,
    };
  }

  let asset: Asset | null = _getAssetFromPlaybackSource(source);
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

  if (
    source != null &&
    typeof source !== 'number' &&
    'headers' in source &&
    typeof source.headers === 'object'
  ) {
    headers = source.headers;
  }
  return { uri, overridingExtension, headers };
}

function _getAssetFromPlaybackSource(source?: PlaybackSource | null): Asset | null {
  if (source == null) {
    return null;
  }

  let asset: Asset | null = null;
  if (typeof source === 'number') {
    asset = Asset.fromModule(source);
  } else if (source instanceof Asset) {
    asset = source;
  }
  return asset;
}

export function assertStatusValuesInBounds(status: PlaybackStatusToSet): void {
  if (typeof status.rate === 'number' && (status.rate < 0 || status.rate > 32)) {
    throw new RangeError('Rate value must be between 0.0 and 32.0');
  }
  if (typeof status.volume === 'number' && (status.volume < 0 || status.volume > 1)) {
    throw new RangeError('Volume value must be between 0.0 and 1.0');
  }
}

export async function getNativeSourceAndFullInitialStatusForLoadAsync(
  source: PlaybackSource | null,
  initialStatus: PlaybackStatusToSet | null,
  downloadFirst: boolean
): Promise<{
  nativeSource: PlaybackNativeSource;
  fullInitialStatus: PlaybackStatusToSet;
}> {
  // Get the full initial status
  const fullInitialStatus: PlaybackStatusToSet =
    initialStatus == null
      ? _DEFAULT_INITIAL_PLAYBACK_STATUS
      : {
          ..._DEFAULT_INITIAL_PLAYBACK_STATUS,
          ...initialStatus,
        };
  assertStatusValuesInBounds(fullInitialStatus);

  if (typeof source === 'string' && Platform.OS === 'web') {
    return {
      nativeSource: {
        uri: source,
        overridingExtension: null,
      },
      fullInitialStatus,
    };
  }

  // Download first if necessary.
  let asset = _getAssetFromPlaybackSource(source);
  if (downloadFirst && asset) {
    // TODO we can download remote uri too once @nikki93 has integrated this into Asset
    await asset.downloadAsync();
  }

  // Get the native source
  const nativeSource: PlaybackNativeSource | null = getNativeSourceFromSource(source);

  if (nativeSource === null) {
    throw new Error(`Cannot load an AV asset from a null playback source`);
  }

  return { nativeSource, fullInitialStatus };
}

export function getUnloadedStatus(error: string | null = null): PlaybackStatus {
  return {
    isLoaded: false,
    ...(error ? { error } : null),
  };
}

export interface AV {
  setStatusAsync(status: PlaybackStatusToSet): Promise<PlaybackStatus>;
}

export interface Playback extends AV {
  playAsync(): Promise<PlaybackStatus>;
  playFromPositionAsync(
    positionMillis: number,
    tolerances?: { toleranceMillisBefore?: number; toleranceMillisAfter?: number }
  ): Promise<PlaybackStatus>;
  pauseAsync(): Promise<PlaybackStatus>;
  stopAsync(): Promise<PlaybackStatus>;
  setPositionAsync(
    positionMillis: number,
    tolerances?: { toleranceMillisBefore?: number; toleranceMillisAfter?: number }
  ): Promise<PlaybackStatus>;
  setRateAsync(
    rate: number,
    shouldCorrectPitch: boolean,
    pitchCorrectionQuality?: PitchCorrectionQuality
  ): Promise<PlaybackStatus>;
  setVolumeAsync(volume: number): Promise<PlaybackStatus>;
  setIsMutedAsync(isMuted: boolean): Promise<PlaybackStatus>;
  setIsLoopingAsync(isLooping: boolean): Promise<PlaybackStatus>;
  setProgressUpdateIntervalAsync(progressUpdateIntervalMillis: number): Promise<PlaybackStatus>;
}

/**
 * A mixin that defines common playback methods for A/V classes so they implement the `Playback`
 * interface
 */
export const PlaybackMixin = {
  async playAsync(): Promise<PlaybackStatus> {
    return ((this as any) as AV).setStatusAsync({ shouldPlay: true });
  },

  async playFromPositionAsync(
    positionMillis: number,
    tolerances: { toleranceMillisBefore?: number; toleranceMillisAfter?: number } = {}
  ): Promise<PlaybackStatus> {
    return ((this as any) as AV).setStatusAsync({
      positionMillis,
      shouldPlay: true,
      seekMillisToleranceAfter: tolerances.toleranceMillisAfter,
      seekMillisToleranceBefore: tolerances.toleranceMillisBefore,
    });
  },

  async pauseAsync(): Promise<PlaybackStatus> {
    return ((this as any) as AV).setStatusAsync({ shouldPlay: false });
  },

  async stopAsync(): Promise<PlaybackStatus> {
    return ((this as any) as AV).setStatusAsync({ positionMillis: 0, shouldPlay: false });
  },

  async setPositionAsync(
    positionMillis: number,
    tolerances: { toleranceMillisBefore?: number; toleranceMillisAfter?: number } = {}
  ): Promise<PlaybackStatus> {
    return ((this as any) as AV).setStatusAsync({
      positionMillis,
      seekMillisToleranceAfter: tolerances.toleranceMillisAfter,
      seekMillisToleranceBefore: tolerances.toleranceMillisBefore,
    });
  },

  async setRateAsync(
    rate: number,
    shouldCorrectPitch: boolean = false,
    pitchCorrectionQuality: PitchCorrectionQuality = PitchCorrectionQuality.Low
  ): Promise<PlaybackStatus> {
    return ((this as any) as AV).setStatusAsync({
      rate,
      shouldCorrectPitch,
      pitchCorrectionQuality,
    });
  },

  async setVolumeAsync(volume: number): Promise<PlaybackStatus> {
    return ((this as any) as AV).setStatusAsync({ volume });
  },

  async setIsMutedAsync(isMuted: boolean): Promise<PlaybackStatus> {
    return ((this as any) as AV).setStatusAsync({ isMuted });
  },

  async setIsLoopingAsync(isLooping: boolean): Promise<PlaybackStatus> {
    return ((this as any) as AV).setStatusAsync({ isLooping });
  },

  async setProgressUpdateIntervalAsync(
    progressUpdateIntervalMillis: number
  ): Promise<PlaybackStatus> {
    return ((this as any) as AV).setStatusAsync({ progressUpdateIntervalMillis });
  },
};
