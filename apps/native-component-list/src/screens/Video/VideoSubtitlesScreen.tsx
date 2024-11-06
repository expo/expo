import { Picker } from '@react-native-picker/picker';
import { useEvent } from 'expo';
import { Platform } from 'expo-modules-core';
import { useVideoPlayer, VideoView } from 'expo-video';
import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';

import { bigBuckBunnySource, hlsSource, nullSource } from './videoSources';
import { styles } from './videoStyles';

const labels = ['Sintel (HLS)', 'No subtitles', 'Null Source'];
const videoSources = [hlsSource, bigBuckBunnySource, nullSource];
export default function VideoDRMScreen() {
  const player = useVideoPlayer(videoSources[0], (player) => {
    player.loop = true;
    player.play();
  });
  const [subtitleTrackIndex, setSubtitleTrackIndex] = useState(0);
  const [currentSourceIndex, setCurrentSourceIndex] = useState(0);

  const { subtitleTrack } = useEvent(player, 'subtitleTrackChange', {
    subtitleTrack: player.subtitleTrack,
  });

  const { availableSubtitleTracks } = useEvent(player, 'availableSubtitleTracksChange', {
    availableSubtitleTracks: player.availableSubtitleTracks,
  });
  const pickerSubtitleItems = [null, ...availableSubtitleTracks];

  useEffect(() => {
    const index = pickerSubtitleItems.findIndex((track) => track?.label === subtitleTrack?.label);
    setSubtitleTrackIndex(index);
  }, [subtitleTrack]);

  return (
    <View style={styles.contentContainer}>
      <VideoView player={player} style={styles.video} />
      <Text style={styles.switchTitle}>Video Source:</Text>
      <Picker
        itemStyle={Platform.OS === 'ios' && { height: 150 }}
        style={styles.picker}
        mode="dropdown"
        selectedValue={currentSourceIndex}
        onValueChange={(value: number) => {
          setCurrentSourceIndex(value);
          player.replace(videoSources[value]);
        }}>
        {videoSources.map((source, index) => (
          <Picker.Item key={index} label={labels[index]} value={index} />
        ))}
      </Picker>
      <Text style={styles.switchTitle}>Subtitles:</Text>
      <Picker
        itemStyle={Platform.OS === 'ios' && { height: 150 }}
        style={styles.picker}
        mode="dropdown"
        selectedValue={subtitleTrackIndex}
        onValueChange={(value: number) => {
          setSubtitleTrackIndex(value);
          player.subtitleTrack = pickerSubtitleItems[value];
        }}>
        {pickerSubtitleItems.map((source, index) => (
          <Picker.Item
            key={index}
            label={pickerSubtitleItems[index]?.label ?? 'Off'}
            value={index}
          />
        ))}
      </Picker>
      <Text>Current subtitle track: {subtitleTrack?.label ?? 'Subtitles are off'}</Text>
    </View>
  );
}
