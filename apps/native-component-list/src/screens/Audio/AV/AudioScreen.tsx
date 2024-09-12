import { Asset } from 'expo-asset';
import { Audio } from 'expo-av';
import React from 'react';
import { PixelRatio, ScrollView, StyleSheet } from 'react-native';

import AudioModeSelector from './AudioModeSelector';
import Player from './AudioPlayer';
import HeadingText from '../../../components/HeadingText';
import ListButton from '../../../components/ListButton';

export default class AudioScreen extends React.Component {
  static navigationOptions = {
    title: 'Audio (expo-av)',
  };

  _setAudioActive = (active: boolean) => () => Audio.setIsEnabledAsync(active);

  render() {
    return (
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <HeadingText>Audio state</HeadingText>
        <ListButton title="Activate Audio" onPress={this._setAudioActive(true)} />
        <ListButton title="Deactivate Audio" onPress={this._setAudioActive(false)} />
        <HeadingText>Audio mode</HeadingText>
        <AudioModeSelector />
        <HeadingText>HTTP player</HeadingText>
        <Player
          source={{
            uri: 'https://p.scdn.co/mp3-preview/f7a8ab9c5768009b65a30e9162555e8f21046f46?cid=162b7dc01f3a4a2ca32ed3cec83d1e02',
          }}
          style={styles.player}
        />
        <HeadingText>Local asset player</HeadingText>
        <Player
          source={Asset.fromModule(require('../../../../assets/sounds/polonez.mp3'))}
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
  player: {
    borderBottomWidth: 1.0 / PixelRatio.get(),
    borderBottomColor: '#cccccc',
  },
});
