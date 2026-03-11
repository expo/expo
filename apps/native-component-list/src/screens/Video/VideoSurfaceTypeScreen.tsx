import { useEvent } from 'expo';
import { useVideoPlayer, VideoPlayer, VideoView } from 'expo-video';
import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Button } from 'react-native';

import { bigBuckBunnySource } from './videoSources';
import { styles } from './videoStyles';
import { E2EViewShotContainer } from '../../components/E2EViewShotContainer';

function ProblematicOverlap({
  player1,
  player2,
  surfaceType,
  title,
  nativeControls,
}: {
  player1: VideoPlayer;
  player2: VideoPlayer;
  surfaceType: 'textureView' | 'surfaceView';
  title: string;
  nativeControls: boolean;
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
          nativeControls={nativeControls}
        />
        <VideoView
          player={player2}
          style={[styles.video, borderStyle.border, { left: -150 }]}
          surfaceType={surfaceType}
          contentFit="cover"
          nativeControls={nativeControls}
        />
      </View>
    </View>
  );
}

export default function VideoSurfaceTypeScreen() {
  const initializePlayer = (player: VideoPlayer) => {
    player.loop = true;
    player.play();
  };
  const player1 = useVideoPlayer(bigBuckBunnySource, initializePlayer);
  const player2 = useVideoPlayer(bigBuckBunnySource, initializePlayer);
  const player3 = useVideoPlayer(bigBuckBunnySource, initializePlayer);
  const player4 = useVideoPlayer(bigBuckBunnySource, initializePlayer);
  const [nativeControls, setNativeControls] = useState(true);
  const [e2eSetupDone, setE2eSetupDone] = useState(false);

  const { status: s1 } = useEvent(player1, 'statusChange', { status: player1.status });
  const { status: s2 } = useEvent(player2, 'statusChange', { status: player2.status });
  const { status: s3 } = useEvent(player3, 'statusChange', { status: player3.status });
  const { status: s4 } = useEvent(player4, 'statusChange', { status: player4.status });
  const allReady =
    s1 === 'readyToPlay' && s2 === 'readyToPlay' && s3 === 'readyToPlay' && s4 === 'readyToPlay';

  return (
    <View style={styles.contentContainer}>
      <ScrollView>
        <E2EViewShotContainer
          testID="surface-type-test"
          screenshotOutputPath="expo-video/screenshots/surface-type-1">
          <ProblematicOverlap
            player1={player1}
            player2={player2}
            surfaceType="surfaceView"
            title="SurfaceView - The video may go out of bounds, because of the surface view not clipping correctly. This is a known issue of ExoPlayer with SurfaceView."
            nativeControls={nativeControls}
          />
          <ProblematicOverlap
            player1={player3}
            player2={player4}
            surfaceType="textureView"
            title="TextureView - The video should not go out of bounds."
            nativeControls={nativeControls}
          />
        </E2EViewShotContainer>
      </ScrollView>

      <Button
        title="e2e setup"
        onPress={() => {
          [player1, player2, player3, player4].forEach((player) => {
            player.pause();
            setNativeControls(false);
            player.currentTime = 10;
          });
          setE2eSetupDone(true);
        }}
      />
      {e2eSetupDone && allReady && <Text>Players ready</Text>}
    </View>
  );
}

const borderStyle = StyleSheet.create({
  border: {
    borderWidth: 3,
    borderColor: 'red',
  },
});
