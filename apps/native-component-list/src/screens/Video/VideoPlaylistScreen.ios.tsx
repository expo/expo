import {
  useVideoPlaylist,
  useVideoPlaylistStatus,
  VideoPlaylistSource,
  VideoView,
} from 'expo-video';
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  bigBuckBunnySource,
  elephantsDreamSource,
  forBiggerBlazesSource,
  hlsSource,
  localVideoSource,
} from './videoSources';
import { styles as videoStyles } from './videoStyles';
import Button from '../../components/Button';
import HeadingText from '../../components/HeadingText';

type PlaylistItem = {
  id: string;
  title: string;
  source: Extract<VideoPlaylistSource, { source: unknown }>;
};

const INITIAL_ITEMS: PlaylistItem[] = [
  { id: 'local', title: 'Cute Doggo (local)', source: { id: 'local', source: localVideoSource } },
  { id: 'bunny', title: 'Big Buck Bunny', source: { id: 'bunny', source: bigBuckBunnySource } },
  {
    id: 'elephants',
    title: 'Elephants Dream',
    source: { id: 'elephants', source: elephantsDreamSource },
  },
];

const EXTRA_ITEMS: PlaylistItem[] = [
  {
    id: 'blazes',
    title: 'For Bigger Blazes',
    source: { id: 'blazes', source: forBiggerBlazesSource },
  },
  { id: 'hls', title: 'Tears Of Steel (HLS)', source: { id: 'hls', source: hlsSource } },
];

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || isNaN(seconds)) {
    return '0:00';
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export default function VideoPlaylistScreen() {
  const [items, setItems] = useState(INITIAL_ITEMS);
  const [nextExtraIndex, setNextExtraIndex] = useState(0);

  const initialSources = useMemo(() => INITIAL_ITEMS.map((item) => item.source), []);
  const playlist = useVideoPlaylist({
    sources: initialSources,
    loop: 'all',
    preloadNext: true,
    updateInterval: 250,
  });
  const status = useVideoPlaylistStatus(playlist);

  const currentItem = items[status.currentIndex];
  const progress =
    status.duration > 0 ? Math.min((status.currentTime / status.duration) * 100, 100) : 0;

  const addSource = () => {
    const extraItem = EXTRA_ITEMS[nextExtraIndex % EXTRA_ITEMS.length];
    const itemToAdd = {
      ...extraItem,
      id: `${extraItem.id}-${nextExtraIndex}`,
      source: {
        ...extraItem.source,
        id: `${extraItem.id}-${nextExtraIndex}`,
      },
    };
    playlist.add(itemToAdd.source);
    setItems((items) => [...items, itemToAdd]);
    setNextExtraIndex((index) => index + 1);
  };

  const insertAfterCurrent = () => {
    const extraItem = EXTRA_ITEMS[nextExtraIndex % EXTRA_ITEMS.length];
    const insertIndex = Math.min(status.currentIndex + 1, items.length);
    const itemToInsert = {
      ...extraItem,
      id: `${extraItem.id}-insert-${nextExtraIndex}`,
      source: {
        ...extraItem.source,
        id: `${extraItem.id}-insert-${nextExtraIndex}`,
      },
    };
    playlist.insert(itemToInsert.source, insertIndex);
    setItems((items) => [
      ...items.slice(0, insertIndex),
      itemToInsert,
      ...items.slice(insertIndex),
    ]);
    setNextExtraIndex((index) => index + 1);
  };

  const removeCurrent = async () => {
    if (items.length === 0) {
      return;
    }
    const indexToRemove = status.currentIndex;
    await playlist.remove(indexToRemove);
    setItems((items) => items.filter((_, index) => index !== indexToRemove));
  };

  const clear = () => {
    playlist.clear();
    setItems([]);
  };

  const reset = async () => {
    await playlist.replaceAll(
      INITIAL_ITEMS.map((item) => item.source),
      { preserveCurrentSource: false }
    );
    setItems(INITIAL_ITEMS);
    setNextExtraIndex(0);
  };

  const replaceAndPreserveCurrent = async () => {
    const replacementItems = [
      {
        id: 'intro',
        title: 'For Bigger Blazes',
        source: { id: 'intro', source: forBiggerBlazesSource },
      },
      ...INITIAL_ITEMS,
      {
        id: 'hls-preserved',
        title: 'Tears Of Steel (HLS)',
        source: { id: 'hls-preserved', source: hlsSource },
      },
    ];
    await playlist.replaceAll(
      replacementItems.map((item) => item.source),
      { preserveCurrentSource: true }
    );
    setItems(replacementItems);
  };

  return (
    <View style={videoStyles.contentContainer}>
      <VideoView
        player={playlist.player}
        style={videoStyles.video}
        nativeControls
        allowsVideoFrameAnalysis={false}
      />
      <ScrollView
        style={videoStyles.controlsContainer}
        contentContainerStyle={screenStyles.content}>
        <View style={screenStyles.trackInfo}>
          <Text style={screenStyles.trackTitle}>{currentItem?.title ?? 'Playlist is empty'}</Text>
          <Text style={screenStyles.subtleText}>
            Source {items.length === 0 ? 0 : status.currentIndex + 1} of {status.sourceCount}
          </Text>
        </View>

        <View style={screenStyles.progressBar}>
          <View style={[screenStyles.progressFill, { width: `${progress}%` }]} />
        </View>
        <View style={screenStyles.timeRow}>
          <Text style={screenStyles.subtleText}>{formatTime(status.currentTime)}</Text>
          <Text style={screenStyles.subtleText}>{formatTime(status.duration)}</Text>
        </View>

        <View style={videoStyles.row}>
          <Button
            style={videoStyles.button}
            title="Previous"
            disabled={!status.canPlayPrevious}
            onPress={() => playlist.previous()}
          />
          <Button
            style={videoStyles.button}
            title={status.playing ? 'Pause' : 'Play'}
            disabled={status.sourceCount === 0}
            onPress={() => (status.playing ? playlist.pause() : playlist.play())}
          />
          <Button
            style={videoStyles.button}
            title="Next"
            disabled={!status.canPlayNext}
            onPress={() => playlist.next()}
          />
        </View>

        <View style={videoStyles.row}>
          <Button
            style={videoStyles.button}
            title="Seek 10s"
            disabled={status.sourceCount === 0}
            onPress={() => playlist.seekTo(10)}
          />
          <Button
            style={videoStyles.button}
            title="Replay"
            disabled={status.sourceCount === 0}
            onPress={() => playlist.seekTo(0)}
          />
        </View>

        <HeadingText>Playlist</HeadingText>
        <View style={screenStyles.playlist}>
          {items.length === 0 ? (
            <Text style={screenStyles.emptyText}>No sources</Text>
          ) : (
            items.map((item, index) => (
              <Button
                key={item.id}
                style={screenStyles.trackButton}
                buttonStyle={
                  index === status.currentIndex
                    ? screenStyles.activeTrackButtonInner
                    : screenStyles.trackButtonInner
                }
                title={`${index + 1}. ${item.title}`}
                onPress={() => playlist.skipTo(index)}
              />
            ))
          )}
        </View>

        <HeadingText>Playlist Management</HeadingText>
        <View style={videoStyles.row}>
          <Button style={videoStyles.button} title="Add" onPress={addSource} />
          <Button
            style={videoStyles.button}
            title="Insert after current"
            onPress={insertAfterCurrent}
          />
        </View>
        <View style={videoStyles.row}>
          <Button
            style={videoStyles.button}
            title="Remove current"
            disabled={items.length === 0}
            onPress={removeCurrent}
          />
          <Button
            style={videoStyles.button}
            title="Clear"
            disabled={items.length === 0}
            onPress={clear}
          />
        </View>
        <View style={videoStyles.row}>
          <Button style={videoStyles.button} title="Reset" onPress={reset} />
          <Button
            style={videoStyles.button}
            title="Replace preserve"
            disabled={items.length === 0}
            onPress={replaceAndPreserveCurrent}
          />
        </View>

        <HeadingText>Status</HeadingText>
        <View style={screenStyles.statusBox}>
          <Text>Status: {status.status}</Text>
          <Text>Loop: {status.loop}</Text>
          <Text>Buffering: {String(status.isBuffering)}</Text>
          <Text>Loaded: {String(status.isLoaded)}</Text>
          <Text>Did just finish: {String(status.didJustFinish)}</Text>
          <Text>Error: {status.error?.message ?? 'none'}</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const screenStyles = StyleSheet.create({
  content: {
    alignItems: 'stretch',
    padding: 12,
  },
  trackInfo: {
    alignItems: 'center',
    marginBottom: 12,
  },
  trackTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  subtleText: {
    color: '#666',
    fontSize: 12,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ddd',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4630eb',
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
    marginBottom: 10,
  },
  playlist: {
    gap: 6,
  },
  emptyText: {
    color: '#666',
    textAlign: 'center',
  },
  trackButton: {
    alignItems: 'stretch',
  },
  trackButtonInner: {
    alignItems: 'flex-start',
    backgroundColor: '#666',
  },
  activeTrackButtonInner: {
    alignItems: 'flex-start',
    backgroundColor: '#1b7f3a',
  },
  statusBox: {
    gap: 4,
    padding: 10,
    borderRadius: 4,
    backgroundColor: '#eee',
  },
});
