import { Ionicons } from '@expo/vector-icons';
import { useAudioPlayer, AudioSource, useAudioPlayerStatus } from 'expo-audio';
import React, { useState } from 'react';
import {
  StyleProp,
  ViewStyle,
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';

import { JsiAudioBar } from './JsiAudioBar';
import Player from './Player';

type AudioPlayerProps = {
  source: AudioSource | string | number;
  style?: StyleProp<ViewStyle>;
};

const localSource = require('../../../../assets/sounds/polonez.mp3');
const testAssets = [
  localSource,
  null,
  'https://p.scdn.co/mp3-preview/f7a8ab9c5768009b65a30e9162555e8f21046f46?cid=162b7dc01f3a4a2ca32ed3cec83d1e02',
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
  const player = useAudioPlayer(source);
  const status = useAudioPlayerStatus(player);
  const [queueItems, setQueueItems] = useState<AudioSource[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);

  console.log(player.currentQueueIndex);

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

  const setQueue = () => {
    console.log('Setting queue with sources:', JSON.stringify(testAssets));
    player?.setQueue(testAssets);
  };

  const renderTrackName = (item: AudioSource) => {
    if (typeof item === 'string') {
      return item.split('/').pop();
    }
    if (item && typeof item === 'object' && item.uri) {
      return item.uri.toString().split('/').pop();
    }
    return 'Unknown Track';
  };

  return (
    <View style={styles.container}>
      <View style={styles.queueContainer}>
        <View style={styles.queueHeader}>
          <Text style={styles.queueTitle}>Queue</Text>
          <TouchableOpacity style={styles.setQueueButton} onPress={setQueue}>
            <Text style={styles.setQueueButtonText}>Set Queue</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.queueList}>
          {queueItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.queueItem, index === currentIndex && styles.activeQueueItem]}
              onPress={() => player?.skipToQueueIndex(index)}>
              <View style={styles.trackInfo}>
                {index === currentIndex && (
                  <Ionicons
                    name={status.playing ? 'play-circle' : 'pause-circle'}
                    size={24}
                    color="#007AFF"
                    style={styles.playingIcon}
                  />
                )}
                <Text
                  style={[styles.trackName, index === currentIndex && styles.activeTrackName]}
                  numberOfLines={1}>
                  {renderTrackName(item)}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => player?.removeFromQueue([item])}>
                <Ionicons name="close-circle-outline" size={24} color="#FF3B30" />
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity style={styles.controlButton} onPress={() => player?.skipToPrevious()}>
          <Ionicons name="play-skip-back" size={24} color="#007AFF" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlButton, styles.playPauseButton]}
          onPress={() => (status.playing ? player?.pause() : player?.play())}>
          <Ionicons name={status.playing ? 'pause' : 'play'} size={32} color="#007AFF" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.controlButton} onPress={() => player?.skipToNext()}>
          <Ionicons name="play-skip-forward" size={24} color="#007AFF" />
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
        replay={() => player.seekTo(0)}
        setPosition={(position: number) => player.seekTo(position)}
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
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  queueContainer: {
    flex: 1,
    padding: 16,
  },
  queueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  queueTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  setQueueButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  setQueueButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  queueList: {
    flex: 1,
  },
  queueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  activeQueueItem: {
    backgroundColor: '#F2F2F7',
  },
  trackInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  playingIcon: {
    marginRight: 8,
  },
  trackName: {
    fontSize: 16,
    color: '#000',
    flex: 1,
  },
  activeTrackName: {
    color: '#007AFF',
    fontWeight: '600',
  },
  removeButton: {
    padding: 4,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  controlButton: {
    padding: 12,
  },
  playPauseButton: {
    marginHorizontal: 24,
  },
});
