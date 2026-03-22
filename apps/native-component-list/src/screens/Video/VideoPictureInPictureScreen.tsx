import { useEvent } from 'expo';
import {
  useVideoPlayer,
  VideoView,
  isPictureInPictureSupported,
  PictureInPictureAction,
} from 'expo-video';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView, View, Text } from 'react-native';

import { bigBuckBunnySource } from './videoSources';
import { styles } from './videoStyles';
import Button from '../../components/Button';
import { E2EViewShotContainer } from '../../components/E2EViewShotContainer';
import TitledSwitch from '../../components/TitledSwitch';

const SEEK_BACKWARD_BUTTON: PictureInPictureAction = {
  action: 'SEEK_BACKWARD',
  title: 'Seek Backward',
  iconName: 'seek_backwards_10s',
  description: 'Seek backward 10 seconds',
};

const PLAY_BUTTON: PictureInPictureAction = {
  action: 'PLAY',
  title: 'Play',
  iconName: 'play',
  description: 'Start playback',
};

const PAUSE_BUTTON: PictureInPictureAction = {
  action: 'PAUSE',
  title: 'Pause',
  iconName: 'pause',
  description: 'Pauses playback',
};

const SEEK_FORWARD_BUTTON: PictureInPictureAction = {
  action: 'SEEK_FORWARD',
  title: 'Seek Forward',
  iconName: 'seek_forwards_10s',
  description: 'Seek forward 10 seconds',
};

export default function VideoPictureInPictureScreen() {
  const ref = useRef<VideoView>(null);
  const [isInPiP, setIsInPiP] = useState(false);
  const [allowPiP, setAllowPiP] = useState(true);
  const [autoEnterPiP, setAutoEnterPiP] = useState(true);
  const [customPiPActions, setCustomPiPActions] = useState(false);

  const player = useVideoPlayer(bigBuckBunnySource, (player) => {
    player.loop = true;
    player.showNowPlayingNotification = false;
    player.play();
  });

  const pictureInPictureActionPressed = useEvent(player, 'pictureInPictureActionPressed');

  const togglePiP = useCallback(() => {
    if (!isInPiP) {
      ref.current?.startPictureInPicture();
    } else {
      ref.current?.stopPictureInPicture();
    }
  }, [player]);

  const toggleCustomPiPActions = useCallback(() => {
    const newValue = !customPiPActions;
    setCustomPiPActions(newValue);
    if (newValue) {
      player.pictureInPictureActions = [SEEK_BACKWARD_BUTTON, PAUSE_BUTTON, SEEK_FORWARD_BUTTON];
    } else {
      player.pictureInPictureActions = null;
    }
  }, [player, customPiPActions]);

  useEffect(() => {
    switch (pictureInPictureActionPressed?.action) {
      case 'SEEK_BACKWARD':
        player.currentTime = Math.max(player.currentTime - 10, 0);
        break;
      case 'PLAY':
        player.play();
        player.pictureInPictureActions = [SEEK_BACKWARD_BUTTON, PAUSE_BUTTON, SEEK_FORWARD_BUTTON];
        break;
      case 'PAUSE':
        player.pause();
        player.pictureInPictureActions = [SEEK_BACKWARD_BUTTON, PLAY_BUTTON, SEEK_FORWARD_BUTTON];
        break;
      case 'SEEK_FORWARD':
        player.currentTime = Math.min(player.currentTime + 10, player.duration);
        break;
    }
  }, [pictureInPictureActionPressed]);

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
      <E2EViewShotContainer testID="pip-view" screenshotOutputPath="expo-video/screenshots/pip-1">
        <VideoView
          testID="pip-video-view"
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
            <TitledSwitch
              title="Use custom Picture In Picture actions"
              value={customPiPActions}
              setValue={toggleCustomPiPActions}
              style={styles.switch}
              titleStyle={styles.switchTitle}
            />
          </View>
          <Button
            title="e2e pause"
            onPress={() => {
              player.pause();
              player.currentTime = 10;
              player.pictureInPictureActions = null;
              setCustomPiPActions(false);
            }}
          />
        </ScrollView>
      </E2EViewShotContainer>
    </View>
  );
}
