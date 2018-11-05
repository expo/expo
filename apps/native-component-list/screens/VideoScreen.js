import React from 'react';
import { View } from 'react-native';
import { Video } from 'expo';

export default class VideoScreen extends React.Component {
  static navigationOptions = {
    title: 'Video of a dog',
  };
  
  render() {
    return (
      <View
        style={{
          flex: 1,
          padding: 10,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <Video
          source={require('../assets/videos/ace.mp4')}
          resizeMode="cover"
          style={{ width: 300, height: 300 }}
          isMuted
          shouldPlay
          useNativeControls
          isLooping
        />
      </View>
    );
  }
}
