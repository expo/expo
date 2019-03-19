import React from 'react';
import { Video, Asset } from 'expo';

import Player from './Player';
import { StyleProp, ViewStyle } from 'react-native';

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
  resizeMode: Video.ResizeMode;
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
    resizeMode: Video.ResizeMode.CONTAIN,
  };

  _video?: Video.VideoPlayback;

  _handleError = (errorMessage: string) => this.setState({ errorMessage });

  _handleVideoMount = (ref: Video.VideoPlayback) => (this._video = ref);

  _updateStateToStatus = (status: any) => this.setState(status);

  _playAsync = async () => await this._video!.playAsync();

  _pauseAsync = async () => await this._video!.pauseAsync();

  _setPositionAsync = async (position: number) => await this._video!.setPositionAsync(position);

  _setIsLoopingAsync = async (isLooping: boolean) => await this._video!.setIsLoopingAsync(isLooping);

  _setIsMutedAsync = async (isMuted: boolean) => await this._video!.setIsMutedAsync(isMuted);

  _setRateAsync = async (rate: number, shouldCorrectPitch: boolean) =>
    await this._video!.setRateAsync(rate, shouldCorrectPitch);

  _toggleNativeControls = () =>
    this.setState(({ useNativeControls }) => ({ useNativeControls: !useNativeControls }));

  _resizeModeSetter = (resizeMode: Video.ResizeMode) => () => this.setState({ resizeMode });

  _openFullscreen = () => this._video!.presentFullscreenPlayer();

  _renderVideo = () => (
    <Video.VideoPlayback
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
            onPress: this._resizeModeSetter(Video.ResizeMode.STRETCH),
            active: this.state.resizeMode === Video.ResizeMode.STRETCH,
          },
          {
            iconName: 'log-in',
            title: 'Resize mode – contain',
            onPress: this._resizeModeSetter(Video.ResizeMode.CONTAIN),
            active: this.state.resizeMode === Video.ResizeMode.CONTAIN,
          },
          {
            iconName: 'qr-scanner',
            title: 'Resize mode – cover',
            onPress: this._resizeModeSetter(Video.ResizeMode.COVER),
            active: this.state.resizeMode === Video.ResizeMode.COVER,
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
