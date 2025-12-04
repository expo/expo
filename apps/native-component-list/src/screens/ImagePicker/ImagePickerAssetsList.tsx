import { ImagePickerAsset, ImagePickerResult } from 'expo-image-picker';
import { useVideoPlayer, VideoView } from 'expo-video';
import React from 'react';
import { View, StyleSheet, Image } from 'react-native';

export default function ImagePickerAssetsList(
  result: ImagePickerResult
): React.ReactElement | void {
  return (
    <View>
      {result.assets?.map((asset, index) => <AssetViewContainer key={index} asset={asset} />)}
    </View>
  );
}

type AssetViewProps = {
  asset: ImagePickerAsset;
};

function ImageAssetView({ asset }: AssetViewProps) {
  return <Image source={{ uri: asset.uri }} style={styles.image} />;
}

function VideoAssetView({ asset }: AssetViewProps) {
  const player = useVideoPlayer(asset.uri, (player) => {
    player.loop = true;
    player.play();
  });
  return <VideoView player={player} style={styles.video} />;
}

function AssetViewContainer({ asset }: AssetViewProps) {
  return (
    <View style={styles.container}>
      {asset.type === 'video' ? <VideoAssetView asset={asset} /> : <ImageAssetView asset={asset} />}
    </View>
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
