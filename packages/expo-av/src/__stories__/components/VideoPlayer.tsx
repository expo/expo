import { spacing, shadows, borderRadius } from '@expo/styleguide-native';
import { Video, VideoProps, AVPlaybackStatus } from 'expo-av';
import { Playback } from 'expo-av/build/AV';
import * as React from 'react';
import { StyleSheet, View } from 'react-native';

import { ProgressScrubber } from './PlayerControls';

type VideoControlsProps = {
  player: Playback;
  status: Extract<AVPlaybackStatus, { isLoaded: true }>;
};

type VideoPlayerProps = VideoProps & {
  renderControls: (args: VideoControlsProps) => React.ReactElement<any>;
};

export function VideoPlayer({ renderControls, ...props }: VideoPlayerProps) {
  const [videoRef, setVideoRef] = React.useState<Video | null>(null);
  const [status, setStatus] = React.useState<AVPlaybackStatus | null>(null);

  const shouldRenderControls = videoRef != null && status != null && status.isLoaded;

  return (
    <View style={styles.container}>
      <Video
        onPlaybackStatusUpdate={setStatus}
        ref={(ref) => setVideoRef(ref)}
        style={styles.videoStyles}
        {...props}
      />
      <View style={styles.controlsContainer}>
        {shouldRenderControls && <ProgressScrubber status={status} player={videoRef} />}
        {shouldRenderControls && renderControls({ player: videoRef, status })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    ...shadows.small,
    borderRadius: borderRadius.large,
  },
  videoStyles: {
    borderTopLeftRadius: borderRadius.large,
    borderTopRightRadius: borderRadius.large,
    aspectRatio: 16 / 9,
  },
  controlsContainer: {
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
  },
});
