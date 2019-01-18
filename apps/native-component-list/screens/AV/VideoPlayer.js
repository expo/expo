import React from 'react';
import { Video } from 'expo';

import Player from './Player';

export default class VideoPlayer extends React.Component {
  state = {
    isLoaded: false,
    isLooping: false,
    isPlaying: false,
    errorMessage: null,
    positionMillis: 0,
    durationMillis: 0,
    rate: 1,
    shouldCorrectPitch: false,
    useNativeControls: false,
    resizeMode: Video.RESIZE_MODE_CONTAIN,
  };

  _handleError = errorMessage => this.setState({ errorMessage });

  _handleVideoMount = ref => (this._video = ref);

  _updateStateToStatus = status => this.setState(status);

  _playAsync = async () => await this._video.playAsync();

  _pauseAsync = async () => await this._video.pauseAsync();

  _setPositionAsync = async position => await this._video.setPositionAsync(position);

  _setIsLoopingAsync = async isLooping => await this._video.setIsLoopingAsync(isLooping);

  _setIsMutedAsync = async isMuted => await this._video.setIsMutedAsync(isMuted);

  _setRateAsync = async (rate, shouldCorrectPitch) =>
    await this._video.setRateAsync(rate, shouldCorrectPitch);

  _toggleNativeControls = () =>
    this.setState(({ useNativeControls }) => ({ useNativeControls: !useNativeControls }));

  _resizeModeSetter = resizeMode => () => this.setState({ resizeMode });

  _openFullscreen = () => this._video.presentFullscreenPlayer();

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
