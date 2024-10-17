import { useEvent } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';
import React, { useCallback, useRef, useState } from 'react';
import { ScrollView, View, Text, TextProps } from 'react-native';

import { bigBuckBunnySource, elephantsDreamSource } from './videoSources';
import { styles } from './videoStyles';
import Button from '../../components/Button';

const MediumText = (props: TextProps) => {
  return <Text style={styles.mediumText} {...props} />;
};

export default function VideoEventsScreen() {
  const ref = useRef<VideoView>(null);
  const [currentSource, setCurrentSource] = useState(bigBuckBunnySource);
  const player = useVideoPlayer(bigBuckBunnySource, (player) => {
    player.loop = true;
    player.timeUpdateEventInterval = 0.25;
    player.showNowPlayingNotification = false;
    player.play();
  });
  const timeUpdate = useEvent(player, 'timeUpdate');
  const { status, error } = useEvent(player, 'statusChange', { status: player.status });
  const { isPlaying } = useEvent(player, 'playingChange', { isPlaying: player.playing });
  const { playbackRate } = useEvent(player, 'playbackRateChange', { playbackRate: 1 });
  const { source } = useEvent(player, 'sourceChange', { source: bigBuckBunnySource });
  const { volume } = useEvent(player, 'volumeChange', { volume: 1 });
  const { muted } = useEvent(player, 'mutedChange', { muted: false });
  const sourceObject = typeof source === 'object' ? source : null;

  const toggleSource = useCallback(() => {
    if (currentSource === bigBuckBunnySource) {
      player.replace(elephantsDreamSource);
      setCurrentSource(elephantsDreamSource);
    } else {
      player.replace(bigBuckBunnySource);
      setCurrentSource(bigBuckBunnySource);
    }
  }, [player, currentSource]);

  const triggerError = useCallback(() => {
    player.replace('https://example.com/invalid.mp4');
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
        <MediumText>Is playing: {isPlaying ? 'true' : 'false'}</MediumText>
        <MediumText>
          Current time: {Math.round((timeUpdate?.currentTime ?? 0) * 100) / 100}
        </MediumText>
        <MediumText>
          Buffered to: {Math.round((timeUpdate?.bufferedPosition ?? 0) * 100) / 100}
        </MediumText>
        <MediumText>Volume: {volume}</MediumText>
        <MediumText>Is Muted: {muted ? 'true' : 'false'}</MediumText>
        <MediumText>Status: {JSON.stringify(status)}</MediumText>
        {error && <MediumText>Error: {error.message}</MediumText>}
        <MediumText style={styles.mediumText}>Playback rate: {playbackRate}</MediumText>
        <MediumText>Source: {sourceObject?.metadata?.title ?? 'No metadata'}</MediumText>
      </ScrollView>
    </View>
  );
}
