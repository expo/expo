import omit from 'lodash.omit';
import nullthrows from 'nullthrows';
import PropTypes from 'prop-types';
import * as React from 'react';
import {
  Image,
  NativeModules,
  StyleSheet,
  View,
  ViewPropTypes,
  findNodeHandle,
  requireNativeComponent,
  NativeComponent,
} from 'react-native';

import {
  assertStatusValuesInBounds,
  getNativeSourceAndFullInitialStatusForLoadAsync,
  getNativeSourceFromSource,
  getUnloadedStatus,
  Playback,
  PlaybackMixin,
  PlaybackSource,
  PlaybackNativeSource,
  PlaybackStatus,
  PlaybackStatusToSet,
} from './AV';

export type NaturalSize = {
  width: number;
  height: number;
  orientation: 'portrait' | 'landscape';
};

enum ResizeMode {
  CONTAIN = 'contain',
  COVER = 'cover',
  STRETCH = 'stretch',
}

type ReadyForDisplayEvent = {
  naturalSize: NaturalSize;
  status: PlaybackStatus;
};

type FullscreenUpdateEvent = {
  fullscreenUpdate: 0 | 1 | 2 | 3;
  status: PlaybackStatus;
};

type Props = {
  // Source stuff
  source?: PlaybackSource; // { uri: 'http://foo/bar.mp4' }, Asset, or require('./foo/bar.mp4')
  posterSource?: { uri: string } | number; // { uri: 'http://foo/bar.mp4' } or require('./foo/bar.mp4')

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
  // currently export the ResizeMode enum.
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
} & React.ElementProps<View>;

type NativeProps = {
  source: PlaybackNativeSource | null;
  nativeResizeMode?: Object;
  status?: PlaybackStatusToSet;
  onStatusUpdateNative?: (event: Object) => void;
  onReadyForDisplayNative?: (event: Object) => void;
  onFullscreenUpdateNative?: (event: Object) => void;
  useNativeControls?: boolean;
} & React.ElementProps<View>;

