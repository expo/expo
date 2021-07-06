import { Asset } from 'expo-asset';
import { Audio } from 'expo-av';
import React from 'react';
import { PixelRatio, ScrollView, StyleSheet } from 'react-native';

import HeadingText from '../../components/HeadingText';
import ListButton from '../../components/ListButton';
import AudioModeSelector from './AudioModeSelector';
import Player from './AudioPlayer';

interface Channel {
  frames: number[];
}

interface AudioSample {
  channels: Channel[];
}

export default class AudioScreen extends React.Component {
  static navigationOptions = {
    title: 'Audio',
  };

  _setAudioActive = (active: boolean) => () => Audio.setIsEnabledAsync(active);

  _didThingy: boolean = false;
  doThingy() {
    if (this._didThingy) return;
    if (global.setAudioCallback == null) return;
    global.setAudioCallback((sample: AudioSample) => {
      console.log(
        `Received sample data! ${sample.channels.length} Channels; ${sample.channels[0].frames.length} Frames; ${sample.channels[0].frames[0]}`
      );
    });
    this._didThingy = true;
  }

  componentDidMount() {
    setInterval(() => {
      this.doThingy();
    }, 1000);
  }

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
            uri:
              // tslint:disable-next-line: max-line-length
              'https://p.scdn.co/mp3-preview/f7a8ab9c5768009b65a30e9162555e8f21046f46?cid=162b7dc01f3a4a2ca32ed3cec83d1e02',
          }}
          style={styles.player}
        />
        <HeadingText>Local asset player</HeadingText>
        <Player
          source={Asset.fromModule(require('../../../assets/sounds/polonez.mp3'))}
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
