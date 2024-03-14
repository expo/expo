import { useVideoPlayer, VideoSource, TransparentVideoView } from '@expo/video';
import Slider from '@react-native-community/slider';
import SegmentedControl from '@react-native-segmented-control/segmented-control';
import React, { useCallback, useEffect } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import Button from '../../components/Button';
import TitledSwitch from '../../components/TitledSwitch';

const balloonsWithMask: VideoSource =
  'https://firebasestorage.googleapis.com/v0/b/video-test-4d805.appspot.com/o/baloonsWithAlphaMask.mp4?alt=media';

const playbackRates: number[] = [0.25, 0.5, 1, 1.5, 2, 16];

export default function TransparentVideoScreen() {
  const [requiresLinearPlayback, setRequiresLinearPlayback] = React.useState(false);
  const [playbackRateIndex, setPlaybackRateIndex] = React.useState(2);
  const [shouldCorrectPitch, setCorrectsPitch] = React.useState(true);
  const [volume, setVolume] = React.useState(1);

  const player = useVideoPlayer(balloonsWithMask);

  const togglePlayer = useCallback(() => {
    if (player.playing) {
      player.pause();
    } else {
      player.play();
    }
  }, [player]);

  const seekBy = useCallback(() => {
    player.seekBy(10);
  }, []);

  const replay = useCallback(() => {
    player.replay();
  }, []);

  const toggleMute = useCallback(() => {
    player.muted = !player.muted;
  }, []);

  const updatePreservesPitch = useCallback((correctPitch: boolean) => {
    player.preservesPitch = correctPitch;
    setCorrectsPitch(correctPitch);
  }, []);

  useEffect(() => {
    player.muted = true;
    player.loop = true;
    player.play();
    player.preservesPitch = shouldCorrectPitch;
  }, []);

  return (
    <View style={styles.contentContainer}>
      <View style={styles.video}>
        <TransparentVideoView style={styles.video} player={player} showsTimecodes={false} />
      </View>
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
            title="Requires linear playback"
            value={requiresLinearPlayback}
            setValue={setRequiresLinearPlayback}
            style={styles.switch}
            titleStyle={styles.switchTitle}
          />
          <TitledSwitch
            title="Should correct pitch"
            value={shouldCorrectPitch}
            setValue={updatePreservesPitch}
            style={styles.switch}
            titleStyle={styles.switchTitle}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 50,
  },
  controlsContainer: {
    alignSelf: 'stretch',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
  },
  picker: {
    alignSelf: 'stretch',
    backgroundColor: '#e0e0e0',
  },
  switch: {
    flex: 1,
    flexDirection: 'column',
  },
  switchTitle: {
    textAlign: 'center',
    fontWeight: 'bold',
    opacity: 0.5,
    fontSize: 12,
  },
  video: {
    width: 250,
    height: 500,
  },
  button: {
    margin: 5,
  },
});
