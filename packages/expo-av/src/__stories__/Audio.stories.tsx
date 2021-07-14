import { Asset } from 'expo-asset';
import * as React from 'react';
import { PixelRatio, StyleSheet } from 'react-native';

import AudioModeSelector from './components/AudioModeSelector';
import AudioPlayer from './components/AudioPlayer';

export const AudioHttpPlayer = () => (
  <AudioPlayer
    source={{
      uri:
        // tslint:disable-next-line: max-line-length
        'https://p.scdn.co/mp3-preview/f7a8ab9c5768009b65a30e9162555e8f21046f46?cid=162b7dc01f3a4a2ca32ed3cec83d1e02',
    }}
    style={styles.player}
  />
);

AudioHttpPlayer.storyConfig = {
  name: 'Http Player',
};

export const LocalAssetPlayer = () => (
  <AudioPlayer
    source={Asset.fromModule(require('./assets/sounds/polonez.mp3'))}
    style={styles.player}
  />
);

LocalAssetPlayer.storyConfig = {
  name: 'Local Asset Player',
};


export const ModeSelector = () => <AudioModeSelector />;

ModeSelector.storyConfig = {
  name: 'Audio Selector',
};

export default {
  title: 'Audio',
};

const styles = StyleSheet.create({
  contentContainer: {
    padding: 10,
  },
  player: {
    borderBottomWidth: 1.0 / PixelRatio.get(),
    borderBottomColor: '#cccccc',
  },
});
