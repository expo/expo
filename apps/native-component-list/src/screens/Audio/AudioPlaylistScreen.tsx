import { AudioSource, useAudioPlaylist, useAudioPlaylistStatus } from 'expo-audio';
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';

import HeadingText from '../../components/HeadingText';
import Colors from '../../constants/Colors';

const INITIAL_SOURCES: AudioSource[] = [
  require('../../../assets/sounds/polonez.mp3'),
  {
    uri: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    name: 'Song 1',
  },
  {
    uri: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    name: 'Song 2',
  },
];

const ADDITIONAL_SOURCES: AudioSource[] = [
  { uri: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3', name: 'Song 4' },
  { uri: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3', name: 'Song 5' },
];

function getTrackName(uri: string): string {
  const filename = uri.split('/').pop()?.split('?')[0] ?? 'Unknown';
  return filename.replace(/\.[^/.]+$/, '');
}

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function Button({
  title,
  onPress,
  disabled,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[styles.button, disabled && styles.buttonDisabled]}>
      <Text style={[styles.buttonText, disabled && styles.buttonTextDisabled]}>{title}</Text>
    </Pressable>
  );
}

export default function AudioPlaylistScreen() {
  const [addTrackIndex, setAddTrackIndex] = useState(0);

  const playlist = useAudioPlaylist({
    sources: INITIAL_SOURCES,
    loop: 'none',
    updateInterval: 250,
  });

  const status = useAudioPlaylistStatus(playlist);

  const sources = playlist.sources ?? [];
  const currentSource = sources[status.currentIndex];
  const currentTrackName = currentSource
    ? (currentSource.name ?? getTrackName(currentSource.uri ?? ''))
    : 'No track';

  const handleAddTrack = () => {
    const sourceToAdd = ADDITIONAL_SOURCES[addTrackIndex % ADDITIONAL_SOURCES.length];
    playlist.add(sourceToAdd);
    setAddTrackIndex((prev) => prev + 1);
  };

  const handleClear = () => {
    playlist.clear();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.trackInfo}>
        <Text style={styles.trackTitle}>{currentTrackName}</Text>
        <Text style={styles.trackIndex}>
          Track {status.currentIndex + 1} of {status.trackCount}
        </Text>
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${status.duration > 0 ? (status.currentTime / status.duration) * 100 : 0}%`,
              },
            ]}
          />
        </View>
        <View style={styles.timeContainer}>
          <Text style={styles.timeText}>{formatTime(status.currentTime)}</Text>
          <Text style={styles.timeText}>{formatTime(status.duration)}</Text>
        </View>
      </View>

      <View style={styles.controls}>
        <Button
          title="Prev"
          onPress={() => playlist.previous()}
          disabled={sources.length === 0 || (status.currentIndex === 0 && status.loop !== 'all')}
        />
        <Button
          title={status.playing ? 'Pause' : 'Play'}
          onPress={() => (status.playing ? playlist.pause() : playlist.play())}
          disabled={sources.length === 0}
        />
        <Button
          title="Next"
          onPress={() => playlist.next()}
          disabled={
            sources.length === 0 ||
            (status.currentIndex >= sources.length - 1 && status.loop !== 'all')
          }
        />
      </View>

      <HeadingText>Playlist ({sources.length} tracks)</HeadingText>
      <View style={styles.playlistTracks}>
        {sources.length === 0 ? (
          <Text style={styles.emptyPlaylist}>Playlist is empty</Text>
        ) : (
          sources.map((source, index) => (
            <Pressable
              key={`${source.uri}-${index}`}
              style={[styles.trackItem, index === status.currentIndex && styles.trackItemActive]}
              onPress={() => playlist.skipTo(index)}>
              <Text
                style={[
                  styles.trackItemText,
                  index === status.currentIndex && styles.trackItemTextActive,
                ]}>
                {index + 1}. {source.name ?? getTrackName(source.uri ?? '')}
              </Text>
              {index === status.currentIndex && <Text style={styles.nowPlaying}>Now Playing</Text>}
            </Pressable>
          ))
        )}
      </View>

      <HeadingText>Loop Mode</HeadingText>
      <View style={styles.loopControls}>
        <Button
          title="None"
          onPress={() => playlist.setLoopMode('none')}
          disabled={status.loop === 'none'}
        />
        <Button
          title="Single"
          onPress={() => playlist.setLoopMode('single')}
          disabled={status.loop === 'single'}
        />
        <Button
          title="All"
          onPress={() => playlist.setLoopMode('all')}
          disabled={status.loop === 'all'}
        />
      </View>

      <HeadingText>Status</HeadingText>
      <View style={styles.statusContainer}>
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Playing</Text>
          <Text style={styles.statusValue}>{`${status.playing}`}</Text>
        </View>
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Buffering</Text>
          <Text style={styles.statusValue}>{`${status.isBuffering}`}</Text>
        </View>
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Loaded</Text>
          <Text style={styles.statusValue}>{`${status.isLoaded}`}</Text>
        </View>
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Loop</Text>
          <Text style={styles.statusValue}>{status.loop}</Text>
        </View>
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Volume</Text>
          <Text style={styles.statusValue}>{(status.volume * 100).toFixed(0)}%</Text>
        </View>
      </View>

      <HeadingText>Playlist Management</HeadingText>
      <View style={styles.controls}>
        <Button title="Add Track" onPress={handleAddTrack} />
        <Button title="Clear" onPress={handleClear} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 10,
    gap: 10,
  },
  trackInfo: {
    alignItems: 'center',
    marginBottom: 20,
  },
  trackTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  trackIndex: {
    fontSize: 14,
    color: Colors.secondaryText,
  },
  progressContainer: {
    marginBottom: 20,
  },
  progressBar: {
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.tintColor,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  timeText: {
    fontSize: 12,
    color: Colors.secondaryText,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 20,
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: Colors.tintColor,
    borderRadius: 8,
  },
  buttonDisabled: {
    backgroundColor: Colors.disabled,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
  buttonTextDisabled: {
    color: Colors.secondaryText,
  },
  playlistTracks: {
    marginBottom: 20,
  },
  emptyPlaylist: {
    textAlign: 'center',
    color: Colors.disabled,
    paddingVertical: 20,
  },
  trackItem: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  trackItemActive: {
    backgroundColor: Colors.greyBackground,
  },
  trackItemText: {
    fontSize: 16,
  },
  trackItemTextActive: {
    fontWeight: '600',
    color: Colors.tintColor,
  },
  nowPlaying: {
    fontSize: 12,
    color: Colors.tintColor,
  },
  loopControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 20,
  },
  statusContainer: {
    backgroundColor: Colors.greyBackground,
    borderRadius: 8,
    marginBottom: 20,
    overflow: 'hidden',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  statusLabel: {
    fontSize: 14,
    color: Colors.secondaryText,
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '600',
  },
});
