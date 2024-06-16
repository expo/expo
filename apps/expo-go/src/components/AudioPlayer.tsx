import Ionicons from '@expo/vector-icons/build/Ionicons';
import { Audio, AVPlaybackStatus } from 'expo-av';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, StyleProp, ViewStyle } from 'react-native';
import { BorderlessButton, ScrollView } from 'react-native-gesture-handler';

import { StyledText } from '../components/Text';
import Colors from '../constants/Colors';

interface Props {
  isAudioEnabled: boolean;
  source: { uri: string };
  style?: StyleProp<ViewStyle>;
}

type ErrorState = string | null | undefined;

type PlaybackState =
  | { isLoaded: false }
  | {
      isLoaded: true;
      sound: Audio.Sound;
      positionMillis: number;
      durationMillis: number | undefined;
      isPlaying: boolean;
      isLooping: boolean;
      isMuted: boolean;
      rate: number;
      shouldCorrectPitch: boolean;
    };

const initialErrorState: ErrorState = null;
const initialPlaybackState: PlaybackState = { isLoaded: false };

export default function AudioPlayer({ isAudioEnabled, source, style }: Props) {
  const [error, setError] = useState(initialErrorState);
  const [playback, setPlayback] = useState(initialPlaybackState);

  function handlePlaybackStatusUpdate(sound: Audio.Sound, status: AVPlaybackStatus): void {
    if (!status.isLoaded) {
      setPlayback({ isLoaded: false });
      setError(status.error);
    } else {
      setPlayback({
        isLoaded: true,
        sound,
        positionMillis: status.positionMillis,
        durationMillis: status.durationMillis,
        isPlaying: status.isPlaying,
        isLooping: status.isLooping,
        isMuted: status.isMuted,
        rate: status.rate,
        shouldCorrectPitch: status.shouldCorrectPitch,
      });
      setError(null);
    }
  }

  useEffect(() => {
    const sound = new Audio.Sound();
    sound.setOnPlaybackStatusUpdate((status) => {
      handlePlaybackStatusUpdate(sound, status);
    });

    sound.loadAsync(source, { progressUpdateIntervalMillis: 150 }).catch(setError);

    return () => {
      setPlayback({ isLoaded: false });
      sound.setOnPlaybackStatusUpdate(null);
      sound.unloadAsync();
    };
  }, [source]);

  const isPlayable = isAudioEnabled && playback.isLoaded;

  return (
    <View style={style}>
      <View style={[styles.container, { paddingHorizontal: 12 }]}>
        <AudioPlayButton
          disabled={!isPlayable}
          active={playback.isLoaded && playback.isPlaying}
          onPress={() => {
            if (playback.isLoaded) {
              if (playback.isPlaying) {
                playback.sound.pauseAsync();
              } else if (playback.positionMillis < playback.durationMillis!) {
                playback.sound.playFromPositionAsync(0);
              } else {
                playback.sound.playAsync();
              }
            }
          }}
        />
        <StyledText
          style={{ width: 100, textAlign: 'right', fontVariant: ['tabular-nums'] }}
          adjustsFontSizeToFit
          numberOfLines={1}>
          {playback.isLoaded
            ? `${_formatTime(playback.positionMillis / 1000)} / ${_formatTime(
                playback.durationMillis! / 1000
              )}`
            : '00:00 / 00:00'}
        </StyledText>
      </View>
      <View style={styles.buttonContainer}>
        <AudioSettingsButton
          title="Repeat"
          iconName="repeat"
          disabled={!isPlayable}
          active={playback.isLoaded && playback.isLooping}
          onPress={() => {
            if (playback.isLoaded) {
              playback.sound.setIsLoopingAsync(!playback.isLooping);
            }
          }}
        />
        <AudioSettingsButton
          title="Slower"
          iconName="hourglass"
          disabled={!isPlayable}
          active={playback.isLoaded && playback.rate < 1}
          onPress={() => {
            if (playback.isLoaded) {
              const newRate = playback.rate < 1 ? 1 : 0.5;
              playback.sound.setRateAsync(
                newRate,
                playback.shouldCorrectPitch,
                Audio.PitchCorrectionQuality.High
              );
            }
          }}
        />
        <AudioSettingsButton
          title="Faster"
          iconName="speedometer"
          disabled={!isPlayable}
          active={playback.isLoaded && playback.rate > 1}
          onPress={() => {
            if (playback.isLoaded) {
              const newRate = playback.rate > 1 ? 1 : 2;
              playback.sound.setRateAsync(
                newRate,
                playback.shouldCorrectPitch,
                Audio.PitchCorrectionQuality.High
              );
            }
          }}
        />
        <AudioSettingsButton
          title="Correct Pitch"
          iconName="stats-chart"
          disabled={!isPlayable}
          active={playback.isLoaded && playback.shouldCorrectPitch}
          onPress={() => {
            if (playback.isLoaded) {
              playback.sound.setRateAsync(
                playback.rate,
                !playback.shouldCorrectPitch,
                Audio.PitchCorrectionQuality.High
              );
            }
          }}
        />
        <AudioSettingsButton
          title="Mute"
          iconName="volume-off"
          disabled={!isPlayable}
          active={playback.isLoaded && playback.isMuted}
          onPress={() => {
            if (playback.isLoaded) {
              playback.sound.setIsMutedAsync(!playback.isMuted);
            }
          }}
        />
      </View>
      {error ? <PlayerErrorOverlay errorMessage={error} /> : null}
    </View>
  );
}

