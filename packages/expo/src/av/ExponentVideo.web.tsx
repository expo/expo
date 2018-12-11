import * as React from 'react';
import { createElement, View } from 'react-native';

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
    const {
      source: sourceProp,
      nativeResizeMode,
      status: statusProp,
      onStatusUpdateNative,
      onReadyForDisplayNative,
      onFullscreenUpdateNative,
      useNativeControls: controls,
      style,
      ...props
    } = this.props;

    let source = sourceProp || { uri: undefined };
    let status = statusProp || {};
    const finalSource = source.uri || source;
    const srcKey = typeof finalSource === 'string' ? 'src' : 'srcObject';

    return createElement('video', {
      'object-fit': 'initial',
      [srcKey]: finalSource,
      muted: status.isMuted,
      loop: status.isLooping,
      playing: `${status.shouldPlay}`,
      volume: status.volume,
      controls,
      currenttime: status.positionMillis,
      playbackrate: status.rate,
      style,
    });
  }
}
