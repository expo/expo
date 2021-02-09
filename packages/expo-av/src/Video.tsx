import omit from 'lodash/omit';
import nullthrows from 'nullthrows';
import * as React from 'react';
import { findNodeHandle, Image, NativeMethods, StyleSheet, View } from 'react-native';

import {
  assertStatusValuesInBounds,
  getNativeSourceAndFullInitialStatusForLoadAsync,
  getNativeSourceFromSource,
  getUnloadedStatus,
  Playback,
  PlaybackMixin,
  AVPlaybackSource,
  AVPlaybackStatus,
  AVPlaybackStatusToSet,
  AVPlaybackNativeSource,
} from './AV';
import ExpoVideoManager from './ExpoVideoManager';
import ExponentAV from './ExponentAV';
import ExponentVideo from './ExponentVideo';
import {
  ExponentVideoComponent,
  VideoFullscreenUpdateEvent,
  VideoNativeProps,
  VideoNaturalSize,
  VideoProps,
  VideoReadyForDisplayEvent,
  ResizeMode,
  VideoState,
} from './Video.types';

export {
  ExponentVideoComponent,
  VideoFullscreenUpdateEvent,
  VideoNativeProps,
  VideoNaturalSize,
  VideoProps,
  VideoReadyForDisplayEvent,
  ResizeMode,
  VideoState,
  AVPlaybackStatus,
  AVPlaybackStatusToSet,
  AVPlaybackNativeSource,
};

export const FULLSCREEN_UPDATE_PLAYER_WILL_PRESENT = 0;
export const FULLSCREEN_UPDATE_PLAYER_DID_PRESENT = 1;
export const FULLSCREEN_UPDATE_PLAYER_WILL_DISMISS = 2;
export const FULLSCREEN_UPDATE_PLAYER_DID_DISMISS = 3;

export const IOS_FULLSCREEN_UPDATE_PLAYER_WILL_PRESENT = FULLSCREEN_UPDATE_PLAYER_WILL_PRESENT;
export const IOS_FULLSCREEN_UPDATE_PLAYER_DID_PRESENT = FULLSCREEN_UPDATE_PLAYER_DID_PRESENT;
export const IOS_FULLSCREEN_UPDATE_PLAYER_WILL_DISMISS = FULLSCREEN_UPDATE_PLAYER_WILL_DISMISS;
export const IOS_FULLSCREEN_UPDATE_PLAYER_DID_DISMISS = FULLSCREEN_UPDATE_PLAYER_DID_DISMISS;

const _STYLES = StyleSheet.create({
  base: {
    overflow: 'hidden',
  },
  poster: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    resizeMode: 'contain',
  },
  video: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
  },
});

// On a real device UIManager should be present, however when running offline tests with jest-expo
// we have to use the provided native module mock to access constants
const ExpoVideoManagerConstants = ExpoVideoManager;
const ExpoVideoViewManager = ExpoVideoManager;

export default class Video extends React.Component<VideoProps, VideoState> implements Playback {
  static RESIZE_MODE_CONTAIN = ResizeMode.CONTAIN;
  static RESIZE_MODE_COVER = ResizeMode.COVER;
  static RESIZE_MODE_STRETCH = ResizeMode.STRETCH;

  static IOS_FULLSCREEN_UPDATE_PLAYER_WILL_PRESENT = IOS_FULLSCREEN_UPDATE_PLAYER_WILL_PRESENT;
  static IOS_FULLSCREEN_UPDATE_PLAYER_DID_PRESENT = IOS_FULLSCREEN_UPDATE_PLAYER_DID_PRESENT;
  static IOS_FULLSCREEN_UPDATE_PLAYER_WILL_DISMISS = IOS_FULLSCREEN_UPDATE_PLAYER_WILL_DISMISS;
  static IOS_FULLSCREEN_UPDATE_PLAYER_DID_DISMISS = IOS_FULLSCREEN_UPDATE_PLAYER_DID_DISMISS;

  static FULLSCREEN_UPDATE_PLAYER_WILL_PRESENT = FULLSCREEN_UPDATE_PLAYER_WILL_PRESENT;
  static FULLSCREEN_UPDATE_PLAYER_DID_PRESENT = FULLSCREEN_UPDATE_PLAYER_DID_PRESENT;
  static FULLSCREEN_UPDATE_PLAYER_WILL_DISMISS = FULLSCREEN_UPDATE_PLAYER_WILL_DISMISS;
  static FULLSCREEN_UPDATE_PLAYER_DID_DISMISS = FULLSCREEN_UPDATE_PLAYER_DID_DISMISS;

  _nativeRef = React.createRef<InstanceType<ExponentVideoComponent> & NativeMethods>();
  _onPlaybackStatusUpdate: ((status: AVPlaybackStatus) => void) | null = null;

  // componentOrHandle: null | number | React.Component<any, any> | React.ComponentClass<any>

  constructor(props: VideoProps) {
    super(props);
    this.state = {
      showPoster: !!props.usePoster,
    };
  }