type AudioSettingsButtonProps = {
  title: string;
  iconName: 'hourglass' | 'volume-off' | 'repeat' | 'speedometer' | 'stats-chart';
  disabled: boolean;
  active: boolean;
  onPress: () => void;
  style?: any;
};

function AudioSettingsButton(props: AudioSettingsButtonProps) {
  return (
    <BorderlessButton
      enabled={!props.disabled}
      onPress={props.onPress}
      style={[props.style, styles.button, props.active ? styles.activeButton : null]}>
      <Ionicons
        name={props.iconName}
        style={[
          styles.icon,
          props.disabled ? styles.disabledButton : null,
          styles.buttonIcon,
          props.active ? styles.activeButtonText : null,
        ]}
      />
      <Text
        style={[
          styles.buttonText,
          props.disabled ? styles.disabledButton : null,
          props.active ? styles.activeButtonText : null,
        ]}>
        {props.title}
      </Text>
    </BorderlessButton>
  );
}

type PlayerErrorOverlayProps = {
  errorMessage: string;
};

function PlayerErrorOverlay(props: PlayerErrorOverlayProps) {
  return (
    <ScrollView style={styles.errorOverlay}>
      <Text style={styles.errorText}>{props.errorMessage}</Text>
    </ScrollView>
  );
}

type AudioPlayButtonProps = {
  disabled: boolean;
  active: boolean;
  onPress: () => void;
  style?: any;
};

function AudioPlayButton(props: AudioPlayButtonProps) {
  return (
    <BorderlessButton enabled={!props.disabled} onPress={props.onPress} style={props.style}>
      <Ionicons
        name={props.active ? 'pause' : 'play'}
        style={[styles.icon, props.disabled ? styles.disabledButton : null, styles.playButtonIcon]}
      />
    </BorderlessButton>
  );
}

function _formatTime(duration: number): string {
  const paddedSeconds = `${Math.floor(duration % 60)}`.padStart(2, '0');
  const paddedMinutes = `${Math.floor(duration / 60)}`.padStart(2, '0');
  return `${paddedMinutes}:${paddedSeconds}`;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    color: Colors.light.tintColor,
    fontSize: 24,
    padding: 8,
  },
  disabledButton: {
    color: Colors.light.greyText,
  },
  playButtonIcon: {
    fontSize: 34,
    paddingTop: 11,
  },
  slider: {
    flex: 1,
    marginHorizontal: 10,
  },
  buttonContainer: {
    alignItems: 'stretch',
    flexDirection: 'row',
    justifyContent: 'space-evenly',
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
    color: Colors.light.tintColor,
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
    backgroundColor: Colors.light.tintColor,
    borderRadius: 12,
  },
  activeButtonText: {
    color: 'white',
  },
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#f00',
  },
  errorText: {
    margin: 8,
    fontWeight: 'bold',
    color: '#fff',
  },
});
