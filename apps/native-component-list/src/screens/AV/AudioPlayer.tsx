import { diff } from 'deep-object-diff';
import { Asset } from 'expo-asset';
import { Audio, AVMetadata, AVPlaybackStatus } from 'expo-av';
import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';

import { JsiAudioBar } from './JsiAudioBar';
import Player from './Player';

type PlaybackSource =
  | number
  | {
      uri: string;
      overrideFileExtensionAndroid?: string;
      headers?: {
        [fieldName: string]: string;
      };
    }
  | Asset;

interface Props {
  style?: StyleProp<ViewStyle>;
  source: PlaybackSource;
}

interface State {
  isLoaded: boolean;
  isLooping: boolean;
  isPlaying: boolean;
  errorMessage?: string;
  positionMillis: number;
  durationMillis: number;
  rate: number;
  volume: number;
  isMuted: boolean;
  shouldCorrectPitch: boolean;
  metadata: AVMetadata;
}

export default class AudioPlayer extends React.Component<Props, State> {
  readonly state: State = {
    isMuted: false,
    isLoaded: false,
    isLooping: false,
    isPlaying: false,
    positionMillis: 0,
    durationMillis: 0,
    rate: 1,
    volume: 1,
    shouldCorrectPitch: false,
    metadata: {},
  };

  _sound?: Audio.Sound;
  private prevStatus?: AVPlaybackStatus;

  componentDidMount() {
    this._loadSoundAsync(this.props.source);
  }

  componentDidUpdate(prevProps: Props) {
    if (prevProps.source !== this.props.source) {
      this._loadSoundAsync(this.props.source);
    }
  }

  componentWillUnmount() {
    if (this._sound) {
      this._clearJsiAudioSampleCallback();
      this._sound.unloadAsync();
    }
  }

  _loadSoundAsync = async (source: PlaybackSource) => {
    const soundObject = new Audio.Sound();
    try {
      await soundObject.loadAsync(source, { progressUpdateIntervalMillis: 150 });
      soundObject.setOnPlaybackStatusUpdate(this._updateStateToStatus);
      soundObject.setOnMetadataUpdate(this._updateMetadata);
      const status = await soundObject.getStatusAsync();
      this._updateStateToStatus(status);
      this._sound = soundObject;
    } catch (error) {
      this.setState({ errorMessage: error.message });
    }
  };

  _updateStateToStatus = (status: any) => {
    console.log('onPlaybackStatusUpdate: ', diff(this.prevStatus || {}, status));
    this.prevStatus = status;
    this.setState(status);
  };

  _updateMetadata = (metadata: AVMetadata) => {
    this.setState({ metadata });
  };

  _playAsync = async () => {
    this._sound!.playAsync();
  };

  _pauseAsync = async () => {
    this._clearJsiAudioSampleCallback();
    this._sound!.pauseAsync();
  };

  _replayAsync = async () => this._sound!.replayAsync();

  _setPositionAsync = async (position: number) => this._sound!.setPositionAsync(position);

  _setIsLoopingAsync = async (isLooping: boolean) => this._sound!.setIsLoopingAsync(isLooping);

  _setIsMutedAsync = async (isMuted: boolean) => this._sound!.setIsMutedAsync(isMuted);

  _setVolumeAsync = async (volume: number) => this._sound!.setVolumeAsync(volume);

  _setRateAsync = async (
    rate: number,
    shouldCorrectPitch: boolean,
    pitchCorrectionQuality = Audio.PitchCorrectionQuality.Low
  ) => {
    await this._sound!.setRateAsync(rate, shouldCorrectPitch, pitchCorrectionQuality);
  };

  _clearJsiAudioSampleCallback = () => {
    // it throws UnavailabilityError when platform is not supported
    // ignore this, we set it here to null anyway
    try {
      this._sound?.setOnAudioSampleReceived(null);
    } catch {}
  };

  render() {
    return (
      <Player
        {...this.state}
        style={this.props.style}
        playAsync={this._playAsync}
        pauseAsync={this._pauseAsync}
        replayAsync={this._replayAsync}
        setPositionAsync={this._setPositionAsync}
        setIsLoopingAsync={this._setIsLoopingAsync}
        setRateAsync={this._setRateAsync}
        setIsMutedAsync={this._setIsMutedAsync}
        setVolume={this._setVolumeAsync}
        extraIndicator={<JsiAudioBar isPlaying={this.state.isPlaying} sound={this._sound!} />}
      />
    );
  }
}