  setNativeProps(nativeProps: VideoNativeProps) {
    const nativeVideo = nullthrows(this._nativeRef.current);
    nativeVideo.setNativeProps(nativeProps);
  }

  // Internal methods

  _handleNewStatus = (status: AVPlaybackStatus) => {
    if (
      this.state.showPoster &&
      status.isLoaded &&
      (status.isPlaying || status.positionMillis !== 0)
    ) {
      this.setState({ showPoster: false });
    }

    if (this.props.onPlaybackStatusUpdate) {
      this.props.onPlaybackStatusUpdate(status);
    }
    if (this._onPlaybackStatusUpdate) {
      this._onPlaybackStatusUpdate(status);
    }
  };

  _performOperationAndHandleStatusAsync = async (
    operation: (tag: number) => Promise<AVPlaybackStatus>
  ): Promise<AVPlaybackStatus> => {
    const video = this._nativeRef.current;
    if (!video) {
      throw new Error(`Cannot complete operation because the Video component has not yet loaded`);
    }

    const handle = findNodeHandle(this._nativeRef.current)!;
    const status: AVPlaybackStatus = await operation(handle);
    this._handleNewStatus(status);
    return status;
  };

  // ### iOS Fullscreening API ###

  _setFullscreen = async (value: boolean) => {
    return this._performOperationAndHandleStatusAsync((tag: number) =>
      ExpoVideoViewManager.setFullscreen(tag, value)
    );
  };

  presentFullscreenPlayer = async () => {
    return this._setFullscreen(true);
  };

  presentIOSFullscreenPlayer = () => {
    console.warn(
      "You're using `presentIOSFullscreenPlayer`. Please migrate your code to use `presentFullscreenPlayer` instead."
    );
    return this.presentFullscreenPlayer();
  };

  presentFullscreenPlayerAsync = async () => {
    return await this.presentFullscreenPlayer();
  };

  dismissFullscreenPlayer = async () => {
    return this._setFullscreen(false);
  };

  dismissIOSFullscreenPlayer = () => {
    console.warn(
      "You're using `dismissIOSFullscreenPlayer`. Please migrate your code to use `dismissFullscreenPlayer` instead."
    );
    this.dismissFullscreenPlayer();
  };

  // ### Unified playback API ### (consistent with Audio.js)
  // All calls automatically call onPlaybackStatusUpdate as a side effect.

  // Get status API

  getStatusAsync = async (): Promise<AVPlaybackStatus> => {
    return this._performOperationAndHandleStatusAsync((tag: number) =>
      ExponentAV.getStatusForVideo(tag)
    );
  };

  // Loading / unloading API

  loadAsync = async (
    source: AVPlaybackSource,
    initialStatus: AVPlaybackStatusToSet = {},
    downloadFirst: boolean = true
  ): Promise<AVPlaybackStatus> => {
    const {
      nativeSource,
      fullInitialStatus,
    } = await getNativeSourceAndFullInitialStatusForLoadAsync(source, initialStatus, downloadFirst);
    return this._performOperationAndHandleStatusAsync((tag: number) =>
      ExponentAV.loadForVideo(tag, nativeSource, fullInitialStatus)
    );
  };

  // Equivalent to setting URI to null.
  unloadAsync = async (): Promise<AVPlaybackStatus> => {
    return this._performOperationAndHandleStatusAsync((tag: number) =>
      ExponentAV.unloadForVideo(tag)
    );
  };

  // Set status API (only available while isLoaded = true)

  setStatusAsync = async (status: AVPlaybackStatusToSet): Promise<AVPlaybackStatus> => {
    assertStatusValuesInBounds(status);
    return this._performOperationAndHandleStatusAsync((tag: number) =>
      ExponentAV.setStatusForVideo(tag, status)
    );
  };

  replayAsync = async (status: AVPlaybackStatusToSet = {}): Promise<AVPlaybackStatus> => {
    if (status.positionMillis && status.positionMillis !== 0) {
      throw new Error('Requested position after replay has to be 0.');
    }

    return this._performOperationAndHandleStatusAsync((tag: number) =>
      ExponentAV.replayVideo(tag, {
        ...status,
        positionMillis: 0,
        shouldPlay: true,
      })
    );
  };

  setOnPlaybackStatusUpdate(onPlaybackStatusUpdate: ((status: AVPlaybackStatus) => void) | null) {
    this._onPlaybackStatusUpdate = onPlaybackStatusUpdate;
    this.getStatusAsync();
  }

  // Methods of the Playback interface that are set via PlaybackMixin
  playAsync!: () => Promise<AVPlaybackStatus>;
  playFromPositionAsync!: (
    positionMillis: number,
    tolerances?: { toleranceMillisBefore?: number; toleranceMillisAfter?: number }
  ) => Promise<AVPlaybackStatus>;
  pauseAsync!: () => Promise<AVPlaybackStatus>;
  stopAsync!: () => Promise<AVPlaybackStatus>;
  setPositionAsync!: (
    positionMillis: number,
    tolerances?: { toleranceMillisBefore?: number; toleranceMillisAfter?: number }
  ) => Promise<AVPlaybackStatus>;
  setRateAsync!: (rate: number, shouldCorrectPitch: boolean) => Promise<AVPlaybackStatus>;
  setVolumeAsync!: (volume: number) => Promise<AVPlaybackStatus>;
  setIsMutedAsync!: (isMuted: boolean) => Promise<AVPlaybackStatus>;
  setIsLoopingAsync!: (isLooping: boolean) => Promise<AVPlaybackStatus>;
  setProgressUpdateIntervalAsync!: (
    progressUpdateIntervalMillis: number
  ) => Promise<AVPlaybackStatus>;

