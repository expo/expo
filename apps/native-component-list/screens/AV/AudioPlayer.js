import React from 'react';
import { Audio } from 'expo';

import Player from './Player';

export default class AudioPlayer extends React.Component {
  state = {
    isLoaded: false,
    isLooping: false,
    isPlaying: false,
    errorMessage: null,
    positionMillis: 0,
    durationMillis: 0,
    rate: 1,
    shouldCorrectPitch: false,
    pitchCorrectionQuality: Audio.PitchCorrectionQuality.Low,
  };

  componentDidMount() {
    this._loadSoundAsync(this.props.source);
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.source !== this.props.source) {
      this._loadSoundAsync(nextProps.source);
    }
  }

  _loadSoundAsync = async source => {
    const soundObject = new Audio.Sound();
    try {
      await soundObject.loadAsync(source, { progressUpdateIntervalMillis: 100 });
      soundObject.setOnPlaybackStatusUpdate(this._updateStateToStatus);
      const status = await soundObject.getStatusAsync();
      this._updateStateToStatus(status);
      this._sound = soundObject;
    } catch (error) {
      this.setState({ errorMessage: error.message });
    }
  };

  _updateStateToStatus = status => this.setState(status);

  _playAsync = async () => await this._sound.playAsync();

  _pauseAsync = async () => await this._sound.pauseAsync();

  _setPositionAsync = async position => await this._sound.setPositionAsync(position);

  _setIsLoopingAsync = async isLooping => await this._sound.setIsLoopingAsync(isLooping);

  _setIsMutedAsync = async isMuted => await this._sound.setIsMutedAsync(isMuted);

  _setRateAsync = async (
    rate,
    shouldCorrectPitch,
    pitchCorrectionQuality = Audio.PitchCorrectionQuality.Low
  ) => {
    await this._sound.setRateAsync(rate, shouldCorrectPitch, pitchCorrectionQuality);
  };

  render() {
    return (
      <Player
        {...this.state}
        playAsync={this._playAsync}
        pauseAsync={this._pauseAsync}
        setPositionAsync={this._setPositionAsync}
        setIsLoopingAsync={this._setIsLoopingAsync}
        setRateAsync={this._setRateAsync}
        setIsMutedAsync={this._setIsMutedAsync}
      />
    );
  }
}
