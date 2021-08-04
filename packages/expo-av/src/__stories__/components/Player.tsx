// @needsRefactor

import Ionicons from '@expo/vector-icons/build/Ionicons';
import { Colors } from 'expo-stories/shared/constants';
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

import { formatTime } from '../helpers';
import { PitchControl, SpeedSegmentedControl, VolumeSlider, Slider } from './Controls';

interface Props {
  header?: JSX.Element;
  extraButtons?: (
    | {
        iconName: string;
        title: string;
        onPress: (event: GestureResponderEvent) => void;
        active: boolean;
        disable?: boolean;
      }
    | (() => React.ReactNode)
  )[];
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
  setVolume: (volume: number) => void;

  // Status
  isLoaded: boolean;
  isLooping: boolean;
  volume: number;
  rate: number;
  positionMillis: number;
  durationMillis: number;
  shouldCorrectPitch: boolean;
  isPlaying: boolean;
  isMuted: boolean;

  // Error
  errorMessage?: string;
}

export default function Player(props: Props) {
  const [isScrubbing, setIsScrubbing] = React.useState(false);
  const [initialScrubbingMillis, setInitialScrubbingMillis] = React.useState<undefined | number>();

  const _play = () => props.playAsync();

  const _pause = () => props.pauseAsync();

  const _playFromPosition = (position: number) =>
    props.setPositionAsync(position).then(() => setIsScrubbing(false));

  const _toggleLooping = () => props.setIsLoopingAsync(!props.isLooping);

  const _toggleShouldCorrectPitch = () => props.setRateAsync(props.rate, !props.shouldCorrectPitch);

  const _seekForward = () => props.setPositionAsync(props.positionMillis + 5000);

  const _seekBackward = () => props.setPositionAsync(Math.max(0, props.positionMillis - 5000));

  const _renderReplayButton = () => {
    return (
      <TouchableOpacity onPress={_toggleLooping} disabled={!props.isLoaded}>
        <Ionicons
          name="repeat"
          size={34}
          style={[styles.icon, !props.isLooping && { color: '#C1C1C1' }]}
        />
      </TouchableOpacity>
    );
  };

  const _renderPlayPauseButton = () => {
    let onPress = _pause;
    let iconName = 'ios-pause';

    if (!props.isPlaying) {
      onPress = _play;
      iconName = 'ios-play';
    }

    return (
      <TouchableOpacity onPress={onPress} disabled={!props.isLoaded}>
        <Ionicons
          name={iconName as 'ios-pause' | 'ios-play'}
          style={[styles.icon, styles.playPauseIcon]}
        />
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
          name={`ios-${iconName}` as any}
          size={iconName === 'refresh' ? 20 : 24}
          style={[styles.icon, styles.buttonIcon, active && styles.activeButtonText]}
        />
        <Text style={[styles.buttonText, active && styles.activeButtonText]}>{title}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={props.style}>
      <View style={{ opacity: isScrubbing ? 0.8 : 1, backgroundColor: 'black' }}>
        {props.header}
      </View>
      <View style={styles.container}>
        {_renderPlayPauseButton()}
        <Slider
          style={styles.slider}
          thumbTintColor={Colors.tintColor}
          value={isScrubbing ? initialScrubbingMillis : props.positionMillis}
          maximumValue={props.durationMillis}
          disabled={!props.isLoaded}
          minimumTrackTintColor={Colors.tintColor}
          onSlidingComplete={_playFromPosition}
          onResponderGrant={() => {
            setIsScrubbing(true);
            setInitialScrubbingMillis(props.positionMillis);
          }}
        />
        <Text style={{ width: 100, textAlign: 'right' }} adjustsFontSizeToFit numberOfLines={1}>
          {formatTime(props.positionMillis / 1000)} / {formatTime(props.durationMillis / 1000)}
        </Text>
        {_renderReplayButton()}
      </View>

      <View style={styles.container}>
        <VolumeSlider
          isMuted={props.isMuted}
          disabled={!props.isLoaded}
          style={{ width: undefined, flex: 1 }}
          volume={props.volume}
          onValueChanged={({ isMuted, volume }) => {
            props.setIsMutedAsync(isMuted);
            props.setVolume(volume);
          }}
        />
      </View>

      <View style={[styles.container, styles.buttonsContainer]}>
        {(props.extraButtons ?? []).map(button => {
          if (typeof button === 'function') return button();
          return _renderAuxiliaryButton(button);
        })}
      </View>

      <View
        style={[
          styles.container,
          { flexDirection: 'row', flex: 1, justifyContent: 'space-between' },
        ]}>
        <PitchControl
          disabled={Platform.OS === 'web'}
          value={props.shouldCorrectPitch}
          onPress={_toggleShouldCorrectPitch}
        />
        <SpeedSegmentedControl
          onValueChange={rate => {
            props.setRateAsync(rate, props.shouldCorrectPitch);
          }}
        />
      </View>

      <View style={[styles.container, styles.buttonsContainer]}>
        {_renderAuxiliaryButton({
          iconName: 'play-skip-back',
          title: 'Replay',
          onPress: props.replayAsync,
          active: false,
        })}

        {_renderAuxiliaryButton({
          iconName: 'play-back',
          title: 'Seek Backward',
          onPress: _seekBackward,
        })}
        {_renderAuxiliaryButton({
          iconName: 'play-forward',
          title: 'Seek Forward',
          onPress: _seekForward,
        })}
        {props.nextAsync &&
          _renderAuxiliaryButton({
            iconName: 'play-skip-forward',
            title: 'Next',
            onPress: props.nextAsync,
            active: false,
          })}
      </View>
      {_maybeRenderErrorOverlay()}
    </View>
  );
}

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
