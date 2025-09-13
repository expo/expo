import { useEvent } from 'expo';
import { useVideoPlayer, VideoTrack, VideoView, SubtitleTrack } from 'expo-video';
import React, { useCallback, useRef, useState } from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';

import { bigBuckBunnySource, hlsSource } from './videoSources';
import { styles } from './videoStyles';
import Button from '../../components/Button';
import ConsoleBox from '../../components/ConsoleBox';

export default function VideoEventsScreen() {
  const ref = useRef<VideoView>(null);
  const [currentSource, setCurrentSource] = useState(hlsSource);
  const player = useVideoPlayer(hlsSource, (player) => {
    player.loop = true;
    player.timeUpdateEventInterval = 0.25;
    player.showNowPlayingNotification = false;
    player.muted = true;
    player.play();
  });
  const timeUpdate = useEvent(player, 'timeUpdate');
  const { status, error } = useEvent(player, 'statusChange', { status: player.status });
  const { isPlaying } = useEvent(player, 'playingChange', { isPlaying: player.playing });
  const { playbackRate } = useEvent(player, 'playbackRateChange', { playbackRate: 1 });
  const { source } = useEvent(player, 'sourceChange', { source: hlsSource });
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
    if (currentSource === bigBuckBunnySource) {
      player.replaceAsync(hlsSource);
      setCurrentSource(hlsSource);
    } else {
      player.replaceAsync(bigBuckBunnySource);
      setCurrentSource(bigBuckBunnySource);
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

  return (
    <View style={styles.contentContainer}>
      <VideoView ref={ref} player={player} style={styles.video} />
      <ScrollView style={styles.controlsContainer} contentContainerStyle={{ alignItems: 'center' }}>
        <View style={styles.row}>
          <Button style={styles.button} title="Toggle Source" onPress={toggleSource} />
          <Button style={styles.button} title="Trigger an Error" onPress={triggerError} />
        </View>
        <View style={styles.row}>
          <Button style={styles.button} title="Toggle mute" onPress={toggleMute} />
          <Button style={styles.button} title="Change Volume" onPress={toggleVolume} />
        </View>

        <Text style={styles.switchTitle}>Playback:</Text>
        <ConsoleBox style={myStyles.metadataContainer}>
          Source: {sourceObject?.metadata?.title ?? 'No title'} {'\n'}
          Duration: {loadedMetadata?.duration ?? 'Unknown'} {'\n'}
          Is playing: {isPlaying ? 'true' : 'false'} {'\n'}
          Current time: {Math.round((timeUpdate?.currentTime ?? 0) * 100) / 100} {'\n'}
          Buffered to: {Math.round((timeUpdate?.bufferedPosition ?? 0) * 100) / 100} {'\n'}
          Volume: {volume} {'\n'}
          Is Muted: {muted ? 'true' : 'false'} {'\n'}
          Status: {status} {'\n'}
          Playback rate: {playbackRate} {'\n'}
          Is external playback active: {isExternalPlaybackActive ? 'true' : 'false'} {'\n'}
          {error && 'Error: ' + error.message} {'\n'}
          Current Video track: {'{\n'}
          {`\tid: "${videoTrack?.id}",\n`}
          {`\tmimeType: "${videoTrack?.mimeType}",\n`}
          {`\tisSupported: ${videoTrack?.isSupported},\n`}
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
