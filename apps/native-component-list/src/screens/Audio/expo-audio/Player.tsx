import Ionicons from '@expo/vector-icons/build/Ionicons';
import Slider from '@react-native-community/slider';
import SegmentedControl from '@react-native-segmented-control/segmented-control';
import { AVMetadata } from 'expo-av';
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

import Colors from '../../../constants/Colors';

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
  extraIndicator?: JSX.Element;
  style?: StyleProp<ViewStyle>;

  // Functions
  play: () => void;
  pause: () => void;
  replay: () => void;
  next?: () => void;
  setRate: (rate: number, shouldCorrectPitch: boolean) => void;
  setIsMuted: (isMuted: boolean) => void;
  setPosition: (position: number) => Promise<any>;
  setIsLooping: (isLooping: boolean) => void;
  setVolume: (volume: number, audioPan?: number) => void;

  // Status
  isLoaded: boolean;
  loop: boolean;
  volume: number;
  audioPan: number;
  playbackRate: number;
  currentTime: number;
  duration: number;
  shouldCorrectPitch: boolean;
  playing: boolean;
  mute: boolean;
  metadata?: AVMetadata;

  // Error
  errorMessage?: string;
}

export default function Player(props: Props) {
  const [isScrubbing, setIsScrubbing] = React.useState(false);
  const [initialScrubbingMillis, setInitialScrubbingMillis] = React.useState<undefined | number>();

  const _play = () => props.play();

  const _pause = () => props.pause();

  const _playFromPosition = (position: number) =>
    props.setPosition(position).then(() => setIsScrubbing(false));

  const _toggleLooping = () => props.setIsLooping(!props.loop);

  const _toggleShouldCorrectPitch = () =>
    props.setRate(props.playbackRate, !props.shouldCorrectPitch);

  const _seekForward = () => props.setPosition(props.currentTime + 5);

  const _seekBackward = () => props.setPosition(Math.max(0, props.currentTime - 5));

  const _renderReplayButton = () => {
    return (
      <TouchableOpacity onPress={_toggleLooping} disabled={!props.isLoaded}>
        <Ionicons
          name="repeat"
          size={34}
          style={[styles.icon, !props.loop && { color: '#C1C1C1' }]}
        />
      </TouchableOpacity>
    );
  };

  const _renderPlayPauseButton = () => {
    let onPress = _pause;
    let iconName = 'pause';

    if (!props.playing) {
      onPress = _play;
      iconName = 'play';
    }

    return (
      <TouchableOpacity onPress={onPress} disabled={!props.isLoaded}>
        <Ionicons name={iconName as 'pause' | 'play'} style={[styles.icon, styles.playPauseIcon]} />
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
          name={`${iconName}` as any}
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
          value={isScrubbing ? initialScrubbingMillis : props.currentTime}
          maximumValue={props.duration === Infinity || isNaN(props.duration) ? 0 : props.duration}
          disabled={!props.isLoaded}
          minimumTrackTintColor={Colors.tintColor}
          onSlidingComplete={_playFromPosition}
          onResponderGrant={() => {
            setIsScrubbing(true);
            setInitialScrubbingMillis(props.currentTime);
          }}
        />
        <Text style={{ width: 100, textAlign: 'right' }} adjustsFontSizeToFit numberOfLines={1}>
          {_formatTime(props.currentTime)} / {_formatTime(props.duration)}
        </Text>
        {_renderReplayButton()}
      </View>

      <Text>{props.metadata?.title ?? ''}</Text>

      <View style={styles.container}>{props.extraIndicator}</View>

      <View style={styles.container}>
        <VolumeSlider
          isMuted={props.mute}
          disabled={!props.isLoaded}
          style={{ width: undefined, flex: 1 }}
          volume={props.volume}
          onValueChanged={({ isMuted, volume }) => {
            props.setIsMuted(isMuted);
            props.setVolume(volume);
          }}
        />
      </View>
      <View style={styles.container}>
        <PanSlider
          audioPan={props.audioPan}
          disabled={!props.isLoaded}
          onValueChanged={(value) => {
            props.setVolume(props.volume, value);
          }}
        />
      </View>

      <View style={[styles.container, styles.buttonsContainer]}>
        {(props.extraButtons ?? []).map((button) => {
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
          onValueChange={(rate) => {
            props.setRate(rate, props.shouldCorrectPitch);
          }}
        />
      </View>

      <View style={[styles.container, styles.buttonsContainer]}>
        {_renderAuxiliaryButton({
          iconName: 'play-skip-back',
          title: 'Replay',
          onPress: props.replay,
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
        {props.next &&
          _renderAuxiliaryButton({
            iconName: 'play-skip-forward',
            title: 'Next',
            onPress: props.next,
            active: false,
          })}
      </View>
      {_maybeRenderErrorOverlay()}
    </View>
  );
}

function PitchControl({
  value,
  disabled,
  onPress,
}: {
  disabled: boolean;
  value: boolean;
  onPress: (value: boolean) => void;
}) {
  const height = 36;

  const color = value ? Colors.tintColor : '#C1C1C1';
  return (
    <TouchableOpacity
      disabled={disabled}
      style={{
        alignItems: 'center',
        flexDirection: 'row',
        paddingHorizontal: 4,
        height,
        justifyContent: 'center',
      }}
      onPress={() => {
        onPress(!value);
      }}>
      <Ionicons name="stats-chart" size={24} color={color} style={{}} />
      <Text
        style={{
          textDecorationLine: disabled ? 'line-through' : 'none',
          textAlign: 'center',
          fontWeight: 'bold',
          color,
          marginLeft: 8,
          fontSize: 12,
        }}>
        Correct Pitch
      </Text>
    </TouchableOpacity>
  );
}

function SpeedSegmentedControl({ onValueChange }: { onValueChange: (value: number) => void }) {
  const data = ['0.5', '1.0', '1.5', '2.0'];
  const [index, setIndex] = React.useState(1);

  const renderIcon = (name: string) => (
    <Ionicons
      name={`${name}` as 'hourglass' | 'speedometer'}
      size={24}
      style={{ color: Colors.tintColor, paddingHorizontal: 8 }}
    />
  );
  return (
    <View
      style={{
        alignItems: 'center',
        justifyContent: 'flex-end',
        paddingBottom: 6,
        margin: 10,
        marginTop: 5,
        flexDirection: 'row',
      }}>
      {renderIcon('hourglass')}

      <SegmentedControl
        style={{ width: '50%', minWidth: 260 }}
        values={data.map((i) => i + 'x')}
        fontStyle={{ color: Colors.tintColor }}
        selectedIndex={index}
        tintColor="white"
        onChange={(event) => {
          setIndex(event.nativeEvent.selectedSegmentIndex);
        }}
        onValueChange={(value) => onValueChange(parseFloat(value))}
      />
      {renderIcon('speedometer')}
    </View>
  );
}

function PanSlider({
  audioPan,
  color = Colors.tintColor,
  disabled,
  onValueChanged,
}: {
  audioPan: number;
  color?: string;
  disabled: boolean;
  onValueChanged: (value: number) => void;
}) {
  const [value, setValue] = React.useState(audioPan);

  React.useEffect(() => {
    if (value !== audioPan) {
      onValueChanged(value);
    }
  }, [audioPan]);

  const height = 36;
  return (
    <View
      style={[{ flexDirection: 'row', width: 100 }, disabled && { opacity: 0.7 }, { flex: 1 }]}
      pointerEvents={disabled ? 'none' : 'auto'}>
      <View style={{ alignItems: 'center', width: height, height, justifyContent: 'center' }}>
        <Ionicons name="barcode-outline" size={24} color={color} />
      </View>
      <Slider
        value={value}
        maximumValue={1}
        minimumValue={-1}
        style={{ height, flex: 1 }}
        thumbTintColor={color}
        minimumTrackTintColor={color}
        onSlidingComplete={(value) => {
          onValueChanged(value);
        }}
        onValueChange={(val) => {
          setValue(val);
        }}
      />
    </View>
  );
}

function VolumeSlider({
  volume,
  isMuted,
  disabled,
  color = Colors.tintColor,
  onValueChanged,
  style,
}: {
  volume: number;
  isMuted: boolean;
  disabled?: boolean;
  color?: string;
  style?: any;
  onValueChanged: (data: { isMuted: boolean; volume: number }) => void;
}) {
  const [value, setValue] = React.useState(volume);
  const lastUserValue = React.useRef(volume);

  React.useEffect(() => {
    if (!isMuted && lastUserValue.current !== value) {
      const value = lastUserValue.current;
      setValue(value);
      onValueChanged({ isMuted, volume: value });
    }
  }, [isMuted]);

  const isMutedActive = React.useMemo(() => {
    return isMuted || value <= 0;
  }, [isMuted, value]);

  const iconName = React.useMemo(() => {
    if (isMutedActive) {
      return 'volume-off';
    }
    return value > 0.5 ? 'volume-high' : 'volume-low';
  }, [isMutedActive, value]);

  React.useEffect(() => {
    if (value !== volume) {
      onValueChanged({ volume, isMuted });
    }
  }, [volume]);

  const height = 36;
  return (
    <View
      style={[{ flexDirection: 'row', width: 100 }, disabled && { opacity: 0.7 }, style]}
      pointerEvents={disabled ? 'none' : 'auto'}>
      <TouchableOpacity
        style={{ alignItems: 'center', width: height, height, justifyContent: 'center' }}
        onPress={() => {
          onValueChanged({ isMuted: !isMuted, volume });
        }}>
        <Ionicons
          name={`${iconName}` as 'volume-high' | 'volume-low' | 'volume-off'}
          size={24}
          color={color}
          style={{}}
        />
      </TouchableOpacity>
      <Slider
        value={isMutedActive ? 0 : value}
        maximumValue={1}
        style={{ height, flex: 1 }}
        thumbTintColor={color}
        minimumTrackTintColor={color}
        onSlidingComplete={(value) => {
          onValueChanged({ isMuted: value <= 0, volume: value });

          if (value > 0) {
            lastUserValue.current = value;
          }
        }}
        onValueChange={(value) => {
          setValue(value);
        }}
      />
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
