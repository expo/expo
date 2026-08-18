import {
  useAudioPlayer,
  useAudioPlayerStatus,
  AudioModule,
  AudioSource,
  AudioLockScreenOptions,
} from 'expo-audio';
import Checkbox from 'expo-checkbox';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { BodyText } from '../../components/BodyText';
import Button from '../../components/Button';
import HeadingText from '../../components/HeadingText';
import Player from './Player';

const artworkUrl1 =
  'https://images.unsplash.com/photo-1549138144-42ff3cdd2bf8?q=80&w=3504&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D';
const artworkUrl2 =
  'https://images.unsplash.com/photo-1549228167-511375f69159?q=80&w=3676&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D';
const remoteSource = 'https://expo-test-media.com/audio/por_una_cabeza.mp3';
const localSource = require('../../../assets/sounds/polonez.mp3');
const liveStreamSource =
  'https://dai.google.com/linear/hls/event/Sid4xiTQTkCT1SLu6rjUSQ/master.m3u8';

enum LockScreenButton {
  /**
   * Seek 10s forward button
   */
  SEEK_FORWARD = 0,
  /**
   * Seek 10s back button
   */
  SEEK_BACKWARD = 1,
}

export default function AudioControlsScreen(props: any) {
  const [activeLockScreenPlayer, setActiveLockScreenPlayer] = useState<string | null>(null);

  React.useLayoutEffect(() => {
    AudioModule.setAudioModeAsync({
      shouldPlayInBackground: true,
      interruptionMode: 'doNotMix',
      playsInSilentMode: true,
      allowsRecording: false,
    }).catch((error: unknown) =>
      console.warn(`Error calling setAudioModeAsync: ${JSON.stringify(error)}`)
    );
    props.navigation.setOptions({
      title: 'Audio Controls',
    });
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.contentContainer}>
      <HeadingText>Lock Screen controls</HeadingText>

      <AudioPlayer
        title="Local Source"
        source={localSource}
        activeLockScreenPlayer={activeLockScreenPlayer}
        setActiveLockScreenPlayer={setActiveLockScreenPlayer}
      />

      <AudioPlayer
        title="Remote Source"
        source={remoteSource}
        activeLockScreenPlayer={activeLockScreenPlayer}
        setActiveLockScreenPlayer={setActiveLockScreenPlayer}
      />

      <AudioPlayer
        title="Live Stream (HLS)"
        source={liveStreamSource}
        activeLockScreenPlayer={activeLockScreenPlayer}
        setActiveLockScreenPlayer={setActiveLockScreenPlayer}
      />
    </ScrollView>
  );
}

function AudioPlayer({
  title,
  source,
  activeLockScreenPlayer,
  setActiveLockScreenPlayer,
}: {
  title: string;
  source: AudioSource | string | number;
  activeLockScreenPlayer: string | null;
  setActiveLockScreenPlayer: (player: string | null) => void;
}) {
  const player = useAudioPlayer(source);
  const status = useAudioPlayerStatus(player);
  const [metadata, setMetadata] = useState<1 | 2>(1);
  const [options, setOptions] = useState<AudioLockScreenOptions>();
  const isActiveForLockScreen = activeLockScreenPlayer === title;

  const getMetadata = (preset: 1 | 2) => {
    return preset === 1
      ? {
          title: 'Test',
          artist: 'Test artist',
          artworkUrl: artworkUrl1,
        }
      : {
          title: 'Test 2',
          artist: 'Test artist 2',
          artworkUrl: artworkUrl2,
        };
  };

  const setLockScreenOptions = (
    updater: (options?: AudioLockScreenOptions) => AudioLockScreenOptions
  ) => {
    setOptions((currentOptions) => {
      const nextOptions = updater(currentOptions);
      if (isActiveForLockScreen) {
        player.setActiveForLockScreen(true, getMetadata(metadata), nextOptions);
      }
      return nextOptions;
    });
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

  const setVolume = (volume: number) => {
    player.volume = volume;
  };

  const toggleButton = (button: LockScreenButton) => {
    switch (button) {
      case LockScreenButton.SEEK_FORWARD:
        setLockScreenOptions((o) => ({ ...o, showSeekForward: !o?.showSeekForward }));
        break;
      case LockScreenButton.SEEK_BACKWARD:
        setLockScreenOptions((o) => ({ ...o, showSeekBackward: !o?.showSeekBackward }));
        break;
    }
  };

  return (
    <View>
      <HeadingText>{title}</HeadingText>
      <Player
        {...status}
        isLive={status.isLive}
        currentOffsetFromLive={status.currentOffsetFromLive}
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
          title={`${isActiveForLockScreen ? 'Disable' : 'Enable'} Lock Screen controls`}
          onPress={() => {
            const nextActive = !isActiveForLockScreen;
            player.setActiveForLockScreen(nextActive, getMetadata(metadata), options);
            setActiveLockScreenPlayer(nextActive ? title : null);
          }}
        />
        <Text style={styles.statusText}>
          lock screen: {isActiveForLockScreen ? 'active' : 'inactive'}
        </Text>
        <BodyText>Lock screen buttons:</BodyText>
        <View style={styles.optionRow}>
          <Checkbox
            value={options?.showSeekForward}
            onValueChange={() => toggleButton(LockScreenButton.SEEK_FORWARD)}
          />
          <BodyText style={styles.optionsText}>Seek forward</BodyText>
        </View>
        <View style={styles.optionRow}>
          <Checkbox
            value={options?.showSeekBackward}
            onValueChange={() => toggleButton(LockScreenButton.SEEK_BACKWARD)}
          />
          <BodyText style={styles.optionsText}>Seek backward</BodyText>
        </View>
        <View style={styles.optionRow}>
          <Checkbox
            value={options?.isLiveStream ?? false}
            onValueChange={() =>
              setLockScreenOptions((o) => ({ ...o, isLiveStream: !o?.isLiveStream }))
            }
          />
          <BodyText style={styles.optionsText}>Force live stream</BodyText>
        </View>
        <View style={styles.statusInfo}>
          <Text style={styles.statusText}>isLive: {String(status.isLive)}</Text>
          <Text style={styles.statusText}>
            offsetFromLive:{' '}
            {status.currentOffsetFromLive != null
              ? `${status.currentOffsetFromLive.toFixed(1)}s`
              : 'null'}
          </Text>
          <Text style={styles.statusText}>error: {status.error ?? 'null'}</Text>
        </View>
        <Button
          title={`Update Metadata (${metadata === 1 ? 'Test 2' : 'Test'})`}
          disabled={!isActiveForLockScreen}
          onPress={() => {
            const nextMetadata = metadata === 1 ? 2 : 1;
            player.updateLockScreenMetadata(getMetadata(nextMetadata));
            setMetadata(nextMetadata);
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
  optionRow: {
    flexDirection: 'row',

    gap: 10,
  },
  optionsText: {
    fontSize: 16,
    fontWeight: '500',
  },
  statusInfo: {
    backgroundColor: '#f5f5f5',
    padding: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'Courier',
  },
});
