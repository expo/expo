import { useEvent } from 'expo';
import { useVideoPlayer, VideoTrack, VideoView, SubtitleTrack } from 'expo-video';
import React, { useCallback, useRef, useState } from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';

import { bigBuckBunnySource, elephantsDreamSource } from './videoSources';
import { styles } from './videoStyles';
import Button from '../../components/Button';
import ConsoleBox from '../../components/ConsoleBox';
import { E2EKeyValueBox } from '../../components/E2EKeyValueBox';
import { E2EViewShotContainer } from '../../components/E2EViewShotContainer';

const originalSource = bigBuckBunnySource;
const replacementSource = elephantsDreamSource;

export default function VideoEventsScreen() {
  const ref = useRef<VideoView>(null);
  const [currentSource, setCurrentSource] = useState(originalSource);
  const player = useVideoPlayer(originalSource, (player) => {
    player.loop = true;
    player.timeUpdateEventInterval = 0.25;
    player.showNowPlayingNotification = false;
    player.muted = true;
  });
  const timeUpdate = useEvent(player, 'timeUpdate');
  const { status, error } = useEvent(player, 'statusChange', { status: player.status });
  const { isPlaying } = useEvent(player, 'playingChange', { isPlaying: player.playing });
  const { playbackRate } = useEvent(player, 'playbackRateChange', { playbackRate: 1 });
  const { source } = useEvent(player, 'sourceChange', { source: originalSource });
  const { volume } = useEvent(player, 'volumeChange', { volume: 1 });
  const { muted } = useEvent(player, 'mutedChange', { muted: false });
  const loadedMetadata = useEvent(player, 'sourceLoad');
  const { videoTrack } = useEvent(player, 'videoTrackChange', { videoTrack: null });
  const { isExternalPlaybackActive } = useEvent(player, 'isExternalPlaybackActiveChange', {
    isExternalPlaybackActive: false,
    oldIsExternalPlaybackActive: false,
  });

  const sourceObject = typeof source === 'object' ? source : null;

  const toggleSource = useCallback(() => {
    if (currentSource === replacementSource) {
      player.replaceAsync(originalSource);
      setCurrentSource(originalSource);
    } else {
      player.replaceAsync(replacementSource);
      setCurrentSource(replacementSource);
    }
  }, [player, currentSource]);

  const triggerError = useCallback(() => {
    player.replaceAsync('https://example.com/invalid.mp4');
  }, [player]);

  const toggleMute = useCallback(() => {
    player.muted = !player.muted;
  }, [player]);

  const toggleVolume = useCallback(() => {
    player.volume = Math.abs(player.volume - 1);
  }, [player]);

  const currentTime = Math.round((timeUpdate?.currentTime ?? 0) * 100) / 100;

  return (
    <View style={styles.contentContainer}>
      <E2EViewShotContainer
        testID="video-view"
        mode="keep-originals"
        screenshotOutputPath="expo-video">
        <VideoView ref={ref} player={player} style={styles.video} />
      </E2EViewShotContainer>

      <ScrollView
        style={styles.controlsContainer}
        contentContainerStyle={{ alignItems: 'center', padding: 10 }}>
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
          <Button
            style={styles.button}
            title="Seek to 30s"
            onPress={() => {
              player.currentTime = 30;
            }}
          />
        </View>
        <View style={styles.row}>
          <Button style={styles.button} title="Toggle Source" onPress={toggleSource} />
          <Button style={styles.button} title="Trigger an Error" onPress={triggerError} />
        </View>
        <View style={styles.row}>
          <Button style={styles.button} title="Toggle mute" onPress={toggleMute} />
          <Button style={styles.button} title="Change Volume" onPress={toggleVolume} />
        </View>

        <E2EKeyValueBox
          title="e2e verified params"
          style={myStyles.metadataContainer}
          entries={{
            source: sourceObject?.metadata?.title ?? 'No title',
            isPlaying,
            isAtStart: currentTime === 0,
            duration: Math.round(loadedMetadata?.duration ?? 0),
            currentTime: Math.round((timeUpdate?.currentTime ?? 0) * 100) / 100,

            mimeType: videoTrack?.mimeType,
            isSupported: videoTrack?.isSupported,
            bitratePositive: (videoTrack?.bitrate ?? 0) > 0,
            volume,
            status,
            playbackRate,
            error: !!error?.message,
          }}
        />

        <Text style={styles.switchTitle}>Playback:</Text>
        <ConsoleBox style={myStyles.metadataContainer}>
          Buffered to: {Math.round((timeUpdate?.bufferedPosition ?? 0) * 100) / 100} {'\n'}
          Volume: {volume} {'\n'}
          Is Muted: {String(muted)} {'\n'}
          Is external playback active: {String(isExternalPlaybackActive)} {'\n'}
          {error && 'Error: ' + error.message} {'\n'}
          Current Video track: {'{\n'}
          {`\tid: "${videoTrack?.id}",\n`}
          {`\tsize: "${videoTrack?.size.width}x${videoTrack?.size.height}",\n`}
          {`\tbitrate: ${videoTrack?.bitrate}\n`}
          {`\tframe rate: ${videoTrack?.frameRate}\n`}
          {`}`}
        </ConsoleBox>

        <Text style={styles.switchTitle}>Tracks:</Text>
        <ConsoleBox style={myStyles.metadataContainer}>
          Available Video Tracks: {videoTracksToString(loadedMetadata?.availableVideoTracks)}
          {'\n\n'}
          Available Subtitle Tracks:
          {subtitleTracksToString(loadedMetadata?.availableSubtitleTracks)}
        </ConsoleBox>
      </ScrollView>
    </View>
  );
}

function videoTracksToString(tracks?: VideoTrack[]) {
  let result = '[';
  for (const track of tracks ?? []) {
    result += ` \n\t{size: "${track.size.width}x${track.size.height}", bitrate: ${track.bitrate}}, mimeType: "${track.mimeType}", isSupported: ${track.isSupported}, id: "${track?.id}"`;
  }
  return result + ' \n]';
}

function subtitleTracksToString(tracks?: SubtitleTrack[]) {
  let result = '[';
  for (const track of tracks ?? []) {
    result += ` \n\t{id: "${track.id}", language: "${track.language}", label: "${track.label}"}`;
  }
  return result + '\n]';
}

const myStyles = StyleSheet.create({
  metadataContainer: {
    alignSelf: 'stretch',
  },
});
