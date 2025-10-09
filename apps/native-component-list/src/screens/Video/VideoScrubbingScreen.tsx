import { B } from '@expo/html-elements';
import Slider from '@react-native-community/slider';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { localVideoSource, seekOptimizedSource } from './videoSources';
import TitledSwitch from '../../components/TitledSwitch';

export default function VideoScrubbingScreen() {
  const videoViewRef = useRef(null);
  const [scrubbingModeEnabled, setScrubbingModeEnabled] = useState(true);
  const [useOptimizedSource, setUseOptimizedSource] = useState(true);
  const [toleranceBefore, setToleranceBefore] = useState(1);
  const [toleranceAfter, setToleranceAfter] = useState(1);
  const [sliderValue, setSliderValue] = useState(0);

  const player = useVideoPlayer(seekOptimizedSource, (player) => {
    player.pause();
    player.loop = true;
    player.bufferOptions = {
      // TODO: @behenate: In the PR, which adds back buffer duratingg options to `expo-video`, enable the back buffer here
    };
  });

  useEffect(() => {
    if (useOptimizedSource) {
      player.replaceAsync(seekOptimizedSource);
    } else {
      player.replaceAsync(localVideoSource);
    }
  }, [useOptimizedSource]);

  useEffect(() => {
    player.seekTolerance = {
      toleranceBefore,
      toleranceAfter,
    };
  }, [toleranceBefore, toleranceAfter]);

  return (
    <View style={styles.container}>
      <VideoView
        ref={videoViewRef}
        style={{ flex: 1, width: '100%' }}
        player={player}
        nativeControls={false}
        contentFit="contain"
      />
      <B>Use this slider to seek the player</B>
      <Slider
        value={sliderValue}
        onValueChange={(value) => {
          player.currentTime = player.duration * value;
          setSliderValue(value);
        }}
        onSlidingStart={() => {
          player.scrubbingModeOptions = {
            scrubbingModeEnabled,
          };
        }}
        onSlidingComplete={() => {
          player.scrubbingModeOptions = {
            scrubbingModeEnabled: false,
          };
        }}
        style={styles.slider}
      />
      <TitledSwitch
        title="Enable scrubbing mode"
        value={scrubbingModeEnabled}
        setValue={(value) => {
          setScrubbingModeEnabled(value);
          player.scrubbingModeOptions = {
            scrubbingModeEnabled: value,
          };
        }}
      />

      <TitledSwitch
        value={useOptimizedSource}
        setValue={setUseOptimizedSource}
        title="Use optimized source"
      />
      <B>Tolerance before: {Math.round(toleranceBefore * 100) / 100}s</B>
      <Slider
        value={toleranceBefore}
        minimumValue={0}
        maximumValue={2}
        onValueChange={setToleranceBefore}
        style={styles.slider}
      />
      <B>Tolerance after: {Math.round(toleranceAfter * 100) / 100}s</B>
      <Slider
        value={toleranceAfter}
        minimumValue={0}
        maximumValue={2}
        onValueChange={setToleranceAfter}
        style={styles.slider}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  slider: {
    alignSelf: 'stretch',
    marginHorizontal: 20,
  },
});
