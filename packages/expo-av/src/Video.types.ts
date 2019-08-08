import * as React from 'react';
import { View, StyleProp, ViewStyle } from 'react-native';

import { PlaybackNativeSource, PlaybackSource, PlaybackStatus, PlaybackStatusToSet } from './AV';
export type NaturalSize = {
  width: number;
  height: number;
  orientation: 'portrait' | 'landscape';
};

export enum ResizeMode {
  CONTAIN = 'contain',
  COVER = 'cover',
  STRETCH = 'stretch',
}

export type ReadyForDisplayEvent = {
  naturalSize: NaturalSize;
  status: PlaybackStatus;
};

export type FullscreenUpdateEvent = {
  fullscreenUpdate: 0 | 1 | 2 | 3;
  status: PlaybackStatus;
};

export type VideoProps = {
  // Source stuff
  source?: PlaybackSource; // { uri: 'http://foo/bar.mp4' }, Asset, or require('./foo/bar.mp4')
  posterSource?: { uri: string } | number; // { uri: 'http://foo/bar.mp4' } or require('./foo/bar.mp4')
  posterStyle?: StyleProp<ViewStyle>;

  // Callbacks
  onPlaybackStatusUpdate?: (status: PlaybackStatus) => void;
  onLoadStart?: () => void;
  onLoad?: (status: PlaybackStatus) => void;
  onError?: (error: string) => void;
  onReadyForDisplay?: (event: ReadyForDisplayEvent) => void;
  onFullscreenUpdate?: (event: FullscreenUpdateEvent) => void;
  onIOSFullscreenUpdate?: (event: FullscreenUpdateEvent) => void;

  // UI stuff
  useNativeControls?: boolean;
  // NOTE(ide): This should just be ResizeMode. We have the explicit strings for now since we don't
  // currently the ResizeMode enum.
  resizeMode?: ResizeMode | 'stretch' | 'cover' | 'contain';
  usePoster?: boolean;

  // Playback API
  status?: PlaybackStatusToSet;
  progressUpdateIntervalMillis?: number;
  positionMillis?: number;
  shouldPlay?: boolean;
  rate?: number;
  shouldCorrectPitch?: boolean;
  volume?: number;
  isMuted?: boolean;
  isLooping?: boolean;

  // Required by react-native
  scaleX?: number;
  scaleY?: number;
  translateX?: number;
  translateY?: number;
  rotation?: number;
} & React.ComponentProps<typeof View>;

export type NativeProps = {
  source?: PlaybackNativeSource | null;
  resizeMode?: unknown;
  status?: PlaybackStatusToSet;
  onLoadStart?: () => void;
  onLoad?: (event: { nativeEvent: PlaybackStatus }) => void;
  onError?: (event: { nativeEvent: { error: string } }) => void;
  onStatusUpdate?: (event: { nativeEvent: PlaybackStatus }) => void;
  onReadyForDisplay?: (event: { nativeEvent: ReadyForDisplayEvent }) => void;
  onFullscreenUpdate?: (event: { nativeEvent: FullscreenUpdateEvent }) => void;
  useNativeControls?: boolean;
} & React.ComponentProps<typeof View>;

export type VideoState = {
  showPoster: boolean;
};
export type ExponentVideoComponent = React.ComponentClass<NativeProps>;
