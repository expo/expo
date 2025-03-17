import { useAudioPlayer, AudioSource, useAudioPlayerStatus } from 'expo-audio';
import React from 'react';
import { StyleProp, ViewStyle, View, TouchableOpacity, Text, StyleSheet } from 'react-native';

import { JsiAudioBar } from './JsiAudioBar';
import Player from './Player';

type AudioPlayerProps = {
  source: AudioSource | string | number;
  style?: StyleProp<ViewStyle>;
};

const localSource = require('../../../../assets/sounds/polonez.mp3');
const remoteSource =
  'https://p.scdn.co/mp3-preview/f7a8ab9c5768009b65a30e9162555e8f21046f46?cid=162b7dc01f3a4a2ca32ed3cec83d1e02';

const testAssets = [
  localSource,
  null,
  'https://d2518709tqai8z.cloudfront.net/audios/2ed772c1-70a7-4cef-b4af-73923321998b.mp3',
  {
    uri: 'https://d2518709tqai8z.cloudfront.net/audios/2ed772c1-70a7-4cef-b4af-73923321998b.mp3',
  },
  {
    uri: 'https://d2518709tqai8z.cloudfront.net/audios/b75223d8-4314-4e8c-b027-fa28d51aba0e.mp3',
  },
  {
    uri: 'https://d2518709tqai8z.cloudfront.net/audios/7f36e472-5150-416b-91fa-fdce309faaee.mp3',
  },
  {
    uri: 'https://d2518709tqai8z.cloudfront.net/audios/90d3ba5f-15c1-439c-8c5d-8dcf6558b2a4.mp3',
  },
  {
    uri: 'https://d2518709tqai8z.cloudfront.net/audios/a2f28309-d15e-4cfe-9082-0002e8eeac72.mp3',
  },
  {
    uri: 'https://d2518709tqai8z.cloudfront.net/audios/b2921d27-cc48-4129-8527-92ca4873b3b0.mp3',
  },
  {
    uri: 'https://d2518709tqai8z.cloudfront.net/audios/fdedfbf2-cbba-47ae-b4b0-e0dd8919e38f.mp3',
  },
  {
    uri: 'https://d2518709tqai8z.cloudfront.net/audios/76376504-81b8-49b4-9b1e-e26f72a8fd66.mp3',
  },
  {
    uri: 'https://d2518709tqai8z.cloudfront.net/audios/3141f178-29c5-43f5-ac0f-fe76dd5915c7.mp3',
  },
  {
    uri: 'https://d2518709tqai8z.cloudfront.net/audios/fd0d946e-0e78-44b9-b8f4-1f24cc2bb118.mp3',
  },
];

export default function AudioQueuePlayer({ source, style }: AudioPlayerProps) {
  const [currentSource, setCurrentSource] = React.useState(source);
  const player = useAudioPlayer(source);
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

  const setQueue = () => {
    console.log('Setting queue with sources:', JSON.stringify(testAssets));
    player?.setQueue(testAssets);
  };

  const getQueueInfo = () => {
    console.log('Queue info:', JSON.stringify(player?.currentQueue));
    console.log('Current queue index:', player?.currentQueueIndex);
  };

  const addTracksToQueue = () => {
    player?.addToQueue(
      [
        'https://d2518709tqai8z.cloudfront.net/audios/fd0d946e-0e78-44b9-b8f4-1f24cc2bb118.mp3',
        'https://d2518709tqai8z.cloudfront.net/audios/fd0d946e-0e78-44b9-b8f4-1f24cc2bb118.mp3',
      ],
      0
    );
    console.log('Added tracks to queue');
  };

  const removeFromQueue = () => {
    player?.removeFromQueue([
      'https://d2518709tqai8z.cloudfront.net/audios/fd0d946e-0e78-44b9-b8f4-1f24cc2bb118.mp3',
    ]);
    console.log('Removed track from queue');
  };

  const skipToNext = () => {
    player?.skipToNext();
    console.log('Skipped to next track');
  };

  const skipToPrevious = () => {
    player?.skipToPrevious();
    console.log('Skipped to previous track');
  };

  const skipToIndex = () => {
    player?.skipToQueueIndex(0);
    console.log('Skipped to index 0');
  };

  return (
    <View>
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={setQueue}>
          <Text style={styles.buttonText}>1</Text>
          <Text style={styles.buttonLabel}>Set Queue</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={addTracksToQueue}>
          <Text style={styles.buttonText}>2</Text>
          <Text style={styles.buttonLabel}>Add to Queue</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={removeFromQueue}>
          <Text style={styles.buttonText}>3</Text>
          <Text style={styles.buttonLabel}>Remove</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={skipToNext}>
          <Text style={styles.buttonText}>4</Text>
          <Text style={styles.buttonLabel}>Next</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={skipToPrevious}>
          <Text style={styles.buttonText}>5</Text>
          <Text style={styles.buttonLabel}>Previous</Text>
        </TouchableOpacity>
      </View>
      <Player
        {...status}
        audioPan={0}
        volume={player.volume}
        style={style}
        play={() => player.play()}
        pause={() => player.pause()}
        replace={() => setQueue()}
        replay={() => {
          getQueueInfo();
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
    </View>
  );
}

const styles = StyleSheet.create({
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 5,
  },
  buttonText: {
    fontSize: 18,
    color: '#fff',
  },
  buttonLabel: {
    fontSize: 12,
    color: '#fff',
  },
});
