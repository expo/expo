import { setIsAudioActiveAsync } from 'expo-audio';
import React from 'react';
import { PixelRatio, ScrollView, StyleSheet } from 'react-native';

import AudioModeSelector from './AudioModeSelector';
import AudioPlayer from './AudioPlayer';
import HeadingText from '../../components/HeadingText';
import ListButton from '../../components/ListButton';

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
          uri: 'https://expo-test-media.com/audio/por_una_cabeza.mp3',
          headers: {
            'Test-Header': 'Some-header',
            Auth: 'Bearer some-token',
          },
        }}
        crossOrigin="anonymous"
        style={styles.player}
      />
      <HeadingText>Local asset player</HeadingText>
      <AudioPlayer source={require('../../../assets/sounds/polonez.mp3')} style={styles.player} />
      <HeadingText>Remote asset with downloadFirst</HeadingText>
      <AudioPlayer
        source={{
          uri: 'https://expo-test-media.com/audio/por_una_cabeza.mp3',
        }}
        downloadFirst
        style={styles.player}
      />
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
