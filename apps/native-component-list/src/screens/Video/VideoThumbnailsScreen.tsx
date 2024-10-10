import { Image } from 'expo-image';
import { useVideoPlayer, VideoView, VideoThumbnail } from 'expo-video';
import { useCallback, useState } from 'react';
import { PixelRatio, ScrollView, StyleSheet, Text, View } from 'react-native';

import { bigBuckBunnySource } from './videoSources';
import Button from '../../components/Button';

export default function VideoScreen() {
  const [thumbnails, setThumbnails] = useState<VideoThumbnail[]>([]);
  const [generationTime, setGenerationTime] = useState<number | null>(null);
  const player = useVideoPlayer(bigBuckBunnySource);

  const generateThumbnails = useCallback(async () => {
    const times = [
      Math.random() * player.duration,
      Math.random() * player.duration,
      Math.random() * player.duration,
    ];
    const start = performance.now();
    const thumbnails = await player.generateThumbnailsAsync(times);
    const end = performance.now();

    setGenerationTime(end - start);
    setThumbnails(thumbnails);
  }, [player]);

  return (
    <View style={styles.contentContainer}>
      <View style={styles.videoContainer}>
        <VideoView style={styles.video} player={player} />
      </View>

      <Button style={styles.button} title="Generate thumbnails" onPress={generateThumbnails} />

      <ScrollView contentContainerStyle={styles.thumbnails}>
        {generationTime && <Text>Generated thumbnails in {generationTime.toFixed(2)}ms</Text>}

        {thumbnails.map((thumbnail, index) => {
          return <Image key={index} source={thumbnail} style={styles.thumbnail} />;
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
  },
  videoContainer: {
    flexDirection: 'row',
    padding: 20,
  },
  video: {
    flex: 1,
    height: 225,
    borderWidth: 1.0 / PixelRatio.get(),
    borderColor: '#cccccc',
  },
  button: {
    margin: 5,
  },
  thumbnails: {
    alignItems: 'center',
  },
  thumbnail: {
    marginTop: 20,
    width: 240,
    height: 135,
  },
});
