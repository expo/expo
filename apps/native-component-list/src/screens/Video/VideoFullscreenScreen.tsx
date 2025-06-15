import SegmentedControl from '@react-native-segmented-control/segmented-control';
import { useVideoPlayer, VideoView } from 'expo-video';
import { FullscreenOrientation } from 'expo-video/build/VideoView.types';
import React, { useCallback, useRef, useState } from 'react';
import { ScrollView, View, Text } from 'react-native';

import { bigBuckBunnySource } from './videoSources';
import { styles } from './videoStyles';
import Button from '../../components/Button';
import TitledSwitch from '../../components/TitledSwitch';

const orientations = ['default', 'portrait', 'landscape'];
export default function VideoFullscreenScreen() {
  const ref = useRef<VideoView>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [allowFullscreen, setAllowFullscreen] = useState(true);
  const [autoExitOnRotate, setAutoExitOnRotate] = useState(true);
  const [lockIndex, setLockIndex] = useState(0);

  const player = useVideoPlayer(bigBuckBunnySource, (player) => {
    player.loop = true;
    player.muted = true;
    player.showNowPlayingNotification = false;
    player.play();
  });

  const toggleFullscreen = useCallback(() => {
    if (!isFullscreen) {
      ref.current?.enterFullscreen();
    } else {
      ref.current?.exitFullscreen();
    }
  }, [player]);

  return (
    <View style={styles.contentContainer}>
      <VideoView
        ref={ref}
        player={player}
        onFullscreenEnter={() => {
          console.log('Entered Fullscreen');
          setIsFullscreen(true);
        }}
        onFullscreenExit={() => {
          console.log('Exited Fullscreen');
          setIsFullscreen(false);
        }}
        allowsFullscreen={allowFullscreen}
        fullscreenOptions={{
          enable: allowFullscreen,
          orientation: orientations[lockIndex] as FullscreenOrientation,
          autoExitOnRotate,
        }}
        style={styles.video}
      />
      <ScrollView style={styles.controlsContainer}>
        <Button style={styles.button} title="Enter Fullscreen" onPress={toggleFullscreen} />
        <View style={styles.row}>
          <TitledSwitch
            title="Allow Fullscreen"
            value={allowFullscreen}
            setValue={setAllowFullscreen}
            style={styles.switch}
            titleStyle={styles.switchTitle}
          />
          <TitledSwitch
            title="Auto Exit on Rotate"
            value={autoExitOnRotate}
            setValue={setAutoExitOnRotate}
            style={styles.switch}
            titleStyle={styles.switchTitle}
          />
        </View>
        <Text style={styles.centerText}>Orientation</Text>
        <SegmentedControl
          values={orientations}
          selectedIndex={lockIndex}
          onValueChange={(value) => setLockIndex(orientations.indexOf(value))}
        />
      </ScrollView>
    </View>
  );
}
