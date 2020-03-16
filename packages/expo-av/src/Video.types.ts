import * as React from 'react';
import { ImageProps, View } from 'react-native';

import {
  AVPlaybackNativeSource,
  AVPlaybackSource,
  AVPlaybackStatus,
  AVPlaybackStatusToSet,
} from './AV';

export type VideoNaturalSize = {
  width: number;
  height: number;
  orientation: 'portrait' | 'landscape';
};

export enum ResizeMode {
  CONTAIN = 'contain',
  COVER = 'cover',
  STRETCH = 'stretch',
}

export type VideoReadyForDisplayEvent = {
  naturalSize: VideoNaturalSize;
  status: AVPlaybackStatus;
};

export type VideoFullscreenUpdateEvent = {
  fullscreenUpdate: 0 | 1 | 2 | 3;
  status: AVPlaybackStatus;
};

export type VideoProps = {
  // Source stuff
  source?: AVPlaybackSource; // { uri: 'http://foo/bar.mp4' }, Asset, or require('./foo/bar.mp4')
  posterSource?: ImageProps['source']; // { uri: 'http://foo/bar.mp4' } or require('./foo/bar.mp4')
  posterStyle?: ImageProps['style'];

  // Callbacks
  onPlaybackStatusUpdate?: (status: AVPlaybackStatus) => void;
  onLoadStart?: () => void;
  onLoad?: (status: AVPlaybackStatus) => void;
  onError?: (error: string) => void;
  onReadyForDisplay?: (event: VideoReadyForDisplayEvent) => void;
  onFullscreenUpdate?: (event: VideoFullscreenUpdateEvent) => void;
  onIOSFullscreenUpdate?: (event: VideoFullscreenUpdateEvent) => void;

  // UI stuff
  useNativeControls?: boolean;
  // NOTE(ide): This should just be ResizeMode. We have the explicit strings for now since we don't
  // currently the ResizeMode enum.
  resizeMode?: ResizeMode | 'stretch' | 'cover' | 'contain';
  usePoster?: boolean;

  // Playback API
  status?: AVPlaybackStatusToSet;
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

export type VideoNativeProps = {
  source?: AVPlaybackNativeSource | null;
  resizeMode?: unknown;
  status?: AVPlaybackStatusToSet;
  onLoadStart?: () => void;
  onLoad?: (event: { nativeEvent: AVPlaybackStatus }) => void;
  onError?: (event: { nativeEvent: { error: string } }) => void;
  onStatusUpdate?: (event: { nativeEvent: AVPlaybackStatus }) => void;
  onReadyForDisplay?: (event: { nativeEvent: VideoReadyForDisplayEvent }) => void;
  onFullscreenUpdate?: (event: { nativeEvent: VideoFullscreenUpdateEvent }) => void;
  useNativeControls?: boolean;
} & React.ComponentProps<typeof View>;

export type VideoState = {
  showPoster: boolean;
};
export type ExponentVideoComponent = React.ComponentClass<VideoNativeProps>;
