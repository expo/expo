import Ionicons from '@expo/vector-icons/build/Ionicons';
import { useAudioPlayer, AudioSource, useAudioPlayerStatus } from 'expo-audio';
import React from 'react';
import { StyleProp, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';

import Colors from '../../constants/Colors';
import { JsiAudioBar } from './JsiAudioBar';
import Player from './Player';

type AudioPlayerProps = {
  source: AudioSource | string | number;
  style?: StyleProp<ViewStyle>;
  downloadFirst?: boolean;
  crossOrigin?: 'anonymous' | 'use-credentials';
};

const localSource = require('../../../assets/sounds/polonez.mp3');
const remoteSource = 'https://expo-test-media.com/audio/por_una_cabeza.mp3';

export default function AudioPlayer({
  source,
  style,
  downloadFirst = false,
  crossOrigin,
}: AudioPlayerProps) {
  const [currentSource, setCurrentSource] = React.useState(source);
  const player = useAudioPlayer(source, { downloadFirst, crossOrigin });
  const status = useAudioPlayerStatus(player);

  const setVolume = (volume: number) => {
    player.volume = volume;
  };

  const setIsMuted = (isMuted: boolean) => {
    player.muted = isMuted;
  };

  const setIsLooping = (isLooping: boolean) => {
    player.loop = isLooping;
  };

  const setRate = (rate: number, shouldCorrectPitch: boolean) => {
    player.shouldCorrectPitch = shouldCorrectPitch;
    player.setPlaybackRate(rate);
  };

  const replaceSource = () => {
    const source = currentSource === localSource ? remoteSource : localSource;
    player.replace(source);
    setCurrentSource(source);
  };

  // POC: independent pitch shift (iOS). `pitch` is in semitones; only affects local files.
  const [pitch, setPitch] = React.useState(0);
  const changePitch = (delta: number) => {
    const next = Math.max(-20, Math.min(20, pitch + delta));
    (player as any).pitch = next;
    setPitch(next);
  };

  const pitchControl = (
    <View style={styles.pitchRow}>
      <Text style={styles.pitchLabel}>Pitch:</Text>
      <TouchableOpacity onPress={() => changePitch(-5)} disabled={pitch <= -20}>
        <Ionicons
          name="remove-circle"
          size={30}
          color={pitch <= -20 ? '#C1C1C1' : Colors.tintColor}
        />
      </TouchableOpacity>
      <Text style={styles.pitchValue}>{pitch}</Text>
      <TouchableOpacity onPress={() => changePitch(5)} disabled={pitch >= 20}>
        <Ionicons name="add-circle" size={30} color={pitch >= 20 ? '#C1C1C1' : Colors.tintColor} />
      </TouchableOpacity>
    </View>
  );

  return (
    <Player
      {...status}
      audioPan={0}
      volume={player.volume}
      style={style}
      play={() => {
        // expo-audio does not support looping
        // so we need to seek to the beginning of the audio when it finishes
        // this is default on web, but not on native so we need to do it manually
        if (status.didJustFinish) {
          player.seekTo(0);
        }
        player.play();
      }}
      pause={() => player.pause()}
      replace={() => replaceSource()}
      replay={() => {
        return player.seekTo(0);
      }}
      setPosition={(position: number) => {
        return player.seekTo(position);
      }}
      setIsLooping={setIsLooping}
      setRate={setRate}
      setIsMuted={setIsMuted}
      setVolume={setVolume}
      extraIndicator={<JsiAudioBar isPlaying={status.playing} player={player} />}
      pitchControl={pitchControl}
    />
  );
}

const styles = StyleSheet.create({
  pitchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  pitchLabel: {
    color: Colors.tintColor,
    fontWeight: 'bold',
    fontSize: 14,
  },
  pitchValue: {
    color: Colors.tintColor,
    fontWeight: 'bold',
    fontSize: 14,
    minWidth: 28,
    textAlign: 'center',
  },
});
