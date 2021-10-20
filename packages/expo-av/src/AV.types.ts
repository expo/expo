import { Asset } from 'expo-asset';

import ExponentAV from './ExponentAV';

export enum PitchCorrectionQuality {
  Low = ExponentAV && ExponentAV.Qualities && ExponentAV.Qualities.Low,
  Medium = ExponentAV && ExponentAV.Qualities && ExponentAV.Qualities.Medium,
  High = ExponentAV && ExponentAV.Qualities && ExponentAV.Qualities.High,
}

export type AVPlaybackSource =
  | number
  | {
      uri: string;
      overrideFileExtensionAndroid?: string;
      headers?: { [fieldName: string]: string };
    }
  | Asset;

export type AVPlaybackNativeSource = {
  uri: string;
  overridingExtension?: string | null;
  headers?: { [fieldName: string]: string };
};

export type AVMetadata = {
  title?: string;
};

export type AVPlaybackStatus =
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

export type AVPlaybackStatusToSet = {
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
