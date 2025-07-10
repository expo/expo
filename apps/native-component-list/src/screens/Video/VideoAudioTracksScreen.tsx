import { Picker } from '@react-native-picker/picker';
import { useEvent } from 'expo';
import { Platform } from 'expo-modules-core';
import { useVideoPlayer, VideoView } from 'expo-video';
import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';

import { bigBuckBunnySource, hlsSource, nullSource, audioTrackSource } from './videoSources';
import { styles } from './videoStyles';

const labels = ['Sintel (HLS)', 'No subtitles', 'Null Source', 'Audio Tracks'];
const videoSources = [hlsSource, bigBuckBunnySource, nullSource, audioTrackSource];

export default function VideoAudioTracksScreen() {
  const player = useVideoPlayer(videoSources[0], (player) => {
    player.loop = true;
    player.play();
  });
  const [audioTrackIndex, setAudioTrackIndex] = useState(0);
  const [currentSourceIndex, setCurrentSourceIndex] = useState(0);

  const { audioTrack } = useEvent(player, 'audioTrackChange', {
    audioTrack: player.audioTrack,
  });

  const { availableAudioTracks } = useEvent(player, 'availableAudioTracksChange', {
    availableAudioTracks: player.availableAudioTracks,
  });

  const handleAudioTrackChange = (value: number) => {
    setAudioTrackIndex(value);
    if (availableAudioTracks) {
      const selectedAudioTrack = availableAudioTracks[value];
      player.audioTrack = selectedAudioTrack;
    }
  };

  useEffect(() => {
    if (!availableAudioTracks) {
      setAudioTrackIndex(0);
      return;
    }
    const index = availableAudioTracks.findIndex((track) => track?.label === audioTrack?.label);
    if (index === -1) {
      setAudioTrackIndex(0);
      return;
    }
    setAudioTrackIndex(index);
  }, [audioTrack, availableAudioTracks]);

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
      <Text style={styles.switchTitle}>Audio:</Text>
      <Picker
        itemStyle={Platform.OS === 'ios' && { height: 150 }}
        style={styles.picker}
        mode="dropdown"
        selectedValue={audioTrackIndex}
        onValueChange={(value: number) => {
          handleAudioTrackChange(value);
        }}>
        {availableAudioTracks &&
          availableAudioTracks.map((source, index) => (
            <Picker.Item
              key={index}
              label={availableAudioTracks[index]?.label ?? 'Off'}
              value={index}
            />
          ))}
      </Picker>
      <Text>Current audio track: {audioTrack?.label ?? availableAudioTracks[0]?.label}</Text>
    </View>
  );
}
