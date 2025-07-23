import * as React from 'react';
import { ViewProps } from 'react-native';
import createElement from 'react-native-web/dist/exports/createElement';

import { AVPlaybackNativeSource, AVPlaybackStatus, AVPlaybackStatusToSet } from './AV';
import ExponentAV from './ExponentAV';
import { addFullscreenListener } from './FullscreenUtils.web';
import {
  VideoFullscreenUpdate,
  VideoFullscreenUpdateEvent,
  VideoReadyForDisplayEvent,
} from './Video.types';

type ExponentVideoProps = {
  source: AVPlaybackNativeSource | null;
  resizeMode?: object;
  status?: AVPlaybackStatusToSet;
  useNativeControls?: boolean;
  onStatusUpdate?: (event: { nativeEvent: AVPlaybackStatus }) => void;
  onReadyForDisplay?: (event: { nativeEvent: VideoReadyForDisplayEvent }) => void;
  onFullscreenUpdate?: (event: { nativeEvent: VideoFullscreenUpdateEvent }) => void;
  onLoadStart: () => void;
  onLoad: (event: { nativeEvent: AVPlaybackStatus }) => void;
  onError: (event: { nativeEvent: { error: string } }) => void;
  // Required by react-native
  scaleX?: number;
  scaleY?: number;
  translateX?: number;
  translateY?: number;
  rotation?: number;
} & ViewProps;

export type NaturalSize = {
  width: number;
  height: number;
  orientation: 'portrait' | 'landscape';
};

const Video: any = React.forwardRef<HTMLVideoElement, ExponentVideoProps>((props, ref) =>
  createElement('video', { ...props, ref })
);

export default class ExponentVideo extends React.Component<ExponentVideoProps> {
  _video?: HTMLVideoElement;
  _removeFullscreenListener?: () => any;

  componentWillUnmount() {
    this._removeFullscreenListener?.();
  }

  getVideoElement = () => {
    return this._video;
  };

  onFullscreenChange = (isFullscreen: boolean) => {
    if (!this.props.onFullscreenUpdate) return;
    if (isFullscreen) {
      this.props.onFullscreenUpdate({
        nativeEvent: { fullscreenUpdate: VideoFullscreenUpdate.PLAYER_DID_PRESENT },
      });
    } else {
      this.props.onFullscreenUpdate({
        nativeEvent: { fullscreenUpdate: VideoFullscreenUpdate.PLAYER_DID_DISMISS },
      });
    }
  };

  onStatusUpdate = async () => {
    if (!this.props.onStatusUpdate) {
      return;
    }
    const nativeEvent = await ExponentAV.getStatusForVideo(this._video);
    this.props.onStatusUpdate({ nativeEvent });
  };

  onLoadStart = () => {
    if (!this.props.onLoadStart) {
      return;
    }
    this.props.onLoadStart();
    this.onStatusUpdate();
  };

  onLoadedData = (event: { nativeEvent: AVPlaybackStatus }) => {
    if (!this.props.onLoad) {
      return;
    }
    this.props.onLoad(event);
    this.onStatusUpdate();
  };

  onError = (event: { nativeEvent: { error: string } }) => {
    if (!this.props.onError) {
      return;
    }
    this.props.onError(event);
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

  onCanPlay = (event: { nativeEvent: VideoReadyForDisplayEvent }) => {
    if (!this.props.onReadyForDisplay) {
      return;
    }
    this.props.onReadyForDisplay(event);
    this.onStatusUpdate();
  };

  onStalled = () => {
    this.onStatusUpdate();
  };

  onRef = (ref: HTMLVideoElement | null) => {
    this._removeFullscreenListener?.();
    if (ref) {
      this._video = ref;
      this._removeFullscreenListener = addFullscreenListener(this._video, this.onFullscreenChange);
      this.onStatusUpdate();
    } else {
      this._removeFullscreenListener = undefined;
    }
  };

  render() {
    const { source, status = {}, resizeMode: objectFit, useNativeControls, style } = this.props;

    const customStyle = {
      position: undefined,
      objectFit,
      overflow: 'hidden',
    };
    return (
      <Video
        ref={this.onRef}
        onLoadStart={this.onLoadStart}
        onLoadedData={this.onLoadedData}
        onError={this.onError}
        onTimeUpdate={this.onProgress}
        onSeeking={this.onSeeking}
        onEnded={this.onEnded}
        onLoadedMetadata={this.onLoadedMetadata}
        onCanPlay={this.onCanPlay}
        onStalled={this.onStalled}
        src={source?.uri || undefined}
        muted={status.isMuted}
        loop={status.isLooping}
        autoPlay={status.shouldPlay}
        controls={useNativeControls}
        style={[style, customStyle]}
        playsInline
      />
    );
  }
}
