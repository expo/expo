import * as React from 'react';
import { StyleSheet, View } from 'react-native';

import { PlaybackNativeSource, PlaybackStatus, PlaybackStatusToSet } from './AV';

type ExponentVideoProps = {
  source: PlaybackNativeSource | null;
  resizeMode?: Object;
  status?: PlaybackStatusToSet;
  useNativeControls?: boolean;
  onStatusUpdate?: (event: Object) => void;
  onReadyForDisplay?: (event: Object) => void;
  onFullscreenUpdate?: (event: Object) => void;
  onLoadStart: () => void;
  onLoad: (event: { nativeEvent: PlaybackStatus }) => void;
  onError: (event: { nativeEvent: { error: string } }) => void;
  // Required by react-native
  scaleX?: number;
  scaleY?: number;
  translateX?: number;
  translateY?: number;
  rotation?: number;
} & React.ComponentProps<typeof View>;

export type NaturalSize = {
  width: number;
  height: number;
  orientation: 'portrait' | 'landscape';
};

export const FULLSCREEN_UPDATE_PLAYER_WILL_PRESENT = 0;
export const FULLSCREEN_UPDATE_PLAYER_DID_PRESENT = 1;
export const FULLSCREEN_UPDATE_PLAYER_WILL_DISMISS = 2;
export const FULLSCREEN_UPDATE_PLAYER_DID_DISMISS = 3;

export const IOS_FULLSCREEN_UPDATE_PLAYER_WILL_PRESENT = FULLSCREEN_UPDATE_PLAYER_WILL_PRESENT;
export const IOS_FULLSCREEN_UPDATE_PLAYER_DID_PRESENT = FULLSCREEN_UPDATE_PLAYER_DID_PRESENT;
export const IOS_FULLSCREEN_UPDATE_PLAYER_WILL_DISMISS = FULLSCREEN_UPDATE_PLAYER_WILL_DISMISS;
export const IOS_FULLSCREEN_UPDATE_PLAYER_DID_DISMISS = FULLSCREEN_UPDATE_PLAYER_DID_DISMISS;

function getStatusFromVideo(video?: HTMLVideoElement): PlaybackStatus {
  if (!video) {
    return {
      isLoaded: false,
      error: undefined,
    };
  }

  const isPlaying = !!(
    video.currentTime > 0 &&
    !video.paused &&
    !video.ended &&
    video.readyState > 2
  );
  const status: PlaybackStatus = {
    isLoaded: true,
    // androidImplementation?: string,
    uri: video.src,
    progressUpdateIntervalMillis: 100, //TODO: Bacon: Add interval between calls
    durationMillis: video.duration * 1000,
    positionMillis: video.currentTime * 1000,
    // playableDurationMillis: video.buffered * 1000,
    // seekMillisToleranceBefore?: number
    // seekMillisToleranceAfter?: number

    shouldPlay: video.autoplay,
    isPlaying,
    isBuffering: false, //video.waiting, // false, // TODO: Bacon: research

    rate: video.playbackRate,
    shouldCorrectPitch: false, // TODO: Bacon: research
    volume: video.volume,
    isMuted: video.muted,
    isLooping: video.loop,

    didJustFinish: video.ended, // true exactly once when the track plays to finish
  };
  console.log(status);
  return status;
}

export default class ExponentVideo extends React.Component<ExponentVideoProps> {
  _video?: HTMLVideoElement;

  onStatusUpdate = () => {
    if (!this.props.onStatusUpdate) {
      return;
    }

    this.props.onStatusUpdate(getStatusFromVideo(this._video));
  };
  onLoadStart = () => {
    if (!this.props.onLoadStart) {
      return;
    }
    this.props.onLoadStart();
    this.onStatusUpdate();
  };

  onLoadedData = event => {
    if (!this.props.onLoad) {
      return;
    }
    this.props.onLoad(event.nativeEvent);
    this.onStatusUpdate();
  };

  onError = event => {
    if (!this.props.onError) {
      return;
    }
    this.props.onError(event.nativeEvent);
    this.onStatusUpdate();
  };

  onProgress = () => {
    this.onStatusUpdate();
  };

  onSeeking = () => {
    this.onStatusUpdate();
  };

  onEnded = () => {
    this.onStatusUpdate();
  };

  onLoadedMetadata = () => {
    this.onStatusUpdate();
  };

  onCanPlay = ({ nativeEvent }) => {
    if (!this.props.onReadyForDisplay) {
      return;
    }
    this.props.onReadyForDisplay(nativeEvent);
    this.onStatusUpdate();
  };

  onStalled = () => {
    this.onStatusUpdate();
  };

  onRef = (ref: HTMLVideoElement) => {
    this._video = ref;
    this.onStatusUpdate();
  };

  render() {
    const { source, status = {}, useNativeControls, style } = this.props;
    console.log('ExponentVideo', source);
    return (
      <video
        ref={this.onRef}
        onLoadStart={this.onLoadStart}
        onLoadedData={this.onLoadedData}
        onError={this.onError}
        onProgress={this.onProgress}
        onSeeking={this.onSeeking}
        onEnded={this.onEnded}
        onLoadedMetadata={this.onLoadedMetadata}
        onCanPlay={this.onCanPlay}
        onStalled={this.onStalled}
        src={(source || { uri: undefined }).uri}
        muted={status.isMuted}
        loop={status.isLooping}
        autoPlay={status.shouldPlay}
        controls={useNativeControls}
        style={StyleSheet.flatten(style) as any}
      />
    );
  }
}
