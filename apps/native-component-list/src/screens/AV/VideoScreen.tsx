import React from 'react';
import { PixelRatio, ScrollView, StyleSheet } from 'react-native';

import HeadingText from '../../components/HeadingText';
import VideoPlayer from './VideoPlayer';

export default function VideoScreen() {
  return (
    <ScrollView contentContainerStyle={styles.contentContainer}>
      <HeadingText>HTTP player</HeadingText>
      <VideoPlayer source={{ uri: 'http://d23dyxeqlo5psv.cloudfront.net/big_buck_bunny.mp4' }} />
      <HeadingText>Local asset player</HeadingText>
      <VideoPlayer source={require('../../../assets/videos/ace.mp4')} />
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