type State = {
  showPoster: boolean;
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
const ExpoVideoManagerConstants = NativeModules.UIManager.ExponentVideo
  ? NativeModules.UIManager.ExponentVideo.Constants
  : NativeModules.ExponentVideoManager;

export default class Video extends React.Component<Props, State> implements Playback {
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

  static propTypes = {
    // Source stuff
    source: PropTypes.oneOfType([
      PropTypes.shape({
        uri: PropTypes.string,
        overrideFileExtensionAndroid: PropTypes.string,
      }), // remote URI like { uri: 'http://foo/bar.mp4' }
      PropTypes.number, // asset module like require('./foo/bar.mp4')
    ]),
    posterSource: PropTypes.oneOfType([
      PropTypes.shape({
        uri: PropTypes.string,
      }), // remote URI like { uri: 'http://foo/bar.mp4' }
      PropTypes.number, // asset module like require('./foo/bar.mp4')
    ]),

    // Callbacks
    onPlaybackStatusUpdate: PropTypes.func,
    onLoadStart: PropTypes.func,
    onLoad: PropTypes.func,
    onError: PropTypes.func,
    onIOSFullscreenUpdate: PropTypes.func,
    onFullscreenUpdate: PropTypes.func,
    onReadyForDisplay: PropTypes.func,

    // UI stuff
    useNativeControls: PropTypes.bool,
    resizeMode: PropTypes.string,
    usePoster: PropTypes.bool,

    // Playback API
    status: PropTypes.shape({
      progressUpdateIntervalMillis: PropTypes.number,
      positionMillis: PropTypes.number,
      shouldPlay: PropTypes.bool,
      rate: PropTypes.number,
      shouldCorrectPitch: PropTypes.bool,
      volume: PropTypes.number,
      isMuted: PropTypes.bool,
      isLooping: PropTypes.bool,
    }),
    progressUpdateIntervalMillis: PropTypes.number,
    positionMillis: PropTypes.number,
    shouldPlay: PropTypes.bool,
    rate: PropTypes.number,
    shouldCorrectPitch: PropTypes.bool,
    volume: PropTypes.number,
    isMuted: PropTypes.bool,
    isLooping: PropTypes.bool,

    // Required by react-native
    scaleX: PropTypes.number,
    scaleY: PropTypes.number,
    translateX: PropTypes.number,
    translateY: PropTypes.number,
    rotation: PropTypes.number,
    ...ViewPropTypes,
  };

  _nativeRef = React.createRef<InstanceType<ExponentVideo> & NativeComponent>();

  // componentOrHandle: null | number | React.Component<any, any> | React.ComponentClass<any>

  constructor(props: Props) {
    super(props);
    this.state = {
      showPoster: !!props.usePoster,
    };
  }

  setNativeProps(nativeProps: NativeProps) {
    const nativeVideo = nullthrows(this._nativeRef.current);
    nativeVideo.setNativeProps(nativeProps);
  }

  // Internal methods

  _handleNewStatus = (status: PlaybackStatus) => {
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
  };

  _performOperationAndHandleStatusAsync = async (
    operation: (tag: number) => Promise<PlaybackStatus>
  ): Promise<PlaybackStatus> => {
    const video = this._nativeRef.current;
    if (!video) {
      throw new Error(`Cannot complete operation because the Video component has not yet loaded`);
    }

    const handle = findNodeHandle(this._nativeRef.current)!;
    const status: PlaybackStatus = await operation(handle);
    this._handleNewStatus(status);
    return status;
  };

  // ### iOS Fullscreening API ###

  _setFullscreen = async (value: boolean) => {
    return this._performOperationAndHandleStatusAsync((tag: number) =>
      NativeModules.ExponentVideoManager.setFullscreen(tag, value)
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

  presentFullscreenPlayerAsync = () =>
    this._performOperationAndHandleStatusAsync((tag: number) =>
      NativeModules.ExponentAV.presentFullscreenPlayer(tag)
    );

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

  getStatusAsync = async (): Promise<PlaybackStatus> => {
    return this._performOperationAndHandleStatusAsync((tag: number) =>
      NativeModules.ExponentAV.getStatusForVideo(tag)
    );
  };

  // Loading / unloading API

  loadAsync = async (
    source: PlaybackSource,
    initialStatus: PlaybackStatusToSet = {},
    downloadFirst: boolean = true
  ): Promise<PlaybackStatus> => {
    const {
      nativeSource,
      fullInitialStatus,
    } = await getNativeSourceAndFullInitialStatusForLoadAsync(source, initialStatus, downloadFirst);
    return this._performOperationAndHandleStatusAsync((tag: number) =>
      NativeModules.ExponentAV.loadForVideo(tag, nativeSource, fullInitialStatus)
    );
  };

  // Equivalent to setting URI to null.
  unloadAsync = async (): Promise<PlaybackStatus> => {
    return this._performOperationAndHandleStatusAsync((tag: number) =>
      NativeModules.ExponentAV.unloadForVideo(tag)
    );
  };

  // Set status API (only available while isLoaded = true)

  setStatusAsync = async (status: PlaybackStatusToSet): Promise<PlaybackStatus> => {
    assertStatusValuesInBounds(status);
    return this._performOperationAndHandleStatusAsync((tag: number) =>
      NativeModules.ExponentAV.setStatusForVideo(tag, status)
    );
  };

  replayAsync = async (status: PlaybackStatusToSet = {}): Promise<PlaybackStatus> => {
    if (status.positionMillis && status.positionMillis !== 0) {
      throw new Error('Requested position after replay has to be 0.');
    }

    return this._performOperationAndHandleStatusAsync((tag: number) =>
      NativeModules.ExponentAV.replayVideo(tag, {
        ...status,
        positionMillis: 0,
        shouldPlay: true,
      })
    );
  };

  // Methods of the Playback interface that are set via PlaybackMixin
  playAsync!: () => Promise<PlaybackStatus>;
  playFromPositionAsync!: (
    positionMillis: number,
    tolerances?: { toleranceMillisBefore?: number; toleranceMillisAfter?: number }
  ) => Promise<PlaybackStatus>;
  pauseAsync!: () => Promise<PlaybackStatus>;
  stopAsync!: () => Promise<PlaybackStatus>;
  setPositionAsync!: (
    positionMillis: number,
    tolerances?: { toleranceMillisBefore?: number; toleranceMillisAfter?: number }
  ) => Promise<PlaybackStatus>;
  setRateAsync!: (rate: number, shouldCorrectPitch: boolean) => Promise<PlaybackStatus>;
  setVolumeAsync!: (volume: number) => Promise<PlaybackStatus>;
  setIsMutedAsync!: (isMuted: boolean) => Promise<PlaybackStatus>;
  setIsLoopingAsync!: (isLooping: boolean) => Promise<PlaybackStatus>;
  setProgressUpdateIntervalAsync!: (
    progressUpdateIntervalMillis: number
  ) => Promise<PlaybackStatus>;

  // ### Callback wrappers ###

  _nativeOnPlaybackStatusUpdate = (event: { nativeEvent: PlaybackStatus }) => {
    this._handleNewStatus(event.nativeEvent);
  };

  // TODO make sure we are passing the right stuff
  _nativeOnLoadStart = () => {
    if (this.props.onLoadStart) {
      this.props.onLoadStart();
    }
  };

  _nativeOnLoad = (event: { nativeEvent: PlaybackStatus }) => {
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

  _nativeOnReadyForDisplay = (event: { nativeEvent: ReadyForDisplayEvent }) => {
    if (this.props.onReadyForDisplay) {
      this.props.onReadyForDisplay(event.nativeEvent);
    }
  };

  _nativeOnFullscreenUpdate = (event: { nativeEvent: FullscreenUpdateEvent }) => {
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
      <Image style={_STYLES.poster} source={this.props.posterSource!} />
    ) : null;

  render() {
    const source = getNativeSourceFromSource(this.props.source);

    let nativeResizeMode = ExpoVideoManagerConstants.ScaleNone;
    if (this.props.resizeMode) {
      let resizeMode = this.props.resizeMode;
      if (resizeMode === ResizeMode.STRETCH) {
        nativeResizeMode = ExpoVideoManagerConstants.ScaleToFill;
      } else if (resizeMode === ResizeMode.CONTAIN) {
        nativeResizeMode = ExpoVideoManagerConstants.ScaleAspectFit;
      } else if (resizeMode === ResizeMode.COVER) {
        nativeResizeMode = ExpoVideoManagerConstants.ScaleAspectFill;
      }
    }

    // Set status via individual props
    const status: PlaybackStatusToSet = { ...this.props.status };
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
    const nativeProps: NativeProps = {
      style: _STYLES.base,
      ...omit(this.props, 'source'),
      source,
      nativeResizeMode,
      status,
      onStatusUpdateNative: this._nativeOnPlaybackStatusUpdate,
      onLoadStartNative: this._nativeOnLoadStart,
      onLoadNative: this._nativeOnLoad,
      onErrorNative: this._nativeOnError,
      onReadyForDisplayNative: this._nativeOnReadyForDisplay,
      onFullscreenUpdateNative: this._nativeOnFullscreenUpdate,
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

type ExponentVideo = React.ComponentClass<NativeProps>;
const ExponentVideo = requireNativeComponent('ExponentVideo', Video, {
  nativeOnly: {
    source: true,
    nativeResizeMode: true,
    onStatusUpdateNative: true,
    onLoadStartNative: true,
    onLoadNative: true,
    onErrorNative: true,
    onReadyForDisplayNative: true,
    onFullscreenUpdateNative: true,
  },
});
