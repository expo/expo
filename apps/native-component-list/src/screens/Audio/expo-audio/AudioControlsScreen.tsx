import { useAudioPlayer, useAudioPlayerStatus, AudioModule, AudioSource } from 'expo-audio';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import Player from './Player';
import Button from '../../../components/Button';
import HeadingText from '../../../components/HeadingText';

const artworkUrl1 =
  'https://images.unsplash.com/photo-1549138144-42ff3cdd2bf8?q=80&w=3504&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D';
const artworkUrl2 =
  'https://images.unsplash.com/photo-1549228167-511375f69159?q=80&w=3676&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D';
const remoteSource =
  'https://p.scdn.co/mp3-preview/f7a8ab9c5768009b65a30e9162555e8f21046f46?cid=162b7dc01f3a4a2ca32ed3cec83d1e02';
const localSource = require('../../../../assets/sounds/polonez.mp3');

export default function AudioControlsScreen(props: any) {
  React.useLayoutEffect(() => {
    AudioModule.setAudioModeAsync({
      shouldPlayInBackground: true,
      interruptionMode: 'doNotMix',
      playsInSilentMode: true,
      allowsRecording: false,
    });
    AudioModule.setIsAudioActiveAsync(true);
    props.navigation.setOptions({
      title: 'Audio Controls',
    });
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.contentContainer}>
      <HeadingText>Lock Screen controls</HeadingText>

      <HeadingText>Local Source</HeadingText>
      <AudioPlayer source={localSource} />

      <HeadingText>Remote Source</HeadingText>
      <AudioPlayer source={remoteSource} />
    </ScrollView>
  );
}

function AudioPlayer({ source }: { source: AudioSource | string | number }) {
  const player = useAudioPlayer(source);
  const status = useAudioPlayerStatus(player);
  const [enabled, setEnabled] = useState(false);
  const [metadata, setMetadata] = useState<1 | 2>(1);

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

  const setVolume = (volume: number) => {
    player.volume = volume;
  };

  return (
    <View>
      <Player
        {...status}
        audioPan={0}
        volume={player.volume}
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
      />
      <View style={styles.btnContainer}>
        <Button
          title={`${enabled ? 'Disable' : 'Enable'} Lock Screen controls`}
          onPress={() => {
            player.setActiveForLockScreen(!enabled, {
              title: 'Test',
              artist: 'Test artist',
              artworkUrl: artworkUrl1,
            });
            setEnabled((e) => !e);
          }}
        />
        <Button
          title="Update Metadata"
          onPress={() => {
            if (metadata === 1) {
              player.updateLockScreenMetadata({
                title: 'Test 2',
                artist: 'Test artist 2',
                artworkUrl: artworkUrl2,
              });
              setMetadata(2);
            } else {
              player.updateLockScreenMetadata({
                title: 'Test',
                artist: 'Test artist',
                artworkUrl: artworkUrl1,
              });
              setMetadata(1);
            }
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    padding: 10,
  },
  btnContainer: {
    gap: 10,
  },
});
