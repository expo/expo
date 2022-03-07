import { ResizeMode, Video } from 'expo-av';
import React from 'react';
import { View, StyleSheet, Image } from 'react-native';

export default function ImageOrVideo(result: unknown) {
  if (!isAnObjectWithUriAndType(result)) {
    return;
  }

  return (
    <View style={styles.container}>
      {result.type === 'video' ? (
        <Video
          source={{ uri: result.uri }}
          style={styles.video}
          resizeMode={ResizeMode.CONTAIN}
          shouldPlay
          isLooping
        />
      ) : (
        <Image source={{ uri: result.uri }} style={styles.image} />
      )}
    </View>
  );
}

function isAnObjectWithUriAndType(obj: unknown): obj is { uri: string; type: string } {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof (obj as any).uri === 'string' &&
    typeof (obj as any).type === 'string'
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  image: {
    width: 300,
    height: 200,
    resizeMode: 'contain',
  },
  video: {
    width: 300,
    height: 200,
  },
});
