import { Picker } from '@react-native-picker/picker';
import { Platform } from 'expo-modules-core';
import { useVideoPlayer, VideoView, VideoSource } from 'expo-video';
import React, { useRef, useState } from 'react';
import { ScrollView, Text, View, Button } from 'react-native';

import {
  getMediaLibraryVideoSourceAsync,
  videoLabels as labelsList,
  videoSources as sourcesList,
} from './videoSources';
import { styles } from './videoStyles';
import TitledSwitch from '../../components/TitledSwitch';

const videoSources = [...sourcesList];
const videoLabels = [...labelsList];
export default function VideoSourcesScreen() {
  const ref = useRef<VideoView>(null);
  const [useReplaceFunction, setUseReplaceFunction] = useState(true);
  const [statefulSource, setStatefulSource] = useState<VideoSource>(videoSources[0]);
  const [currentSourceIndex, setCurrentSourceIndex] = useState(0);

  const player = useVideoPlayer(statefulSource, (player) => {
    player.play();
    player.loop = true;
  });

  return (
    <View style={styles.contentContainer}>
      <VideoView
        ref={ref}
        style={styles.video}
        player={player}
        contentFit="contain"
        contentPosition={{ dx: 0, dy: 0 }}
        allowsFullscreen
        showsTimecodes={false}
      />
      <ScrollView style={styles.controlsContainer}>
        <Text>VideoSource:</Text>
        <Picker
          itemStyle={Platform.OS === 'ios' && { height: 150 }}
          style={styles.picker}
          mode="dropdown"
          selectedValue={currentSourceIndex}
          onValueChange={async (value: number) => {
            setCurrentSourceIndex(value);
            if (useReplaceFunction) {
              await player.replaceAsync(videoSources[value]);
            } else {
              setStatefulSource(videoSources[value]);
            }
          }}>
          {videoSources.map((source, index) => (
            <Picker.Item key={index} label={videoLabels[index]} value={index} />
          ))}
        </Picker>
        <View style={styles.row}>
          <TitledSwitch
            value={useReplaceFunction}
            setValue={(value) => {
              if (value) {
                setStatefulSource(videoSources[currentSourceIndex]);
              }
              setUseReplaceFunction(value);
            }}
            title="Use replace function"
            style={styles.switch}
            titleStyle={styles.switchTitle}
          />
        </View>
        {/* Keep this as a separate button so that the permissions popup is not shown right away after opening the screen */}
        {Platform.OS !== 'web' && (
          <Button
            title="Add first video from library"
            onPress={async () => {
              const mediaSource = await getMediaLibraryVideoSourceAsync();
              if (mediaSource === null) {
                console.warn('Failed to find a media source');
                return;
              }
              const title = mediaSource.metadata?.title ?? 'MediaLibrary Source';
              if (videoLabels.includes(title)) {
                console.warn('Media source already exists');
                return;
              }
              videoLabels.push(title);
              videoSources.push(mediaSource);
              setCurrentSourceIndex(videoSources.length - 1);
              player.replaceAsync(mediaSource);
            }}
          />
        )}
        <Text style={styles.centerText}>
          Generally video sources should be changed using the `VideoPlayer.replace` function, if the
          parameter passed to the `useVideoPlayer` hook is a state, on each change a new player will
          be created.
        </Text>
      </ScrollView>
    </View>
  );
}
