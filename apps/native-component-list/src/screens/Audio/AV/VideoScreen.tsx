import React from 'react';
import { PixelRatio, ScrollView, StyleSheet } from 'react-native';

import VideoPlayer from './VideoPlayer';
import HeadingText from '../../../components/HeadingText';

export default function VideoScreen() {
  return (
    <ScrollView contentContainerStyle={styles.contentContainer}>
      <HeadingText>HTTP player</HeadingText>
      <VideoPlayer
        sources={[
          { uri: 'https://d23dyxeqlo5psv.cloudfront.net/big_buck_bunny.mp4' },
          { uri: 'https://techslides.com/demos/sample-videos/small.mp4' },
          { uri: 'https://qthttp.apple.com.edgesuite.net/1010qwoeiuryfg/sl.m3u8' },
        ]}
      />
      <HeadingText>Local asset player</HeadingText>
      <VideoPlayer
        sources={[
          require('../../../../assets/videos/ace.mp4'),
          require('../../../../assets/videos/star.mp4'),
        ]}
      />
    </ScrollView>
  );
}
VideoScreen.navigationOptions = {
  title: 'Video (expo-av)',
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
