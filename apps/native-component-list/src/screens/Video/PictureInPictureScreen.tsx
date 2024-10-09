import { useVideoPlayer, VideoView, isPictureInPictureSupported } from 'expo-video';
import React, { useCallback, useRef, useState } from 'react';
import { ScrollView, View, Text } from 'react-native';

import { bigBuckBunnySource } from './videoSources';
import { styles } from './videoStyles';
import Button from '../../components/Button';
import TitledSwitch from '../../components/TitledSwitch';

export default function PictureInPictureScreen() {
  const ref = useRef<VideoView>(null);
  const [isInPiP, setIsInPiP] = useState(false);
  const [allowPiP, setAllowPiP] = useState(true);
  const [autoEnterPiP, setAutoEnterPiP] = useState(true);

  const player = useVideoPlayer(bigBuckBunnySource, (player) => {
    player.loop = true;
    player.showNowPlayingNotification = false;
    player.play();
  });

  const togglePiP = useCallback(() => {
    if (!isInPiP) {
      ref.current?.startPictureInPicture();
    } else {
      ref.current?.stopPictureInPicture();
    }
  }, [player]);

  if (!isPictureInPictureSupported()) {
    return (
      <View style={styles.contentContainer}>
        <Text>
          Picture in Picture is not supported on this device. Make sure that the config plugin is
          configured correctly and that you are not running in iOS Simulator.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.contentContainer}>
      <VideoView
        ref={ref}
        player={player}
        onPictureInPictureStart={() => setIsInPiP(true)}
        onPictureInPictureStop={() => setIsInPiP(false)}
        allowsPictureInPicture={allowPiP}
        startsPictureInPictureAutomatically={autoEnterPiP}
        style={styles.video}
      />
      <ScrollView style={styles.controlsContainer}>
        <Button style={styles.button} title="Enter Picture In Picture" onPress={togglePiP} />
        <View style={styles.row}>
          <TitledSwitch
            title="Allow Picture In Picture"
            value={allowPiP}
            setValue={setAllowPiP}
            style={styles.switch}
            titleStyle={styles.switchTitle}
          />
          <TitledSwitch
            title="Enter Picture In Picture Automatically"
            value={autoEnterPiP}
            setValue={setAutoEnterPiP}
            style={styles.switch}
            titleStyle={styles.switchTitle}
          />
        </View>
      </ScrollView>
    </View>
  );
}
