import * as React from 'react';
import { StyleSheet, View } from 'react-native';

import { PlaybackNativeSource, PlaybackStatusToSet } from './AV';

type ExponentVideoProps = {
  source: PlaybackNativeSource | null;
  nativeResizeMode?: Object;
  status?: PlaybackStatusToSet;
  onStatusUpdateNative?: (event: Object) => void;
  onReadyForDisplayNative?: (event: Object) => void;
  onFullscreenUpdateNative?: (event: Object) => void;
  useNativeControls?: boolean;

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

export default class ExponentVideo extends React.Component<ExponentVideoProps> {
  render() {
    const { source, status = {}, useNativeControls: controls, style } = this.props;

    return (
      <video
        src={(source || { uri: undefined }).uri}
        muted={status.isMuted}
        loop={status.isLooping}
        autoPlay={status.shouldPlay}
        controls={controls}
        style={StyleSheet.flatten(style) as any}
      />
    );
  }
}
