import { Video } from 'expo-av';
import React from 'react';
import { View } from 'react-native';

export const title = 'Video';
export const packageJson = require('expo-av/package.json');
export const label = 'Video';
export const kind = 'SDK|AV';
export const component = () => (
  <View>
    <Video
      source={{ uri: 'http://d23dyxeqlo5psv.cloudfront.net/big_buck_bunny.mp4' }}
      rate={1.0}
      volume={1.0}
      isMuted={false}
      resizeMode="cover"
      shouldPlay
      isLooping
      style={{ width: 300, height: 300 }}
    />
  </View>
);
