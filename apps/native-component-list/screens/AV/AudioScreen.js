import React from 'react';
import { Audio, Asset } from 'expo';
import { ScrollView, StyleSheet, PixelRatio } from 'react-native';

import ListButton from '../../components/ListButton';
import HeadingText from '../../components/HeadingText';

import Player from './Player';
import AudioModeSelector from './AudioModeSelector';

export default class AuthSessionScreen extends React.Component {
  static navigationOptions = {
    title: 'Audio',
  };

  _setAudioActive = active => () => Audio.setIsEnabledAsync(active);

  render() {
    return (
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <HeadingText style={styles.headingText}>Audio state</HeadingText>
        <ListButton title="Activate Audio" onPress={this._setAudioActive(true)} />
        <ListButton title="Deactivate Audio" onPress={this._setAudioActive(false)} />
        <HeadingText style={styles.headingText}>Audio mode</HeadingText>
        <AudioModeSelector />
        <HeadingText style={styles.headingText}>HTTP player</HeadingText>
        <Player
          source={{
            uri:
              'https://p.scdn.co/mp3-preview/f7a8ab9c5768009b65a30e9162555e8f21046f46?cid=162b7dc01f3a4a2ca32ed3cec83d1e02',
          }}
          style={styles.player}
        />
        <HeadingText style={styles.headingText}>Local asset player</HeadingText>
        <Player
          source={Asset.fromModule(require('../../assets/sounds/polonez.mp3'))}
          style={styles.player}
        />
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
