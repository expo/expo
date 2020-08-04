import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  GestureResponderEvent,
  Platform,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';

import Colors from '../../constants/Colors';
import Slider from '@react-native-community/slider';

interface Props {
  header?: JSX.Element;
  extraButtons?: Array<{
    iconName: string;
    title: string;
    onPress: (event: GestureResponderEvent) => void;
    active: boolean;
    disable?: boolean;
  }>;
  style?: StyleProp<ViewStyle>;

  // Functions
  playAsync: () => void;
  pauseAsync: () => void;
  replayAsync: () => void;
  setRateAsync: (rate: number, shouldCorrectPitch: boolean) => void;
  setIsMutedAsync: (isMuted: boolean) => void;
  setPositionAsync: (position: number) => Promise<any>;
  setIsLoopingAsync: (isLooping: boolean) => void;

  // Status
  isLoaded: boolean;
  isLooping: boolean;
  rate: number;
  positionMillis: number;
  durationMillis: number;
  shouldCorrectPitch: boolean;
  isPlaying: boolean;
  isMuted?: boolean;

  // Error
  errorMessage?: string;
}

interface State {
  userIsDraggingSlider: boolean;
  positionMillisWhenStartedDragging?: number;
}

export default class Player extends React.Component<Props, State> {
  readonly state: State = {
    userIsDraggingSlider: false,
  };

  _play = () => this.props.playAsync();

  _pause = () => this.props.pauseAsync();

  _playFromPosition = (position: number) =>
    this.props
      .setPositionAsync(position)
      .then(() => this.setState({ userIsDraggingSlider: false }));

  _toggleLooping = () => this.props.setIsLoopingAsync(!this.props.isLooping);

  _toggleIsMuted = () => this.props.setIsMutedAsync(!this.props.isMuted);

  _toggleSlowRate = () =>
    this.props.setRateAsync(this.props.rate < 1 ? 1 : 0.5, this.props.shouldCorrectPitch);

  _toggleFastRate = () =>
    this.props.setRateAsync(this.props.rate > 1 ? 1 : 2, this.props.shouldCorrectPitch);

  _toggleShouldCorrectPitch = () =>
    this.props.setRateAsync(this.props.rate, !this.props.shouldCorrectPitch);

  _renderPlayPauseButton = () => {
    let onPress = this._pause;
    let iconName = 'ios-pause';

    if (!this.props.isPlaying) {
      onPress = this._play;
      iconName = 'ios-play';
    }

    return (
      <TouchableOpacity onPress={onPress} disabled={!this.props.isLoaded}>
        <Ionicons name={iconName} style={[styles.icon, styles.playPauseIcon]} />
      </TouchableOpacity>
    );
  };

  _maybeRenderErrorOverlay = () => {
    if (this.props.errorMessage) {
      return (
        <ScrollView style={styles.errorMessage}>
          <Text style={styles.errorText}>{this.props.errorMessage}</Text>
        </ScrollView>
      );
    }
    return null;
  };

  _renderAuxiliaryButton = ({
    disable,
    iconName,
    title,
    onPress,
    active,
  }: {
    disable?: boolean;
    iconName: string;
    title: string;
    onPress: (event: GestureResponderEvent) => void;
    active?: boolean;
  }) => {
    if (disable) {
      return null;
    }
    return (
      <TouchableOpacity
        key={title}
        style={[styles.button, active && styles.activeButton]}
        disabled={!this.props.isLoaded}
        onPress={onPress}>
        <Ionicons
          name={`ios-${iconName}`}
          style={[styles.icon, styles.buttonIcon, active && styles.activeButtonText]}
        />
        <Text style={[styles.buttonText, active && styles.activeButtonText]}>{title}</Text>
      </TouchableOpacity>
    );
  };

