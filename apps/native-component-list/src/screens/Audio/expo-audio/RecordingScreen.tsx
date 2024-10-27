import React, { useState } from 'react';
import { PixelRatio, ScrollView, StyleSheet } from 'react-native';

import AudioModeSelector from './AudioModeSelector';
import AudioPlayer from './AudioPlayer';
import Recorder from './Recorder';
import HeadingText from '../../../components/HeadingText';

export default function RecordingScreen() {
  const [uri, setUri] = useState<string | undefined>(undefined);

  const onRecordingFinished = (recordingUri: string) => setUri(recordingUri);

  const maybeRenderLastRecording = () => {
    return uri ? (
      <>
        <HeadingText>Last recording</HeadingText>
        <AudioPlayer source={{ uri }} />
      </>
    ) : null;
  };

  return (
    <ScrollView contentContainerStyle={styles.contentContainer}>
      <HeadingText>Audio mode</HeadingText>
      <AudioModeSelector />
      <HeadingText>Recorder</HeadingText>
      <Recorder onDone={onRecordingFinished} />
      {maybeRenderLastRecording()}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    padding: 10,
  },
  text: {
    marginVertical: 15,
    marginHorizontal: 10,
  },
  faintText: {
    color: '#888',
    marginHorizontal: 30,
  },
  oopsTitle: {
    fontSize: 25,
    marginBottom: 5,
    textAlign: 'center',
  },
  oopsText: {
    textAlign: 'center',
    marginTop: 10,
    marginHorizontal: 30,
  },
  player: {
    borderBottomWidth: 1.0 / PixelRatio.get(),
    borderBottomColor: '#cccccc',
  },
});
