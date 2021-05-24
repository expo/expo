import React from 'react';
import { PixelRatio, ScrollView, StyleSheet } from 'react-native';

import HeadingText from '../../components/HeadingText';
import AudioModeSelector from './AudioModeSelector';
import Player from './AudioPlayer';
import Recorder from './Recorder';

interface State {
  recordingUri?: string;
}

// See: https://github.com/expo/expo/pull/10229#discussion_r490961694
// eslint-disable-next-line @typescript-eslint/ban-types
export default class RecordingScreen extends React.Component<{}, State> {
  static navigationOptions = {
    title: 'Audio Recording',
  };

  readonly state: State = {};

  _handleRecordingFinished = (recordingUri: string) => this.setState({ recordingUri });

  _maybeRenderLastRecording = () =>
    this.state.recordingUri ? (
      <>
        <HeadingText>Last recording</HeadingText>
        <Player source={{ uri: this.state.recordingUri }} />
      </>
    ) : null;

  render() {
    return (
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <HeadingText>Audio mode</HeadingText>
        <AudioModeSelector />
        <HeadingText>Recorder</HeadingText>
        <Recorder onDone={this._handleRecordingFinished} />
        {this._maybeRenderLastRecording()}
      </ScrollView>
    );
  }
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
