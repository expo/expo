import Slider from '@react-native-community/slider';
import SegmentedControl from '@react-native-segmented-control/segmented-control';
import { useVideoPlayer, VideoView } from 'expo-video';
import React, { useCallback } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { bigBuckBunnySource } from './videoSources';
import { styles } from './videoStyles';
import Button from '../../components/Button';
import TitledSwitch from '../../components/TitledSwitch';

const playbackRates: number[] = [0.25, 0.5, 1, 1.5, 2, 16];

export default function VideoPlaybackControlsScreen() {
  const [loop, setLoop] = React.useState(false);
  const [playbackRateIndex, setPlaybackRateIndex] = React.useState(2);
  const [preservePitch, setPreservePitch] = React.useState(true);
  const [volume, setVolume] = React.useState(1);

  const player = useVideoPlayer(bigBuckBunnySource, (player) => {
    player.volume = volume;
    player.loop = loop;
    player.preservesPitch = preservePitch;
    player.showNowPlayingNotification = false;
    player.allowsExternalPlayback = false;
    player.play();
  });

  const togglePlayer = useCallback(() => {
    if (player.playing) {
      player.pause();
    } else {
      player.play();
    }
  }, [player]);

  const toggleMute = useCallback(() => {
    player.muted = !player.muted;
  }, [player]);

  const seekBy = useCallback(() => {
    player.seekBy(10);
  }, [player]);

  const replay = useCallback(() => {
    player.replay();
  }, [player]);

  const updateLoop = useCallback(
    (loop: boolean) => {
      player.loop = loop;
      setLoop(loop);
    },
    [loop, player]
  );

  return (
    <View style={styles.contentContainer}>
      <VideoView style={styles.video} player={player} nativeControls={false} />
      <ScrollView style={styles.controlsContainer}>
        <Button style={styles.button} title="Toggle" onPress={togglePlayer} />
        <Button style={styles.button} title="Seek by 10 seconds" onPress={seekBy} />
        <Button style={styles.button} title="Replay" onPress={replay} />
        <Button style={styles.button} title="Toggle mute" onPress={toggleMute} />
        <Text>Playback Volume: </Text>
        <Slider
          style={{ alignSelf: 'stretch' }}
          minimumValue={0}
          maximumValue={1}
          value={volume}
          onValueChange={(value) => {
            player.volume = value;
            setVolume(value);
          }}
        />
        <Text>Playback Speed: </Text>
        <SegmentedControl
          values={playbackRates.map((speed) => `${speed}x`)}
          selectedIndex={playbackRateIndex}
          onValueChange={(value) => {
            player.playbackRate = parseFloat(value);
            setPlaybackRateIndex(playbackRates.indexOf(parseFloat(value)));
          }}
          backgroundColor="#e5e5e5"
        />
        <View style={styles.row}>
          <TitledSwitch
            title="Loop playback"
            value={loop}
            setValue={updateLoop}
            style={styles.switch}
            titleStyle={styles.switchTitle}
          />
          <TitledSwitch
            title="Preserve pitch"
            value={preservePitch}
            setValue={setPreservePitch}
            style={styles.switch}
            titleStyle={styles.switchTitle}
          />
        </View>
      </ScrollView>
    </View>
  );
}
