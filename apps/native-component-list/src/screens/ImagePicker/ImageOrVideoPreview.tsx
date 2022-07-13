import { ResizeMode, Video } from 'expo-av';
import React from 'react';
import { View, StyleSheet, Image, FlatList } from 'react-native';

export default function ImageOrVideo(result: unknown): JSX.Element | void {
  if (isMultipleSelectionResult(result)) {
    if (result.selected.length === 1) {
      return ImageOrVideo(result.selected[0]);
    }

    return (
      <View style={styles.container}>
        <FlatList
          horizontal
          data={result.selected}
          renderItem={({ item, index }) => <View key={index}>{ImageOrVideo(item) ?? null}</View>}
        />
      </View>
    );
  }

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

function isMultipleSelectionResult(obj: unknown): obj is { cancelled: false; selected: unknown[] } {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    (obj as any).cancelled === false &&
    Array.isArray((obj as any).selected)
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