  render() {
    return (
      <View style={this.props.style}>
        {this.props.header}
        <View style={styles.container}>
          {this._renderPlayPauseButton()}
          <Slider
            style={styles.slider}
            value={
              this.state.userIsDraggingSlider
                ? this.state.positionMillisWhenStartedDragging
                : this.props.positionMillis
            }
            maximumValue={this.props.durationMillis}
            disabled={!this.props.isLoaded}
            minimumTrackTintColor={Colors.tintColor}
            onSlidingComplete={this._playFromPosition}
            onResponderGrant={() =>
              this.setState({
                userIsDraggingSlider: true,
                positionMillisWhenStartedDragging: this.props.positionMillis,
              })
            }
          />
          <Text style={{ width: 100, textAlign: 'right' }} adjustsFontSizeToFit numberOfLines={1}>
            {_formatTime(this.props.positionMillis / 1000)} /{' '}
            {_formatTime(this.props.durationMillis / 1000)}
          </Text>
        </View>
        <View style={[styles.container, styles.buttonsContainer]}>
          {this._renderAuxiliaryButton({
            iconName: 'repeat',
            title: 'Repeat',
            onPress: this._toggleLooping,
            active: this.props.isLooping,
          })}
          {this._renderAuxiliaryButton({
            iconName: 'hourglass',
            title: 'Slower',
            onPress: this._toggleSlowRate,
            active: this.props.rate < 1,
          })}
          {this._renderAuxiliaryButton({
            iconName: 'speedometer',
            title: 'Faster',
            onPress: this._toggleFastRate,
            active: this.props.rate > 1,
          })}
          {this._renderAuxiliaryButton({
            disable: Platform.OS === 'web',
            iconName: 'stats',
            title: 'Correct pitch',
            onPress: this._toggleShouldCorrectPitch,
            active: this.props.shouldCorrectPitch,
          })}
          {this._renderAuxiliaryButton({
            iconName: 'volume-off',
            title: 'Mute',
            onPress: this._toggleIsMuted,
            active: this.props.isMuted,
          })}
          {this._renderAuxiliaryButton({
            iconName: 'refresh',
            title: 'Replay',
            onPress: this.props.replayAsync,
            active: false,
          })}
        </View>
        <View style={[styles.container, styles.buttonsContainer]}>
          {this.props.extraButtons
            ? this.props.extraButtons.map(this._renderAuxiliaryButton)
            : null}
        </View>
        {this._maybeRenderErrorOverlay()}
      </View>
    );
  }
}

const _formatTime = (duration: number) => {
  const paddedSecs = _leftPad(`${Math.floor(duration % 60)}`, '0', 2);
  const paddedMins = _leftPad(`${Math.floor(duration / 60)}`, '0', 2);
  if (duration > 3600) {
    return `${Math.floor(duration / 3600)}:${paddedMins}:${paddedSecs}`;
  }
  return `${paddedMins}:${paddedSecs}`;
};

const _leftPad = (s: string, padWith: string, expectedMinimumSize: number): string => {
  if (s.length >= expectedMinimumSize) {
    return s;
  }
  return _leftPad(`${padWith}${s}`, padWith, expectedMinimumSize);
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    padding: 8,
    fontSize: 24,
    color: Colors.tintColor,
  },
  playPauseIcon: {
    paddingTop: 11,
    fontSize: 34,
  },
  slider: {
    flex: 1,
    marginHorizontal: 10,
  },
  errorMessage: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.errorBackground,
  },
  errorText: {
    margin: 8,
    fontWeight: 'bold',
    color: Colors.errorText,
  },
  buttonsContainer: {
    justifyContent: 'space-evenly',
    alignItems: 'stretch',
  },
  button: {
    flex: 1,
    marginHorizontal: 10,
    paddingBottom: 6,
    borderRadius: 6,
    marginBottom: 10,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  buttonText: {
    fontSize: 12,
    color: Colors.tintColor,
    fontWeight: 'bold',
    textAlign: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  buttonIcon: {
    flex: 1,
    height: 36,
  },
  activeButton: {
    backgroundColor: Colors.tintColor,
  },
  activeButtonText: {
    color: 'white',
  },
});
