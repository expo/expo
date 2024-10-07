import SegmentedControl from '@react-native-segmented-control/segmented-control';
import { setIsAudioActiveAsync } from 'expo-audio';
import React, { useState } from 'react';
import { PixelRatio, ScrollView, StyleSheet, Switch, Text, View, Image } from 'react-native';

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

  const getMetadata = () => {
    const baseMetadata = {
      title: 'Polonez May',
      artist: 'Wojciech Kilar',
      album: 'Kilar',
    };

    if (selectedSource === 'http') {
      return {
        ...baseMetadata,
        artwork: 'https://picsum.photos/200/300',
      };
    } else {
      // For local audio, use require for artwork
      return {
        ...baseMetadata,
        artwork: Image.resolveAssetSource(require('../../../../assets/images/example2.jpg')).uri,
      };
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
        <SegmentedControl
          values={['HTTP', 'Local']}
          selectedIndex={selectedSource === 'http' ? 0 : 1}
          onChange={(event) => {
            setSelectedSource(event.nativeEvent.selectedSegmentIndex === 0 ? 'http' : 'local');
          }}
          style={styles.segmentedControl}
        />
      </View>
      <AudioPlayer
        source={getAudioSource()}
        style={styles.player}
        enableLockScreenControls={enableLockScreenControls}
        metadata={getMetadata()}
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
  segmentedControl: {
    width: 200,
  },
});
