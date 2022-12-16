import React from 'react';
import { View, StyleSheet, Image } from 'react-native';

export default function ImagePreview(result: unknown) {
  if (!isClipboardImageObject(result)) {
    return;
  }

  return (
    <View style={styles.container}>
      <Image source={{ uri: result.data }} style={styles.image} />
    </View>
  );
}

function isClipboardImageObject(
  obj: unknown
): obj is { data: string; size: { width: string; height: string } } {
  return (
    obj !== null &&
    typeof obj === 'object' &&
    typeof (obj as any).data === 'string' &&
    typeof (obj as any).size === 'object' &&
    typeof (obj as any).size.width === 'number' &&
    typeof (obj as any).size.height === 'number'
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
});
