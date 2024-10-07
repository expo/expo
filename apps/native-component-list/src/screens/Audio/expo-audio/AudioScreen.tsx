import { setIsAudioActiveAsync } from 'expo-audio';
import React from 'react';
import { PixelRatio, ScrollView, StyleSheet } from 'react-native';

import AudioModeSelector from './AudioModeSelector';
import AudioPlayer from './AudioPlayer';
import HeadingText from '../../../components/HeadingText';
import ListButton from '../../../components/ListButton';

export default function AudioScreen(props: any) {
  React.useLayoutEffect(() => {
    props.navigation.setOptions({
      title: 'Audio (expo-audio)',
    });
  });

  return (
    <ScrollView contentContainerStyle={styles.contentContainer}>
      <HeadingText>Audio state</HeadingText>
      <ListButton title="Activate Audio" onPress={() => setIsAudioActiveAsync(true)} />
      <ListButton title="Deactivate Audio" onPress={() => setIsAudioActiveAsync(false)} />
      <HeadingText>Audio mode</HeadingText>
      <AudioModeSelector />
      <HeadingText>HTTP player</HeadingText>
      <AudioPlayer
        source={{
          uri: 'https://p.scdn.co/mp3-preview/f7a8ab9c5768009b65a30e9162555e8f21046f46?cid=162b7dc01f3a4a2ca32ed3cec83d1e02',
        }}
        style={styles.player}
      />
      <HeadingText>Local asset player</HeadingText>
      {/* <AudioPlayer
        source={require('../../../../assets/sounds/polonez.mp3')}
        style={styles.player}
      /> */}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    padding: 10,
  },
  player: {
    borderBottomWidth: 1.0 / PixelRatio.get(),
    borderBottomColor: '#cccccc',
  },
});
