import { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import AudioModeSelector from './AudioModeSelector';
import Player from './AudioPlayer';
import Recorder from './Recorder';
import HeadingText from '../../../components/HeadingText';

export default function RecordingScreen() {
  const [recordingUri, setRecordingUri] = useState<string | undefined>(undefined);

  return (
    <ScrollView contentContainerStyle={styles.contentContainer}>
      <HeadingText>Audio mode</HeadingText>
      <AudioModeSelector />
      <HeadingText>Recorder</HeadingText>
      <Recorder onDone={(recordingUri: string) => setRecordingUri(recordingUri)} />
      {recordingUri && (
        <>
          <HeadingText>Last recording</HeadingText>
          <Player source={{ uri: recordingUri }} />
        </>
      )}
    </ScrollView>
  );
}

RecordingScreen.navigationOptions = {
  title: 'Audio Recording',
};

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
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#cccccc',
  },
});
