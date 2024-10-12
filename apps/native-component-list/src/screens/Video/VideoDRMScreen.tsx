import { Platform } from 'expo-modules-core';
import { useVideoPlayer, VideoView } from 'expo-video';
import { View, Text } from 'react-native';

import { androidDrmSource } from './videoSources';
import { styles } from './videoStyles';

export default function VideoDRMScreen() {
  const source = Platform.OS === 'android' ? androidDrmSource : null;
  const player = useVideoPlayer(source, (player) => {
    player.loop = true;
    player.play();
  });

  if (Platform.OS === 'ios') {
    return (
      <View style={styles.contentContainer}>
        <Text style={[styles.centerText, styles.mediumText]}>
          Please provide a custom DRM source for iOS
        </Text>
      </View>
    );
  }

  if (Platform.OS === 'web') {
    return (
      <View style={styles.contentContainer}>
        <Text style={[styles.centerText, styles.mediumText]}>
          DRM playback is not supported on web
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.contentContainer}>
      <VideoView player={player} style={styles.video} />
    </View>
  );
}
