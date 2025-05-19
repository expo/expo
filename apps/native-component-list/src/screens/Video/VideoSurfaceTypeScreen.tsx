import { useVideoPlayer, VideoPlayer, VideoView } from 'expo-video';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

import { bigBuckBunnySource } from './videoSources';
import { styles } from './videoStyles';

function ProblematicOverlap({
  player1,
  player2,
  surfaceType,
  title,
}: {
  player1: VideoPlayer;
  player2: VideoPlayer;
  surfaceType: 'textureView' | 'surfaceView';
  title: string;
}) {
  return (
    <View>
      <Text style={[styles.centerText, styles.mediumText]}>{title}</Text>
      <View style={[styles.row, { maxWidth: '100%' }]}>
        <VideoView
          player={player1}
          style={[styles.video, borderStyle.border]}
          surfaceType={surfaceType}
          contentFit="cover"
        />
        <VideoView
          player={player2}
          style={[styles.video, borderStyle.border, { left: -150 }]}
          surfaceType={surfaceType}
          contentFit="cover"
        />
      </View>
    </View>
  );
}

export default function VideoDRMScreen() {
  const initializePlayer = (player: VideoPlayer) => {
    player.loop = true;
    player.play();
  };
  const player1 = useVideoPlayer(bigBuckBunnySource, initializePlayer);
  const player2 = useVideoPlayer(bigBuckBunnySource, initializePlayer);
  const player3 = useVideoPlayer(bigBuckBunnySource, initializePlayer);
  const player4 = useVideoPlayer(bigBuckBunnySource, initializePlayer);

  return (
    <View style={styles.contentContainer}>
      <ScrollView>
        <ProblematicOverlap
          player1={player1}
          player2={player2}
          surfaceType="surfaceView"
          title="SurfaceView - The video may go out of bounds, because of the surface view not clipping correctly. This is a known issue of ExoPlayer with SurfaceView."
        />
        <ProblematicOverlap
          player1={player3}
          player2={player4}
          surfaceType="textureView"
          title="TextureView - The video should not go out of bounds."
        />
      </ScrollView>
    </View>
  );
}

const borderStyle = StyleSheet.create({
  border: {
    borderWidth: 3,
    borderColor: 'red',
  },
});
