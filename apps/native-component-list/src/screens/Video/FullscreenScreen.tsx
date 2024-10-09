import { useVideoPlayer, VideoView } from 'expo-video';
import React, { useCallback, useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';

import { bigBuckBunnySource } from './videoSources';
import { styles } from './videoStyles';
import Button from '../../components/Button';
import TitledSwitch from '../../components/TitledSwitch';

export default function FullscreenScreen() {
  const ref = useRef<VideoView>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [allowFullscreen, setAllowFullscreen] = useState(true);

  const player = useVideoPlayer(bigBuckBunnySource, (player) => {
    player.loop = true;
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
        </View>
      </ScrollView>
    </View>
  );
}
