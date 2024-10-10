import { useEvent } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView, View, Text, TextProps } from 'react-native';

import { bigBuckBunnySource, elephantsDreamSource } from './videoSources';
import { styles } from './videoStyles';
import Button from '../../components/Button';

const MediumText = (props: TextProps) => {
  return <Text style={styles.mediumText} {...props} />;
};
export default function VideoEventsScreen() {
  const ref = useRef<VideoView>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentSource, setCurrentSource] = useState(bigBuckBunnySource);

  const player = useVideoPlayer(bigBuckBunnySource, (player) => {
    player.loop = true;
    player.showNowPlayingNotification = false;
    player.play();
  });
  const timeUpdate = useEvent(player, 'timeUpdate');
  const status = useEvent(player, 'statusChange', 'idle');
  const isPlaying = useEvent(player, 'playingChange', false);
  const playbackRate = useEvent(player, 'playbackRateChange', 1);
  const source = useEvent(player, 'sourceChange', bigBuckBunnySource);
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

  useEffect(() => {
    player.timeUpdateEventInterval = 0.25;
    player.addListener('statusChange', (_, __, error) => {
      setError(error?.message ?? null);
      console.log('statusChange', status, error?.message ?? null);
    });
    return () => player.removeAllListeners('statusChange');
  }, [player]);

  return (
    <View style={styles.contentContainer}>
      <VideoView ref={ref} player={player} style={styles.video} />
      <ScrollView style={styles.controlsContainer} contentContainerStyle={{ alignItems: 'center' }}>
        <Button style={styles.button} title="Toggle Source" onPress={toggleSource} />
        <Button style={styles.button} title="Trigger an Error" onPress={triggerError} />
        <MediumText>Is playing: {isPlaying ? 'true' : 'false'}</MediumText>
        <MediumText>
          Current time: {Math.round((timeUpdate?.currentTime ?? 0) * 100) / 100}
        </MediumText>
        <MediumText>
          Buffered to: {Math.round((timeUpdate?.bufferedPosition ?? 0) * 100) / 100}
        </MediumText>
        <MediumText>Status: {status}</MediumText>
        {error && <MediumText>Error: {error}</MediumText>}
        <MediumText style={styles.mediumText}>Playback rate: {playbackRate}</MediumText>
        <MediumText>Source: {sourceObject?.metadata?.title ?? 'No metadata'}</MediumText>
      </ScrollView>
    </View>
  );
}
