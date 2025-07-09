import * as React from 'react';
import { findNodeHandle, Image, NativeMethods, StyleSheet, View, Platform } from 'react-native';

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
  AVPlaybackTolerance,
  PitchCorrectionQuality,
} from './AV';
import ExpoVideoManager from './ExpoVideoManager';
import ExponentAV from './ExponentAV';
import ExponentVideo from './ExponentVideo';
import {
  ExponentVideoComponent,
  VideoFullscreenUpdateEvent,
  VideoNativeProps,
  VideoProps,
  VideoReadyForDisplayEvent,
  ResizeMode,
  VideoState,
} from './Video.types';

const _STYLES = StyleSheet.create({
  base: {
    overflow: 'hidden',
    pointerEvents: 'box-none',
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

let didWarnAboutVideoDeprecation: boolean = false;

// On a real device UIManager should be present, however when running offline tests with jest-expo
// we have to use the provided native module mock to access constants
const ExpoVideoManagerConstants = ExpoVideoManager;
const ExpoVideoViewManager = ExpoVideoManager;

class Video extends React.Component<VideoProps, VideoState> implements Playback {
  _nativeRef = React.createRef<InstanceType<ExponentVideoComponent> & NativeMethods>();
  _onPlaybackStatusUpdate: ((status: AVPlaybackStatus) => void) | null = null;

  constructor(props: VideoProps) {
    super(props);
    this.state = {
      showPoster: !!props.usePoster,
    };
  }

  /**
   * @hidden
   */
  setNativeProps(nativeProps: VideoNativeProps) {
    const nativeVideo = this._nativeRef.current;
    if (!nativeVideo) throw new Error(`native video reference is not defined.`);
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

    let handle = null;
    if (Platform.OS === 'web' && 'getVideoElement' in this._nativeRef.current!) {
      handle = (this._nativeRef.current as any).getVideoElement() as HTMLMediaElement;
    }
    if (Platform.OS !== 'web') {
      handle = findNodeHandle(this._nativeRef.current)!;
    }
    if (!handle) {
      throw new Error('failed to find node handle');
    }

    const status: AVPlaybackStatus = await operation(handle! as number);
    this._handleNewStatus(status);
    return status;
  };

  // Fullscreening API

  _setFullscreen = async (value: boolean): Promise<AVPlaybackStatus> => {
    return this._performOperationAndHandleStatusAsync((tag: number) =>
      ExpoVideoViewManager.setFullscreen(tag, value)
    );
  };

  /**
   * This presents a fullscreen view of your video component on top of your app's UI. Note that even if `useNativeControls` is set to `false`,
   * native controls will be visible in fullscreen mode.
   * @return A `Promise` that is fulfilled with the `AVPlaybackStatus` of the video once the fullscreen player has finished presenting,
   * or rejects if there was an error, or if this was called on an Android device.
   */
  presentFullscreenPlayer = async (): Promise<AVPlaybackStatus> => {
    return this._setFullscreen(true);
  };

  /**
   * This dismisses the fullscreen video view.
   * @return A `Promise` that is fulfilled with the `AVPlaybackStatus` of the video once the fullscreen player has finished dismissing,
   * or rejects if there was an error, or if this was called on an Android device.
   */
  dismissFullscreenPlayer = async (): Promise<AVPlaybackStatus> => {
    return this._setFullscreen(false);
  };

  // ### Unified playback API ### (consistent with Audio.js)
  // All calls automatically call onPlaybackStatusUpdate as a side effect.

  /**
   * @hidden
   */
  getStatusAsync = async (): Promise<AVPlaybackStatus> => {
    return this._performOperationAndHandleStatusAsync((tag: number) =>
      ExponentAV.getStatusForVideo(tag)
    );
  };

  /**
   * @hidden
   */
  loadAsync = async (
    source: AVPlaybackSource,
    initialStatus: AVPlaybackStatusToSet = {},
    downloadFirst: boolean = true
  ): Promise<AVPlaybackStatus> => {
    const { nativeSource, fullInitialStatus } =
      await getNativeSourceAndFullInitialStatusForLoadAsync(source, initialStatus, downloadFirst);
    return this._performOperationAndHandleStatusAsync((tag: number) =>
      ExponentAV.loadForVideo(tag, nativeSource, fullInitialStatus)
    );
  };

  /**
   * Equivalent to setting URI to `null`.
   * @hidden
   */
  unloadAsync = async (): Promise<AVPlaybackStatus> => {
    return this._performOperationAndHandleStatusAsync((tag: number) =>
      ExponentAV.unloadForVideo(tag)
    );
  };

  componentWillUnmount() {
    // Auto unload video to perform necessary cleanup safely
    this.unloadAsync().catch(() => {
      // Ignored rejection. Sometimes the unloadAsync code is executed when video is already unloaded.
      // In such cases, it throws:
      // "[Unhandled promise rejection: Error: Invalid view returned from registry,
      //  expecting EXVideo, got: (null)]"
    });
  }

  /**
   * Set status API, only available while `isLoaded = true`.
   * @hidden
   */
  setStatusAsync = async (status: AVPlaybackStatusToSet): Promise<AVPlaybackStatus> => {
    assertStatusValuesInBounds(status);
    return this._performOperationAndHandleStatusAsync((tag: number) =>
      ExponentAV.setStatusForVideo(tag, status)
    );
  };

  /**
   * @hidden
   */
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

  /**
   * Sets a function to be called regularly with the `AVPlaybackStatus` of the playback object.
   *
   * `onPlaybackStatusUpdate` will be called whenever a call to the API for this playback object completes
   * (such as `setStatusAsync()`, `getStatusAsync()`, or `unloadAsync()`), nd will also be called at regular intervals
   * while the media is in the loaded state.
   *
   * Set `progressUpdateIntervalMillis` via `setStatusAsync()` or `setProgressUpdateIntervalAsync()` to modify
   * the interval with which `onPlaybackStatusUpdate` is called while loaded.
   *
   * @param onPlaybackStatusUpdate A function taking a single parameter `AVPlaybackStatus`.
   */
  setOnPlaybackStatusUpdate(onPlaybackStatusUpdate: ((status: AVPlaybackStatus) => void) | null) {
    this._onPlaybackStatusUpdate = onPlaybackStatusUpdate;
    this.getStatusAsync();
  }

  // Methods of the Playback interface that are set via PlaybackMixin
  playAsync!: () => Promise<AVPlaybackStatus>;
  playFromPositionAsync!: (
    positionMillis: number,
    tolerances?: AVPlaybackTolerance
  ) => Promise<AVPlaybackStatus>;
  pauseAsync!: () => Promise<AVPlaybackStatus>;
  stopAsync!: () => Promise<AVPlaybackStatus>;
  setPositionAsync!: (
    positionMillis: number,
    tolerances?: AVPlaybackTolerance
  ) => Promise<AVPlaybackStatus>;
  setRateAsync!: (
    rate: number,
    shouldCorrectPitch: boolean,
    pitchCorrectionQuality?: PitchCorrectionQuality
  ) => Promise<AVPlaybackStatus>;
  setVolumeAsync!: (volume: number, audioPan?: number) => Promise<AVPlaybackStatus>;
  setIsMutedAsync!: (isMuted: boolean) => Promise<AVPlaybackStatus>;
  setIsLoopingAsync!: (isLooping: boolean) => Promise<AVPlaybackStatus>;
  setProgressUpdateIntervalAsync!: (
    progressUpdateIntervalMillis: number
  ) => Promise<AVPlaybackStatus>;

  // Callback wrappers

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
    if (this.props.onFullscreenUpdate) {
      this.props.onFullscreenUpdate(event.nativeEvent);
    }
  };

  _renderPoster = () => {
    const PosterComponent = this.props.PosterComponent ?? Image;

    return this.props.usePoster && this.state.showPoster ? (
      <PosterComponent
        style={[_STYLES.poster, this.props.posterStyle]}
        source={this.props.posterSource!}
      />
    ) : null;
  };

  render() {
    maybeWarnAboutVideoDeprecation();

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
    (
      [
        'progressUpdateIntervalMillis',
        'positionMillis',
        'shouldPlay',
        'rate',
        'shouldCorrectPitch',
        'volume',
        'isMuted',
        'isLooping',
      ] as const
    ).forEach((prop) => {
      if (prop in this.props) {
        status[prop] = this.props[prop] as any;
      }
    });

    // Replace selected native props
    const nativeProps: VideoNativeProps = {
      ...omit(this.props, [
        'source',
        'onPlaybackStatusUpdate',
        'usePoster',
        'posterSource',
        'posterStyle',
        ...Object.keys(status),
      ]),
      style: [_STYLES.base, this.props.style],
      videoStyle: [_STYLES.video, this.props.videoStyle],
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
      <View style={nativeProps.style}>
        <ExponentVideo ref={this._nativeRef} {...nativeProps} style={nativeProps.videoStyle} />
        {this._renderPoster()}
      </View>
    );
  }
}

function omit(props: Record<string, any>, propNames: string[]) {
  const copied = { ...props };
  for (const propName of propNames) {
    delete copied[propName];
  }
  return copied;
}

function maybeWarnAboutVideoDeprecation() {
  if (__DEV__ && !didWarnAboutVideoDeprecation) {
    didWarnAboutVideoDeprecation = true;
    console.log(
      '⚠️ \x1b[33m[expo-av]: Video component from `expo-av` is deprecated in favor of `expo-video`. ' +
        'See the documentation at https://docs.expo.dev/versions/latest/sdk/video/ for the new API reference.'
    );
  }
}

Object.assign(Video.prototype, PlaybackMixin);

// note(simek): TypeDoc cannot resolve correctly name of inline and default exported class
export default Video;
