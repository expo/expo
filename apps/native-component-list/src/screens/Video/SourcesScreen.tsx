import { Picker } from '@react-native-picker/picker';
import { Platform } from 'expo-modules-core';
import { useVideoPlayer, VideoView, VideoSource } from 'expo-video';
import React, { useRef, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { videoLabels, videoSources } from './videoSources';
import { styles } from './videoStyles';
import TitledSwitch from '../../components/TitledSwitch';

export default function DefaultScreen() {
  const ref = useRef<VideoView>(null);
  const [useReplaceFunction, setUseReplaceFunction] = useState(true);
  const [statefulSource, setStatefulSource] = useState<VideoSource>(videoSources[0]);
  const [currentSourceIndex, setCurrentSourceIndex] = useState(0);

  const player = useVideoPlayer(statefulSource, (player) => {
    player.play();
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
          onValueChange={(value: number) => {
            setCurrentSourceIndex(value);
            if (useReplaceFunction) {
              player.replace(videoSources[value]);
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
        <Text style={styles.centerText}>
          Generally video sources should be changed using the `VideoPlayer.replace` function, if the
          parameter passed to the `useVideoPlayer` hook is a state, on each change a new player will
          be created.
        </Text>
      </ScrollView>
    </View>
  );
}
