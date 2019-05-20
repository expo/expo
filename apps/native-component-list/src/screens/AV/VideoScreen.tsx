import React from 'react';
import { ScrollView, StyleSheet, PixelRatio } from 'react-native';

import HeadingText from '../../components/HeadingText';

import VideoPlayer from './VideoPlayer';

export default class VideoScreen extends React.Component {
  static navigationOptions = {
    title: 'Video',
  };

  render() {
    return (
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <HeadingText>HTTP player</HeadingText>
        <VideoPlayer source={{ uri: 'http://d23dyxeqlo5psv.cloudfront.net/big_buck_bunny.mp4' }} />
        <HeadingText>Local asset player</HeadingText>
        <VideoPlayer source={require('../../../assets/videos/ace.mp4')} />
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
