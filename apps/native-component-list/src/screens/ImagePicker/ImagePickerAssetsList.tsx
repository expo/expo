import { ResizeMode, Video } from 'expo-av';
import { ImagePickerAsset, ImagePickerResult } from 'expo-image-picker';
import React from 'react';
import { View, StyleSheet, Image } from 'react-native';

export default function ImagePickerAssetsList(result: ImagePickerResult): JSX.Element | void {
  return (
    <View>
      {result.assets?.map((asset, index) => (
        <AssetView key={index} asset={asset} />
      ))}
    </View>
  );
}

function AssetView({ asset }: { asset: ImagePickerAsset }) {
  if (!isAnObjectWithUriAndType(asset)) {
    return null;
  }
  return (
    <View style={styles.container}>
      {asset.type === 'video' ? (
        <Video
          source={{ uri: asset.uri }}
          style={styles.video}
          resizeMode={ResizeMode.CONTAIN}
          shouldPlay
          isLooping
        />
      ) : (
        <Image source={{ uri: asset.uri }} style={styles.image} />
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
