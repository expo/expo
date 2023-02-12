import { spacing, lightTheme, LogsIcon, iconSize } from '@expo/styleguide-native';
import Ionicons from '@expo/vector-icons/build/Ionicons';
import Slider from '@react-native-community/slider';
import { AVPlaybackStatus } from 'expo-av';
import { Playback } from 'expo-av/build/AV';
import { Toggle, Json } from 'expo-stories/components';
import * as React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';

type PlayerControlsProps = {
  player: Playback;
  status: Extract<AVPlaybackStatus, { isLoaded: true }>;
};

function ToggleStatusLogs({ status, children }) {
  return (
    <Toggle.Container>
      {children}
      <Toggle.Area>
        <Json json={status} />
      </Toggle.Area>
    </Toggle.Container>
  );
}

function ToggleJsonButton() {
  return (
    <Toggle.Button>
      <LogsIcon size={iconSize.large} color={lightTheme.button.primary.background} />
    </Toggle.Button>
  );
}

export function PlayPauseStopControls({ player, status }: PlayerControlsProps) {
  return (
    <ToggleStatusLogs status={status}>
      <View style={styles.controlsContainer}>
        <PlayButton player={player} status={status} />

        <TouchableOpacity style={styles.buttonContainer} onPress={() => player.stopAsync()}>
          <Ionicons name="ios-stop" size={28} color={lightTheme.button.primary.background} />
        </TouchableOpacity>

        <View style={{ flex: 1 }} />

        <ToggleJsonButton />
      </View>
    </ToggleStatusLogs>
  );
}

export function SkipControls({ player, status }: PlayerControlsProps) {
  async function skipTo(amount: number) {
    player.setPositionAsync(status.positionMillis + amount);
  }

  return (
    <ToggleStatusLogs status={status}>
      <View style={styles.controlsContainer}>
        <TouchableOpacity style={styles.buttonContainer} onPress={() => skipTo(-1500)}>
          <Ionicons name="play-skip-back" size={28} color={lightTheme.button.primary.background} />
        </TouchableOpacity>

        <PlayButton player={player} status={status} />

        <TouchableOpacity style={styles.buttonContainer} onPress={() => skipTo(1500)}>
          <Ionicons
            name="play-skip-forward"
            size={28}
            color={lightTheme.button.primary.background}
          />
        </TouchableOpacity>

        <View style={{ flex: 1 }} />

        <ToggleJsonButton />
      </View>
    </ToggleStatusLogs>
  );
}

export function PlaybackRateControls({ player, status }: PlayerControlsProps) {
  function renderPlaybackRate(rate: number) {
    const isActive = rate === status.rate;
    const shouldCorrectPitch = status.shouldCorrectPitch;

    return (
      <TouchableOpacity
        style={styles.buttonContainer}
        onPress={async () => {
          await player.setRateAsync(rate, shouldCorrectPitch);
        }}>
        <Text style={[styles.buttonLabel, isActive && styles.activeButtonLabel]}>{rate}x</Text>
      </TouchableOpacity>
    );
  }

  return (
    <ToggleStatusLogs status={status}>
      <View style={styles.controlsContainer}>
        {renderPlaybackRate(0.5)}
        {renderPlaybackRate(1)}
        {renderPlaybackRate(2)}

        <TouchableOpacity
          style={{ flexDirection: 'row', alignItems: 'center' }}
          onPress={() => player.setRateAsync(status.rate, !status.shouldCorrectPitch)}>
          <Ionicons
            name="ios-stats-chart"
            size={24}
            color={
              status.shouldCorrectPitch
                ? lightTheme.button.primary.background
                : lightTheme.icon.secondary
            }
          />
          <Text
            style={[
              styles.buttonLabel,
              styles.buttonLabelSmall,
              {
                color: status.shouldCorrectPitch
                  ? lightTheme.button.primary.background
                  : lightTheme.icon.secondary,
              },
            ]}>
            Correct Pitch
          </Text>
        </TouchableOpacity>

        <View style={{ width: spacing[4] }} />

        <PlayButton player={player} status={status} />

        <View style={{ flex: 1 }} />

        <ToggleJsonButton />
      </View>

      <Text style={[styles.buttonLabel, styles.activeButtonLabel]}>
        {formatTime(status.positionMillis / 1000)} / {formatTime(status.durationMillis / 1000)}
      </Text>
    </ToggleStatusLogs>
  );
}

export function VolumeControls({ player, status }: PlayerControlsProps) {
  return (
    <ToggleStatusLogs status={status}>
      <View style={styles.controlsContainer}>
        <VolumeSlider
          volume={status.volume}
          onValueChanged={async ({ volume, isMuted }) => {
            await player.setVolumeAsync(volume);
            await player.setIsMutedAsync(isMuted);
          }}
          color={lightTheme.button.primary.background}
          style={{ width: 200 }}
          isMuted={status.isMuted}
        />

        <View style={{ width: spacing[4] }} />

        <PlayButton player={player} status={status} />

        <View style={{ flex: 1 }} />

        <ToggleJsonButton />
      </View>
    </ToggleStatusLogs>
  );
}

