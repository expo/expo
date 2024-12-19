import { Picker } from '@react-native-picker/picker';
import { Platform } from 'expo-modules-core';
import {
  useVideoPlayer,
  VideoView,
  VideoSource,
  cleanVideoCacheAsync,
  setVideoCacheSizeAsync,
  getCurrentVideoCacheSize,
} from 'expo-video';
import React, { useCallback, useRef } from 'react';
import { ScrollView, Text, View } from 'react-native';

import {
  bigBuckBunnySource,
  elephantsDreamSource,
  hlsSource,
  forBiggerBlazesSource,
  localVideoSource,
} from './videoSources';
import { styles } from './videoStyles';
import Button from '../../components/Button';

function enableCaching(source: VideoSource) {
  return {
    ...(source as object),
    useCaching: true,
  };
}

const videoLabels: string[] = [
  'Big Buck Bunny (cache enabled)',
  'Elephants Dream (caching enabled)',
  'For Bigger Blazes (cache enabled)',
  'Sintel (HLS) (cache enabled)',
  'Sintel (HLS) (cache disabled)',
  'Big Buck Bunny (cache disabled)',
];
const videoSources: VideoSource[] = [
  enableCaching(bigBuckBunnySource),
  enableCaching(elephantsDreamSource),
  enableCaching(forBiggerBlazesSource),
  enableCaching(hlsSource),
  hlsSource,
  bigBuckBunnySource,
];

export default function VideoCacheScreen() {
  const ref = useRef<VideoView>(null);
  const [currentSource, setCurrentSource] = React.useState(videoSources[1]);

  const player = useVideoPlayer(currentSource, (player) => {
    player.loop = true;
    player.play();
  });

  const clearCache = useCallback(() => {
    player.release();
    cleanVideoCacheAsync().then(() => {
      setCurrentSource(videoSources[0]);
      console.log('Cache Cleared');
    });
  }, [player]);

  const setSize200MB = useCallback(() => {
    player.release();
    setVideoCacheSizeAsync(200 * 1024 * 1024).then(() => {
      setCurrentSource(videoSources[0]);
    });
  }, [player]);

  const refreshCurrentCacheSize = useCallback(() => {
    console.log(getCurrentVideoCacheSize());
  }, [player]);

  const setSize1GB = useCallback(() => {
    player.release();
    setVideoCacheSizeAsync(1024 * 1024 * 1024).then(() => {
      setCurrentSource(videoSources[0]);
    });
  }, [player]);

  return (
    <View style={styles.contentContainer}>
      <VideoView ref={ref} style={styles.video} player={player} />
      <ScrollView style={styles.controlsContainer}>
        <Text>VideoSource:</Text>
        <Picker
          itemStyle={Platform.OS === 'ios' && { height: 150 }}
          style={styles.picker}
          mode="dropdown"
          selectedValue={videoSources.indexOf(currentSource)}
          onValueChange={(value: number) => {
            setCurrentSource(videoSources[value]);
          }}>
          {videoSources.map((source, index) => (
            <Picker.Item key={index} label={videoLabels[index]} value={index} />
          ))}
        </Picker>
        <Button style={styles.button} title="Clear cache" onPress={clearCache} />
        <Button style={styles.button} title="Set cache size to 200MB" onPress={setSize200MB} />
        <Button style={styles.button} title="Set cache size to 1GB" onPress={setSize1GB} />
        <Button
          style={styles.button}
          title="Print current cache size"
          onPress={refreshCurrentCacheSize}
        />
      </ScrollView>
    </View>
  );
}