  // ### Callback wrappers ###

  _nativeOnPlaybackStatusUpdate = (event: { nativeEvent: AVPlaybackStatus }) => {
    this._handleNewStatus(event.nativeEvent);
  };

  // TODO make sure we are passing the right stuff
  _nativeOnLoadStart = () => {
    if (this.props.onLoadStart) {
      this.props.onLoadStart();
    }
  };

  _nativeOnLoad = (event: { nativeEvent: AVPlaybackStatus }) => {
    if (this.props.onLoad) {
      this.props.onLoad(event.nativeEvent);
    }
    this._handleNewStatus(event.nativeEvent);
  };

  _nativeOnError = (event: { nativeEvent: { error: string } }) => {
    const error: string = event.nativeEvent.error;
    if (this.props.onError) {
      this.props.onError(error);
    }
    this._handleNewStatus(getUnloadedStatus(error));
  };

  _nativeOnReadyForDisplay = (event: { nativeEvent: VideoReadyForDisplayEvent }) => {
    if (this.props.onReadyForDisplay) {
      this.props.onReadyForDisplay(event.nativeEvent);
    }
  };

  _nativeOnFullscreenUpdate = (event: { nativeEvent: VideoFullscreenUpdateEvent }) => {
    if (this.props.onIOSFullscreenUpdate && this.props.onFullscreenUpdate) {
      console.warn(
        "You've supplied both `onIOSFullscreenUpdate` and `onFullscreenUpdate`. You're going to receive updates on both the callbacks."
      );
    } else if (this.props.onIOSFullscreenUpdate) {
      console.warn(
        "You're using `onIOSFullscreenUpdate`. Please migrate your code to use `onFullscreenUpdate` instead."
      );
    }

    if (this.props.onIOSFullscreenUpdate) {
      this.props.onIOSFullscreenUpdate(event.nativeEvent);
    }

    if (this.props.onFullscreenUpdate) {
      this.props.onFullscreenUpdate(event.nativeEvent);
    }
  };

  _renderPoster = () =>
    this.props.usePoster && this.state.showPoster ? (
      // @ts-ignore: the react-native type declarations are overly restrictive
      <Image style={[_STYLES.poster, this.props.posterStyle]} source={this.props.posterSource!} />
    ) : null;

  render() {
    const source = getNativeSourceFromSource(this.props.source) || undefined;

    let nativeResizeMode = ExpoVideoManagerConstants.ScaleNone;
    if (this.props.resizeMode) {
      const resizeMode = this.props.resizeMode;
      if (resizeMode === ResizeMode.STRETCH) {
        nativeResizeMode = ExpoVideoManagerConstants.ScaleToFill;
      } else if (resizeMode === ResizeMode.CONTAIN) {
        nativeResizeMode = ExpoVideoManagerConstants.ScaleAspectFit;
      } else if (resizeMode === ResizeMode.COVER) {
        nativeResizeMode = ExpoVideoManagerConstants.ScaleAspectFill;
      }
    }

    // Set status via individual props
    const status: AVPlaybackStatusToSet = { ...this.props.status };
    [
      'progressUpdateIntervalMillis',
      'positionMillis',
      'shouldPlay',
      'rate',
      'shouldCorrectPitch',
      'volume',
      'isMuted',
      'isLooping',
    ].forEach(prop => {
      if (prop in this.props) {
        status[prop] = this.props[prop];
      }
    });

    // Replace selected native props
    // @ts-ignore: TypeScript thinks "children" is not in the list of props
    const nativeProps: VideoNativeProps = {
      ...omit(
        this.props,
        'source',
        'onPlaybackStatusUpdate',
        'usePoster',
        'posterSource',
        'posterStyle',
        ...Object.keys(status)
      ),
      style: StyleSheet.flatten([_STYLES.base, this.props.style]),
      source,
      resizeMode: nativeResizeMode,
      status,
      onStatusUpdate: this._nativeOnPlaybackStatusUpdate,
      onLoadStart: this._nativeOnLoadStart,
      onLoad: this._nativeOnLoad,
      onError: this._nativeOnError,
      onReadyForDisplay: this._nativeOnReadyForDisplay,
      onFullscreenUpdate: this._nativeOnFullscreenUpdate,
    };

    return (
      <View style={nativeProps.style} pointerEvents="box-none">
        <ExponentVideo ref={this._nativeRef} {...nativeProps} style={_STYLES.video} />
        {this._renderPoster()}
      </View>
    );
  }
}

Object.assign(Video.prototype, PlaybackMixin);
