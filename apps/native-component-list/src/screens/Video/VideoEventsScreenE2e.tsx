import { useEvent } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';
import React, { useCallback, useRef } from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';

import { hlsSource } from './videoSources';
import { styles } from './videoStyles';
import Button from '../../components/Button';
import ConsoleBox from '../../components/ConsoleBox';

export default function VideoEventsScreen() {
  const ref = useRef<VideoView>(null);
  const player = useVideoPlayer(hlsSource, (player) => {
    player.loop = true;
    player.timeUpdateEventInterval = 0.25;
    player.showNowPlayingNotification = false;
    player.muted = true;
  });
  const timeUpdate = useEvent(player, 'timeUpdate');
  const { status, error } = useEvent(player, 'statusChange', { status: player.status });
  const { isPlaying } = useEvent(player, 'playingChange', { isPlaying: player.playing });
  const { playbackRate } = useEvent(player, 'playbackRateChange', { playbackRate: 1 });
  const { source } = useEvent(player, 'sourceChange', { source: hlsSource });
  const { volume } = useEvent(player, 'volumeChange', { volume: 1 });
  // const { muted } = useEvent(player, 'mutedChange', { muted: false });
  const loadedMetadata = useEvent(player, 'sourceLoad');
  const { videoTrack } = useEvent(player, 'videoTrackChange', { videoTrack: null });
  const { isExternalPlaybackActive } = useEvent(player, 'isExternalPlaybackActiveChange', {
    isExternalPlaybackActive: false,
    oldIsExternalPlaybackActive: false,
  });

  const sourceObject = typeof source === 'object' ? source : null;

  const triggerError = useCallback(() => {
    player.replaceAsync('https://example.com/invalid.mp4');
  }, [player]);

  const currentTime = Math.round((timeUpdate?.currentTime ?? 0) * 100) / 100;
  return (
    <View style={styles.contentContainer}>
      <VideoView ref={ref} player={player} style={styles.video} />
      <ScrollView style={styles.controlsContainer} contentContainerStyle={{ alignItems: 'center' }}>
        <View style={styles.row}>
          <Button
            style={styles.button}
            title={isPlaying ? 'Pause' : 'Play'}
            onPress={() => {
              if (isPlaying) {
                player.pause();
              } else {
                player.play();
              }
            }}
          />
          <Button style={styles.button} title="Trigger an Error" onPress={triggerError} />
        </View>

        <Text style={styles.switchTitle}>Static properties:</Text>
        <Text style={styles.switchTitle}>duration: {String(loadedMetadata?.duration)}</Text>
        <ConsoleBox style={myStyles.metadataContainer}>
          Source: {sourceObject?.metadata?.title ?? 'No title'} {'\n'}
          Current Video track:{' '}
          {JSON.stringify(
            {
              // id: videoTrack?.id,
              mimeType: videoTrack?.mimeType,
              isSupported: videoTrack?.isSupported,
              // size: videoTrack?.size ? `${videoTrack.size.width}x${videoTrack.size.height}` : null,
              // bitrate: videoTrack?.bitrate, // can vary
              frameRate: videoTrack?.frameRate,
            },
            null,
            2
          )}
        </ConsoleBox>
        <Text style={styles.switchTitle}>Playback:</Text>
        <ConsoleBox style={myStyles.metadataContainer}>
          Is playing: {String(isPlaying)} {'\n'}
          isAtStart: {String(currentTime === 0)} {'\n'}
          Volume: {volume} {'\n'}
          Is Muted: {false} {'\n'}{' '}
          {/* muted is false now cuz we use build output from other action run */}
          Status: {status} {'\n'}
          Playback rate: {playbackRate} {'\n'}
          Is external playback active: {String(isExternalPlaybackActive)} {'\n'}
          {'Error: ' + String(!!error?.message)} {'\n'}
        </ConsoleBox>
      </ScrollView>
    </View>
  );
}

const myStyles = StyleSheet.create({
  metadataContainer: {
    alignSelf: 'stretch',
  },
});
