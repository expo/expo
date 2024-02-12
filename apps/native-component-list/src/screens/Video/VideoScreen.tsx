import { VideoView, useVideoPlayer } from '@expo/video';
import React, { useCallback, useEffect, useRef } from 'react';
import { PixelRatio, ScrollView, StyleSheet, View, Text } from 'react-native';

import Button from '../../components/Button';
import TitledSwitch from '../../components/TitledSwitch';

export default function VideoScreen() {
  const ref = useRef<VideoView>(null);
  const [isInPictureInPicture, setIsInPictureInPicture] = React.useState(false);
  const [allowPictureInPicture, setAllowPictureInPicture] = React.useState(true);
  const [startPictureInPictureAutomatically, setStartPictureInPictureAutomatically] =
    React.useState(false);
  const [showNativeControls, setShowNativeControls] = React.useState(true);
  const [requiresLinearPlayback, setRequiresLinearPlayback] = React.useState(false);

  const enterFullscreen = useCallback(() => {
    ref.current?.enterFullscreen();
  }, [ref]);

  const player = useVideoPlayer(
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
  );

  const togglePlayer = useCallback(() => {
    if (player.isPlaying) {
      player.pause();
    } else {
      player.play();
    }
  }, [player]);

  const replaceItem = useCallback(() => {
    player.replace(
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4'
    );
  }, []);

  const seekBy = useCallback(() => {
    player.seekBy(10);
  }, []);

  const replay = useCallback(() => {
    player.replay();
  }, []);

  const toggleMuted = useCallback(() => {
    player.isMuted = !player.isMuted;
  }, []);

  const togglePictureInPicture = useCallback(() => {
    if (!isInPictureInPicture) {
      ref.current?.startPictureInPicture();
    } else {
      ref.current?.stopPictureInPicture();
    }
  }, [ref, isInPictureInPicture]);

  useEffect(() => {
    player.play();
  }, []);

  return (
    <View style={styles.contentContainer}>
      <VideoView
        ref={ref}
        style={styles.video}
        player={player}
        nativeControls={showNativeControls}
        contentFit="contain"
        contentPosition={{ dx: 0, dy: 0 }}
        allowsFullscreen
        showsTimecodes={false}
        requiresLinearPlayback={requiresLinearPlayback}
        allowsPictureInPicture={allowPictureInPicture}
        startsPictureInPictureAutomatically={startPictureInPictureAutomatically}
        onPictureInPictureStart={() => {
          setIsInPictureInPicture(true);
          console.log('Entered Picture in Picture mode');
        }}
        onPictureInPictureStop={() => {
          setIsInPictureInPicture(false);
          console.log('Exited Picture in Picture mode');
        }}
      />
      <ScrollView>
        <Text>PictureInPicture Active: {isInPictureInPicture ? 'Yes' : 'No'}</Text>
        <Button style={styles.button} title="Toggle" onPress={togglePlayer} />
        <Button style={styles.button} title="Replace" onPress={replaceItem} />
        <Button style={styles.button} title="Seek by 10 seconds" onPress={seekBy} />
        <Button style={styles.button} title="Replay" onPress={replay} />
        <Button style={styles.button} title="Toggle mute" onPress={toggleMuted} />
        <Button style={styles.button} title="Enter fullscreen" onPress={enterFullscreen} />
        <Button
          style={styles.button}
          title="Toggle picture in picture"
          onPress={togglePictureInPicture}
        />
        <View style={styles.row}>
          <TitledSwitch
            title="Allow Picture in Picture"
            value={allowPictureInPicture}
            setValue={setAllowPictureInPicture}
            style={styles.switch}
            titleStyle={styles.switchTitle}
          />
          <TitledSwitch
            title="Enter PiP Automatically"
            value={startPictureInPictureAutomatically}
            setValue={setStartPictureInPictureAutomatically}
            style={styles.switch}
            titleStyle={styles.switchTitle}
          />
        </View>
        <View style={styles.row}>
          <TitledSwitch
            title="Requires linear playback"
            value={requiresLinearPlayback}
            setValue={setRequiresLinearPlayback}
            style={styles.switch}
            titleStyle={styles.switchTitle}
          />
          <TitledSwitch
            title="Show native controls"
            value={showNativeControls}
            setValue={setShowNativeControls}
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
  },
  row: {
    flexDirection: 'row',
  },
  switch: {
    flexDirection: 'column',
  },
  switchTitle: {
    textAlign: 'center',
    fontWeight: 'bold',
    opacity: 0.5,
    fontSize: 12,
  },
  video: {
    width: 300,
    height: 225,
    borderBottomWidth: 1.0 / PixelRatio.get(),
    borderBottomColor: '#cccccc',
  },
  button: {
    margin: 5,
  },
});
