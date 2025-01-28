import { createAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import React from 'react';
import { PixelRatio, ScrollView, StyleProp, StyleSheet, ViewStyle } from 'react-native';

import { JsiAudioBar } from './JsiAudioBar';
import Player from './Player';
import HeadingText from '../../../components/HeadingText';

export default function CreateAudioPlayerScreen(props: any) {
  React.useLayoutEffect(() => {
    props.navigation.setOptions({
      title: 'createAudioPlayer',
    });
  });

  return (
    <ScrollView contentContainerStyle={styles.contentContainer}>
      <HeadingText>Player</HeadingText>
      <AudioPlayer style={styles.player} />
    </ScrollView>
  );
}
const player = createAudioPlayer({
  uri: 'https://p.scdn.co/mp3-preview/f7a8ab9c5768009b65a30e9162555e8f21046f46?cid=162b7dc01f3a4a2ca32ed3cec83d1e02',
});

function AudioPlayer({ style }: { style?: StyleProp<ViewStyle> }) {
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

  return (
    <Player
      {...status}
      audioPan={1}
      volume={player.volume}
      style={style}
      play={() => player.play()}
      pause={() => player.pause()}
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
    />
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    padding: 10,
  },
  player: {
    borderBottomWidth: 1.0 / PixelRatio.get(),
    borderBottomColor: '#cccccc',
  },
});
