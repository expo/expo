import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
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

interface Props {
  header?: JSX.Element;
  extraButtons?: Array<
    () =>
      | React.ReactNode
      | {
          iconName: string;
          title: string;
          onPress: (event: GestureResponderEvent) => void;
          active: boolean;
          disable?: boolean;
        }
  >;
  style?: StyleProp<ViewStyle>;

  // Functions
  playAsync: () => void;
  pauseAsync: () => void;
  replayAsync: () => void;
  nextAsync?: () => void;
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

export default function Player(props: Props) {
  const [userIsDraggingSlider, setIsScrubbing] = React.useState(false);
  const [positionMillisWhenStartedDragging, setPositionMillisWhenStartedDragging] = React.useState<
    undefined | number
  >();

  const _play = () => props.playAsync();

  const _pause = () => props.pauseAsync();

  const _playFromPosition = (position: number) =>
    props.setPositionAsync(position).then(() => setIsScrubbing(false));

  const _toggleLooping = () => props.setIsLoopingAsync(!props.isLooping);

  const _toggleIsMuted = () => props.setIsMutedAsync(!props.isMuted);

  const _toggleSlowRate = () =>
    props.setRateAsync(props.rate < 1 ? 1 : 0.5, props.shouldCorrectPitch);

  const _toggleFastRate = () =>
    props.setRateAsync(props.rate > 1 ? 1 : 2, props.shouldCorrectPitch);

  const _toggleShouldCorrectPitch = () => props.setRateAsync(props.rate, !props.shouldCorrectPitch);

  const _seekForward = () => props.setPositionAsync(props.positionMillis + 5000);

  const _seekBackward = () => props.setPositionAsync(Math.max(0, props.positionMillis - 5000));

  const _renderPlayPauseButton = () => {
    let onPress = _pause;
    let iconName = 'ios-pause';

    if (!props.isPlaying) {
      onPress = _play;
      iconName = 'ios-play';
    }

    return (
      <TouchableOpacity onPress={onPress} disabled={!props.isLoaded}>
        <Ionicons name={iconName} style={[styles.icon, styles.playPauseIcon]} />
      </TouchableOpacity>
    );
  };

  const _maybeRenderErrorOverlay = () => {
    if (props.errorMessage) {
      return (
        <ScrollView style={styles.errorMessage}>
          <Text style={styles.errorText}>{props.errorMessage}</Text>
        </ScrollView>
      );
    }
    return null;
  };

  const _renderAuxiliaryButton = ({
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
        disabled={!props.isLoaded}
        onPress={onPress}>
        <Ionicons
          name={`ios-${iconName}`}
          size={iconName === 'refresh' ? 20 : 24}
          style={[styles.icon, styles.buttonIcon, active && styles.activeButtonText]}
        />
        <Text style={[styles.buttonText, active && styles.activeButtonText]}>{title}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={props.style}>
      {props.header}
      <View style={styles.container}>
        {_renderPlayPauseButton()}
        <Slider
          style={styles.slider}
          value={userIsDraggingSlider ? positionMillisWhenStartedDragging : props.positionMillis}
          maximumValue={props.durationMillis}
          disabled={!props.isLoaded}
          minimumTrackTintColor={Colors.tintColor}
          onSlidingComplete={_playFromPosition}
          onResponderGrant={() => {
            setIsScrubbing(true);
            setPositionMillisWhenStartedDragging(props.positionMillis);
          }}
        />
        <Text style={{ width: 100, textAlign: 'right' }} adjustsFontSizeToFit numberOfLines={1}>
          {_formatTime(props.positionMillis / 1000)} / {_formatTime(props.durationMillis / 1000)}
        </Text>
      </View>
      <View style={[styles.container, styles.buttonsContainer]}>
        {_renderAuxiliaryButton({
          iconName: 'repeat',
          title: 'Repeat',
          onPress: _toggleLooping,
          active: props.isLooping,
        })}
        {_renderAuxiliaryButton({
          iconName: 'volume-off',
          title: 'Mute',
          onPress: _toggleIsMuted,
          active: props.isMuted,
        })}
        {_renderAuxiliaryButton({
          disable: Platform.OS === 'web',
          iconName: 'stats',
          title: 'Correct pitch',
          onPress: _toggleShouldCorrectPitch,
          active: props.shouldCorrectPitch,
        })}

        {_renderAuxiliaryButton({
          iconName: 'hourglass',
          title: 'Slower',
          onPress: _toggleSlowRate,
          active: props.rate < 1,
        })}
        {_renderAuxiliaryButton({
          iconName: 'speedometer',
          title: 'Faster',
          onPress: _toggleFastRate,
          active: props.rate > 1,
        })}
      </View>
      <View style={[styles.container, styles.buttonsContainer]}>
        {_renderAuxiliaryButton({
          iconName: 'refresh',
          title: 'Replay',
          onPress: props.replayAsync,
          active: false,
        })}
        {props.nextAsync &&
          _renderAuxiliaryButton({
            iconName: 'skip-forward',
            title: 'Next',
            onPress: props.nextAsync,
            active: false,
          })}
        {_renderAuxiliaryButton({
          iconName: 'rewind',
          title: 'Seek Backward',
          onPress: _seekBackward,
        })}
        {_renderAuxiliaryButton({
          iconName: 'fastforward',
          title: 'Seek Forward',
          onPress: _seekForward,
        })}
      </View>
      <View style={[styles.container, styles.buttonsContainer]}>
        {(props.extraButtons ?? []).map(button => {
          if (typeof button === 'function') return button();
          return _renderAuxiliaryButton(button);
        })}
      </View>
      {_maybeRenderErrorOverlay()}
    </View>
  );
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