export function LoopingControls({ player, status }: PlayerControlsProps) {
  const isLooping = status.isLooping;

  async function skipTo(amount: number) {
    player.setPositionAsync(status.positionMillis + amount);
  }

  return (
    <ToggleStatusLogs status={status}>
      <View style={styles.controlsContainer}>
        <TouchableOpacity
          onPress={() => {
            player.setIsLoopingAsync(!status.isLooping);
          }}>
          <Ionicons
            name="repeat"
            size={24}
            color={
              isLooping
                ? lightTheme.button.primary.background
                : lightTheme.button.tertiary.background
            }
          />
        </TouchableOpacity>

        <View style={{ width: spacing[4] }} />

        <TouchableOpacity style={styles.buttonContainer} onPress={() => skipTo(-1500)}>
          <Ionicons name="play-skip-back" size={28} color={lightTheme.button.primary.background} />
        </TouchableOpacity>

        <PlayButton player={player} status={status} />

        <TouchableOpacity style={styles.buttonContainer} onPress={() => skipTo(1500)}>
          <Ionicons
            name="play-skip-forward"
            size={28}
            color={lightTheme.button.primary.background}
          />
        </TouchableOpacity>

        <View style={{ flex: 1 }} />

        <ToggleJsonButton />
      </View>
    </ToggleStatusLogs>
  );
}

export function PlayButton({ player, status }: PlayerControlsProps) {
  const iconName = status.isPlaying ? 'ios-pause' : 'ios-play';

  return (
    <TouchableOpacity
      style={styles.buttonContainer}
      onPress={() => (status.isPlaying ? player.pauseAsync() : player.playAsync())}>
      <Ionicons name={iconName} size={28} color={lightTheme.button.primary.background} />
    </TouchableOpacity>
  );
}

type VolumeSliderProps = {
  volume: number;
  isMuted: boolean;
  disabled?: boolean;
  color?: string;
  style?: any;
  onValueChanged: (data: { isMuted: boolean; volume: number }) => void;
};

export function VolumeSlider({
  volume,
  isMuted,
  disabled,
  onValueChanged,
  style,
  color,
}: VolumeSliderProps) {
  const isMutedActive = React.useMemo(() => {
    return isMuted || volume <= 0;
  }, [isMuted, volume]);

  const iconName = React.useMemo(() => {
    if (isMutedActive) {
      return 'volume-off';
    }
    return volume > 0.5 ? 'volume-high' : 'volume-low';
  }, [isMutedActive, volume]);

  const onChange = React.useCallback(
    (value: number) => {
      onValueChanged({ isMuted: value <= 0, volume: value });
    },
    [onValueChanged]
  );

  return (
    <View
      style={[{ flexDirection: 'row' }, disabled && { opacity: 0.7 }, style]}
      pointerEvents={disabled ? 'none' : 'auto'}>
      <TouchableOpacity
        style={styles.buttonContainer}
        onPress={() => {
          onValueChanged({ isMuted: !isMuted, volume });
        }}>
        <Ionicons
          name={`ios-${iconName}` as 'ios-volume-high' | 'ios-volume-low' | 'ios-volume-off'}
          size={24}
          color={color}
        />
      </TouchableOpacity>
      <Slider
        value={isMutedActive ? 0 : volume}
        maximumValue={1}
        style={styles.slider}
        thumbTintColor={color}
        minimumTrackTintColor={color}
        onSlidingComplete={onChange}
        onValueChange={onChange}
      />
    </View>
  );
}

export function ProgressScrubber({ player, status }: PlayerControlsProps) {
  const dragStartValue = React.useRef(0);

  const [isDragging, setIsDragging] = React.useState(false);

  const progressPercent = status.positionMillis / status.durationMillis;

  const onChange = React.useCallback(
    async (percent: number) => {
      setIsDragging(false);
      dragStartValue.current = percent;
      await player.setPositionAsync(percent * status.durationMillis);
    },
    [player, status]
  );

  const onStart = () => {
    dragStartValue.current = progressPercent;
    setIsDragging(true);
  };

  return (
    <Slider
      value={isDragging ? dragStartValue.current : progressPercent}
      maximumValue={1}
      style={styles.slider}
      thumbTintColor={lightTheme.button.primary.background}
      minimumTrackTintColor={lightTheme.button.primary.background}
      onSlidingComplete={onChange}
      onSlidingStart={onStart}
    />
  );
}

const styles = StyleSheet.create({
  controlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[2],
  },
  buttonContainer: {
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[4],
  },
  buttonLabel: {
    marginLeft: spacing[2],
    color: lightTheme.text.secondary,
    fontWeight: '700',
  },
  activeButtonLabel: {
    fontSize: 18,
    color: lightTheme.button.primary.background,
  },
  buttonLabelSmall: {
    textAlign: 'center',
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 12,
  },
  slider: {
    height: 36,
    flex: 1,
  },
});

function formatTime(duration: number) {
  const paddedSecs = leftPad(`${Math.floor(duration % 60)}`, '0', 2);
  const paddedMins = leftPad(`${Math.floor(duration / 60)}`, '0', 2);
  if (duration > 3600) {
    return `${Math.floor(duration / 3600)}:${paddedMins}:${paddedSecs}`;
  }
  return `${paddedMins}:${paddedSecs}`;
}

function leftPad(s: string, padWith: string, expectedMinimumSize: number) {
  if (s.length >= expectedMinimumSize) {
    return s;
  }
  return leftPad(`${padWith}${s}`, padWith, expectedMinimumSize);
}
