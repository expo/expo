import { router, useIsPreview, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { View, Pressable } from 'react-native';

import { useVideoPlayer, VideoView } from 'expo-video';

export default function VideoPreview() {
  const { url } = useLocalSearchParams();
  console.log('VideoPreview', url);
  const videoSource =
    url ?? 'https://videos.pexels.com/video-files/854262/854262-sd_960_540_24fps.mp4';

  const preview = useIsPreview();

  const player = useVideoPlayer(videoSource, (player) => {
    player.loop = true;
    if (!preview) {
      player.play();
    } else {
      player.pause();
    }
  });

  return (
    <Pressable onPress={() => router.dismiss()} style={{ flex: 1 }}>
      <View
        style={{
          backgroundColor: 'black',
          flex: 1,
          alignItems: 'stretch',
          justifyContent: 'center',
        }}>
        <VideoView
          style={{
            width: '100%',
            minHeight: 300,
          }}
          player={player}
          contentFit="cover"
          nativeControls={false}
          allowsFullscreen={false}
          allowsPictureInPicture={false}
        />
      </View>
    </Pressable>
  );
}
