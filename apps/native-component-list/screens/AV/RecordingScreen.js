import React from 'react';
import { ScrollView, StyleSheet, PixelRatio } from 'react-native';

import Recorder from './Recorder';
import HeadingText from '../../components/HeadingText';

import AudioModeSelector from './AudioModeSelector';
import Player from './AudioPlayer';

export default class AuthSessionScreen extends React.Component {
  static navigationOptions = {
    title: 'Audio',
  };

  state = {
    recordingUri: null,
  };

  _handleRecordingFinished = recordingUri => this.setState({ recordingUri });

  _maybeRenderLastRecording = () =>
    this.state.recordingUri ? (
      <React.Fragment>
        <HeadingText style={styles.headingText}>Last recording</HeadingText>
        <Player source={{ uri: this.state.recordingUri }} />
      </React.Fragment>
    ) : null;

  render() {
    return (
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <HeadingText style={styles.headingText}>Audio mode</HeadingText>
        <AudioModeSelector />
        <HeadingText style={styles.headingText}>Recorder</HeadingText>
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
