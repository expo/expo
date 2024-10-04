import { useVideoPlayer, VideoView, VideoSource } from '@expo/video';
import Slider from '@react-native-community/slider';
import { Picker } from '@react-native-picker/picker';
import SegmentedControl from '@react-native-segmented-control/segmented-control';
import { Platform } from 'expo-modules-core';
import React, { useCallback, useEffect, useRef } from 'react';
import { PixelRatio, ScrollView, StyleSheet, Text, View } from 'react-native';

import Button from '../../components/Button';
import TitledSwitch from '../../components/TitledSwitch';

const bigBuckBunnySource: VideoSource =
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';

const elephantsDreamSource: VideoSource =
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4';

// source: https://reference.dashif.org/dash.js/latest/samples/drm/widevine.html
const androidDrmSource: VideoSource = {
  uri: 'https://media.axprod.net/TestVectors/v7-MultiDRM-SingleKey/Manifest.mpd',
  drm: {
    type: 'widevine',
    headers: {
      'X-AxDRM-Message':
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ2ZXJzaW9uIjoxLCJjb21fa2V5X2lkIjoiYjMzNjRlYjUtNTFmNi00YWUzLThjOTgtMzNjZWQ1ZTMxYzc4IiwibWVzc2FnZSI6eyJ0eXBlIjoiZW50aXRsZW1lbnRfbWVzc2FnZSIsImtleXMiOlt7ImlkIjoiOWViNDA1MGQtZTQ0Yi00ODAyLTkzMmUtMjdkNzUwODNlMjY2IiwiZW5jcnlwdGVkX2tleSI6ImxLM09qSExZVzI0Y3Iya3RSNzRmbnc9PSJ9XX19.4lWwW46k-oWcah8oN18LPj5OLS5ZU-_AQv7fe0JhNjA',
    },
    licenseServer: 'https://drm-widevine-licensing.axtest.net/AcquireLicense',
  },
};
const videoLabels: string[] = ['Big Buck Bunny', 'Elephants Dream'];
const videoSources: VideoSource[] = [bigBuckBunnySource, elephantsDreamSource];
const playbackRates: number[] = [0.25, 0.5, 1, 1.5, 2, 16];

if (Platform.OS === 'android') {
  videoLabels.push('Tears of Steel (DRM protected)');
  videoSources.push(androidDrmSource);
}

export default function VideoScreen() {
  const ref = useRef<VideoView>(null);
  const [isInPictureInPicture, setIsInPictureInPicture] = React.useState(false);
  const [allowPictureInPicture, setAllowPictureInPicture] = React.useState(true);
  const [startPictureInPictureAutomatically, setStartPictureInPictureAutomatically] =
    React.useState(false);
  const [selectedSource, setSelectedSource] = React.useState<number>(0);
  const [showNativeControls, setShowNativeControls] = React.useState(true);
  const [requiresLinearPlayback, setRequiresLinearPlayback] = React.useState(false);
  const [staysActiveInBackground, setStaysActiveInBackground] = React.useState(false);
  const [loop, setLoop] = React.useState(false);
  const [playbackRateIndex, setPlaybackRateIndex] = React.useState(2);
  const [shouldCorrectPitch, setCorrectsPitch] = React.useState(true);
  const [volume, setVolume] = React.useState(1);

  const player = useVideoPlayer(videoSources[selectedSource]);

  const enterFullscreen = useCallback(() => {
    ref.current?.enterFullscreen();
  }, [ref]);

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

  const togglePictureInPicture = useCallback(() => {
    if (!isInPictureInPicture) {
      ref.current?.startPictureInPicture();
    } else {
      ref.current?.stopPictureInPicture();
    }
  }, [ref, isInPictureInPicture]);

  const updateStaysActiveInBackground = useCallback(
    (staysActive: boolean) => {
      player.staysActiveInBackground = staysActive;
      setStaysActiveInBackground(staysActive);
    },
    [staysActiveInBackground]
  );

  const updateLoop = useCallback(
    (loop: boolean) => {
      player.loop = loop;
      setLoop(loop);
    },
    [loop]
  );

  const updatePreservesPitch = useCallback((correctPitch: boolean) => {
    player.preservesPitch = correctPitch;
    setCorrectsPitch(correctPitch);
  }, []);

  useEffect(() => {
    player.play();
    player.preservesPitch = shouldCorrectPitch;
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
      <ScrollView style={styles.controlsContainer}>
        <Text>PictureInPicture Active: {isInPictureInPicture ? 'Yes' : 'No'}</Text>
        <Text>VideoSource:</Text>
        <Picker
          itemStyle={Platform.OS === 'ios' && { height: 150 }}
          style={styles.picker}
          mode="dropdown"
          selectedValue={selectedSource}
          onValueChange={(value: number) => {
            setSelectedSource(value);
            player.replace(videoSources[value]);
          }}>
          {videoSources.map((source, index) => (
            <Picker.Item key={index} label={videoLabels[index]} value={index} />
          ))}
        </Picker>
        <Button style={styles.button} title="Toggle" onPress={togglePlayer} />
        <Button style={styles.button} title="Seek by 10 seconds" onPress={seekBy} />
        <Button style={styles.button} title="Replay" onPress={replay} />
        <Button style={styles.button} title="Toggle mute" onPress={toggleMute} />
        <Button style={styles.button} title="Enter fullscreen" onPress={enterFullscreen} />
        <Button
          style={styles.button}
          title="Toggle picture in picture"
          onPress={togglePictureInPicture}
        />
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
        <View style={styles.row}>
          <TitledSwitch
            title="Stays active in background"
            value={staysActiveInBackground}
            setValue={updateStaysActiveInBackground}
            style={styles.switch}
            titleStyle={styles.switchTitle}
          />
          <TitledSwitch
            title="Loop playback"
            value={loop}
            setValue={updateLoop}
            style={styles.switch}
            titleStyle={styles.switchTitle}
          />
        </View>
        <View style={styles.row}>
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
    width: 300,
    height: 225,
    borderBottomWidth: 1.0 / PixelRatio.get(),
    borderBottomColor: '#cccccc',
  },
  button: {
    margin: 5,
  },
});
