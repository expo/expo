import { spacing, shadows, borderRadius } from '@expo/styleguide-native';
import { Asset } from 'expo-asset';
import { Audio, AVPlaybackStatus } from 'expo-av';
import { Playback } from 'expo-av/build/AV';
import * as React from 'react';
import { StyleSheet, View } from 'react-native';

import { ProgressScrubber } from './PlayerControls';

type PlayerControlsProps = {
  player: Playback;
  status: Extract<AVPlaybackStatus, { isLoaded: true }>;
};

type PlaybackSource =
  | number
  | {
      uri: string;
      overrideFileExtensionAndroid?: string;
      headers?: {
        [fieldName: string]: string;
      };
    }
  | Asset;

type AudioPlayerProps = {
  source?: PlaybackSource;
  renderControls: (args: PlayerControlsProps) => React.ReactElement<any>;
};

export function AudioPlayer({ renderControls, source, ...props }: AudioPlayerProps) {
  const soundRef = React.useRef(new Audio.Sound()).current;
  const isMounted = React.useRef(false);
  const [status, setStatus] = React.useState<AVPlaybackStatus | null>(null);

  React.useEffect(() => {
    isMounted.current = true;
    return () => (isMounted.current = false);
  }, []);

  React.useEffect(() => {
    if (source != null) {
      soundRef
        .loadAsync(source)
        .then((playbackStatus) => {
          if (isMounted.current === true) {
            setStatus(playbackStatus);
          }
        })
        .catch((error) => {
          console.log({ error });
        });
    }

    soundRef.setOnPlaybackStatusUpdate((status) => {
      if (isMounted.current === true) {
        setStatus(status);
      }
    });

    return () => {
      soundRef.unloadAsync();
    };
  }, [source]);

  const shouldRenderControls = soundRef != null && status != null && status.isLoaded;

  if (!shouldRenderControls) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.progressContainer}>
        <ProgressScrubber status={status} player={soundRef} />
      </View>

      <View style={styles.controlsContainer}>{renderControls({ player: soundRef, status })}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    ...shadows.small,
    borderRadius: borderRadius.large,
  },
  progressContainer: {
    padding: spacing[2],
  },
  controlsContainer: {
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[4],
  },
});
