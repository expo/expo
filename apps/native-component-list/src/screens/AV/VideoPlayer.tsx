import { Asset } from 'expo-asset';
import { Video } from 'expo-av';
import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';

import Player from './Player';

interface State {
  isLoaded: boolean;
  isLooping: boolean;
  isPlaying: boolean;
  errorMessage?: string;
  positionMillis: number;
  durationMillis: number;
  rate: number;
  shouldCorrectPitch: boolean;
  useNativeControls: boolean;
  resizeMode: any;
}

export default class VideoPlayer extends React.Component<
  {
    style?: StyleProp<ViewStyle>;
    source?:
      | number
      | {
          uri: string;
          overrideFileExtensionAndroid?: string;
          headers?: {
            [fieldName: string]: string;
          };
        }
      | Asset;
  },
  State
> {
  readonly state: State = {
    isLoaded: false,
    isLooping: false,
    isPlaying: false,
    positionMillis: 0,
    durationMillis: 0,
    rate: 1,
    shouldCorrectPitch: false,
    useNativeControls: false,
    resizeMode: Video.RESIZE_MODE_CONTAIN,
  };

  _video?: Video;

  _handleError = (errorMessage: string) => this.setState({ errorMessage });

  _handleVideoMount = (ref: Video) => (this._video = ref);

  _updateStateToStatus = (status: any) => this.setState(status);

  _playAsync = async () => this._video!.playAsync();

  _pauseAsync = async () => this._video!.pauseAsync();

  _setPositionAsync = async (position: number) => this._video!.setPositionAsync(position);

  _setIsLoopingAsync = async (isLooping: boolean) => this._video!.setIsLoopingAsync(isLooping);

  _setIsMutedAsync = async (isMuted: boolean) => this._video!.setIsMutedAsync(isMuted);

  _setRateAsync = async (rate: number, shouldCorrectPitch: boolean) =>
    this._video!.setRateAsync(rate, shouldCorrectPitch);

  _toggleNativeControls = () =>
    this.setState(({ useNativeControls }) => ({ useNativeControls: !useNativeControls }));

  _resizeModeSetter = (resizeMode: any) => () => this.setState({ resizeMode });

  _openFullscreen = () => this._video!.presentFullscreenPlayer();

  _renderVideo = () => (
    <Video
      useNativeControls={this.state.useNativeControls}
      ref={this._handleVideoMount}
      source={this.props.source}
      resizeMode={this.state.resizeMode}
      onError={this._handleError}
      style={{ height: 300 }}
      progressUpdateIntervalMillis={100}
      onPlaybackStatusUpdate={this._updateStateToStatus}
    />
  );

  render() {
    return (
      <Player
        style={this.props.style}
        {...this.state}
        playAsync={this._playAsync}
        pauseAsync={this._pauseAsync}
        setPositionAsync={this._setPositionAsync}
        setIsLoopingAsync={this._setIsLoopingAsync}
        setIsMutedAsync={this._setIsMutedAsync}
        setRateAsync={this._setRateAsync}
        extraButtons={[
          {
            iconName: 'options',
            title: 'Native controls',
            onPress: this._toggleNativeControls,
            active: this.state.useNativeControls,
          },
          {
            iconName: 'move',
            title: 'Resize mode – stretch',
            onPress: this._resizeModeSetter(Video.RESIZE_MODE_STRETCH),
            active: this.state.resizeMode === Video.RESIZE_MODE_STRETCH,
          },
          {
            iconName: 'log-in',
            title: 'Resize mode – contain',
            onPress: this._resizeModeSetter(Video.RESIZE_MODE_CONTAIN),
            active: this.state.resizeMode === Video.RESIZE_MODE_CONTAIN,
          },
          {
            iconName: 'qr-scanner',
            title: 'Resize mode – cover',
            onPress: this._resizeModeSetter(Video.RESIZE_MODE_COVER),
            active: this.state.resizeMode === Video.RESIZE_MODE_COVER,
          },
          {
            iconName: 'resize',
            title: 'Open fullscreen',
            onPress: this._openFullscreen,
            active: false,
          },
        ]}
        header={this._renderVideo()}
      />
    );
  }
}
