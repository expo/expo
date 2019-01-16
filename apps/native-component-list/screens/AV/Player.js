import React from 'react';
import { ScrollView, Slider, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Audio } from 'expo';
import { Ionicons } from '@expo/vector-icons';

import Colors from '../../constants/Colors';

export default class Player extends React.Component {
  state = {
    userIsDraggingSlider: false,
    isLoaded: false,
    isLooping: false,
    errorMessage: null,
    positionMillis: 0,
    durationMillis: 0,
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

  _play = () => this._sound.playAsync();

  _pause = () => this._sound.pauseAsync();

  _playFromPosition = position =>
    this._sound
      .setPositionAsync(position)
      .then(() => this.setState({ userIsDraggingSlider: false }));

  _toggleLooping = () => this._sound.setIsLoopingAsync(!this.state.isLooping);

  _toggleSlowRate = () =>
    this._sound.setRateAsync(this.state.rate < 1 ? 1 : 0.5, this.state.shouldCorrectPitch);

  _toggleFastRate = () =>
    this._sound.setRateAsync(this.state.rate > 1 ? 1 : 2, this.state.shouldCorrectPitch);

  _toggleShouldCorrectPitch = () =>
    this._sound.setRateAsync(this.state.rate, !this.state.shouldCorrectPitch);

  _renderPlayPauseButton = () => {
    let onPress = this._pause;
    let iconName = 'ios-pause';

    if (!this.state.isPlaying) {
      onPress = this._play;
      iconName = 'ios-play';
    }

    return (
      <TouchableOpacity onPress={onPress} disabled={!this.state.isLoaded}>
        <Ionicons name={iconName} style={[styles.icon, styles.playPauseIcon]} />
      </TouchableOpacity>
    );
  };

  _maybeRenderErrorOverlay = () => {
    if (this.state.errorMessage) {
      return (
        <ScrollView style={styles.errorMessage}>
          <Text style={styles.errorText}>{this.state.errorMessage}</Text>
        </ScrollView>
      );
    }
    return null;
  };

  _renderAuxiliaryButton = ({ iconName, title, onPress, active }) => (
    <TouchableOpacity
      style={[styles.button, active && styles.activeButton]}
      disabled={!this.state.isLoaded}
      onPress={onPress}>
      <Ionicons
        name={`ios-${iconName}`}
        style={[styles.icon, styles.buttonIcon, active && styles.activeButtonText]}
      />
      <Text style={[styles.buttonText, active && styles.activeButtonText]}>{title}</Text>
    </TouchableOpacity>
  );

  render() {
    return (
      <View style={this.props.style}>
        <View style={styles.container}>
          {this._renderPlayPauseButton()}
          <Slider
            style={styles.slider}
            value={
              this.state.userIsDraggingSlider
                ? this.state.positionMillisWhenStartedDragging
                : this.state.positionMillis
            }
            maximumValue={this.state.durationMillis}
            disabled={!this.state.isLoaded}
            minimumTrackTintColor={Colors.tintColor}
            onSlidingComplete={this._playFromPosition}
            onResponderGrant={() =>
              this.setState({
                userIsDraggingSlider: true,
                positionMillisWhenStartedDragging: this.state.positionMillis,
              })
            }
          />
          <Text style={{ width: 80, textAlign: 'right' }} adjustsFontSizeToFit numberOfLines={1}>
            {_formatTime(this.state.positionMillis / 1000)} /{' '}
            {_formatTime(this.state.durationMillis / 1000)}
          </Text>
        </View>
        <View style={[styles.container, { justifyContent: 'space-evenly', alignItems: 'stretch' }]}>
          {this._renderAuxiliaryButton({
            iconName: 'repeat',
            title: 'Repeat',
            onPress: this._toggleLooping,
            active: this.state.isLooping,
          })}
          {this._renderAuxiliaryButton({
            iconName: 'hourglass',
            title: 'Slower',
            onPress: this._toggleSlowRate,
            active: this.state.rate < 1,
          })}
          {this._renderAuxiliaryButton({
            iconName: 'speedometer',
            title: 'Faster',
            onPress: this._toggleFastRate,
            active: this.state.rate > 1,
          })}
          {this._renderAuxiliaryButton({
            iconName: 'stats',
            title: 'Correct pitch',
            onPress: this._toggleShouldCorrectPitch,
            active: this.state.shouldCorrectPitch,
          })}
        </View>
        {this._maybeRenderErrorOverlay()}
      </View>
    );
  }
}

const _formatTime = duration => {
  const paddedSecs = _leftPad(`${Math.floor(duration % 60)}`, '0', 2);
  const paddedMins = _leftPad(`${Math.floor(duration / 60)}`, '0', 2);
  if (duration > 3600) {
    return `${Math.floor(duration / 3600)}:${paddedMins}:${paddedSecs}`;
  }
  return `${paddedMins}:${paddedSecs}`;
};

const _leftPad = (string, padWith, expectedMinimumSize) => {
  if (string.length >= expectedMinimumSize) {
    return string;
  }
  return _leftPad(`${padWith}${string}`, padWith, expectedMinimumSize);
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
