import React from 'react';
import { PixelRatio, ScrollView, StyleSheet } from 'react-native';

import HeadingText from '../../components/HeadingText';
import VideoPlayer from './VideoPlayer';

export default function VideoScreen() {
  return (
    <ScrollView contentContainerStyle={styles.contentContainer}>
      <HeadingText>HTTP player</HeadingText>
      <VideoPlayer
        sources={[
          { uri: 'http://d23dyxeqlo5psv.cloudfront.net/big_buck_bunny.mp4' },
          { uri: 'http://techslides.com/demos/sample-videos/small.mp4' },
          { uri: 'http://qthttp.apple.com.edgesuite.net/1010qwoeiuryfg/sl.m3u8' },
        ]}
      />
      <HeadingText>Local asset player</HeadingText>
      <VideoPlayer
        sources={[
          require('../../../assets/videos/ace.mp4'),
          require('../../../assets/videos/star.mp4'),
        ]}
      />
    </ScrollView>
  );
}
VideoScreen.navigationOptions = {
  title: 'Video',
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
