import { setIsAudioActiveAsync } from 'expo-audio';
import React, { useState } from 'react';
import { PixelRatio, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import AudioModeSelector from './AudioModeSelector';
import AudioPlayer from './AudioPlayer';
import HeadingText from '../../../components/HeadingText';
import ListButton from '../../../components/ListButton';

export default function AudioScreen(props: any) {
  const [enableLockScreenControls, setEnableLockScreenControls] = useState(false);
  const [selectedSource, setSelectedSource] = useState<'http' | 'local'>('http');

  React.useLayoutEffect(() => {
    props.navigation.setOptions({
      title: 'Audio (expo-audio)',
    });
  });

  const toggleLockScreenControls = () => {
    setEnableLockScreenControls(!enableLockScreenControls);
  };

  const getAudioSource = () => {
    if (selectedSource === 'http') {
      return {
        uri: 'https://p.scdn.co/mp3-preview/f7a8ab9c5768009b65a30e9162555e8f21046f46?cid=162b7dc01f3a4a2ca32ed3cec83d1e02',
      };
    } else {
      return require('../../../../assets/sounds/polonez.mp3');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.contentContainer}>
      <HeadingText>Audio state</HeadingText>
      <ListButton title="Activate Audio" onPress={() => setIsAudioActiveAsync(true)} />
      <ListButton title="Deactivate Audio" onPress={() => setIsAudioActiveAsync(false)} />
      <HeadingText>Audio mode</HeadingText>
      <AudioModeSelector />
      <HeadingText>Audio Player</HeadingText>
      <View style={styles.controlsContainer}>
        <Text>Enable Lock Screen Controls:</Text>
        <Switch value={enableLockScreenControls} onValueChange={toggleLockScreenControls} />
      </View>
      <View style={styles.controlsContainer}>
        <Text>Audio Source:</Text>
        <Switch
          value={selectedSource === 'http'}
          onValueChange={(value) => setSelectedSource(value ? 'http' : 'local')}
        />
        <Text>{selectedSource === 'http' ? 'HTTP' : 'Local'}</Text>
      </View>
      <AudioPlayer
        source={getAudioSource()}
        style={styles.player}
        enableLockScreenControls={enableLockScreenControls}
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
  controlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
});
