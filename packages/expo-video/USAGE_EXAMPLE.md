# PIP Restoration Hooks Usage Example

This example demonstrates how to use the new PIP restoration hooks that solve iOS PIP restoration failures when VideoView components are unmounted due to navigation.

## Basic Usage

```tsx
import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { createVideoPlayer, VideoView } from 'expo-video-pip-hooks';
import { useNavigation } from '@react-navigation/native';

function VideoScreen() {
  const navigation = useNavigation();
  
  // Create a persistent player that survives component lifecycles
  const player = createVideoPlayer('https://example.com/video.mp4');

  useEffect(() => {
    // Set PIP restoration callbacks on the player (survives component unmounting)
    player.setPipRestoreCallbacks({
      onBeforePipRestore: async (context) => {
        console.log('PIP restoration requested:', context);
        
        // Navigate back to video screen before allowing restoration
        navigation.navigate('VideoScreen', { playerId: context.playerId });

        // Allow restoration with small delay for navigation to complete
        return {
          allowRestore: true,
          delay: 300,
          metadata: { restoredAt: Date.now() }
        };
      },

      onAfterPipRestore: (context) => {
        console.log('PIP restored successfully:', context);
        // Optional: Analytics, state updates, etc.
      },

      onPipRestoreFailed: (error) => {
        console.error('PIP restoration failed:', error);
        // Optional: Error reporting, fallback actions
      }
    });

    // Cleanup when screen unmounts permanently
    return () => {
      player.clearPipRestoreCallbacks();
      // Only release player when truly done (not just navigating away)
      // player.release();
    };
  }, [player, navigation]);

  return (
    <View style={styles.container}>
      <VideoView
        player={player}
        allowsPictureInPicture={true}
        style={styles.video}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  video: {
    width: '100%',
    height: 300,
  },
});

export default VideoScreen;
```

## Advanced Usage with Navigation State

```tsx
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { createVideoPlayer, VideoView } from 'expo-video-pip-hooks';
import { useNavigation, useIsFocused } from '@react-navigation/native';

function VideoScreen({ route }) {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const playerRef = useRef(null);

  // Get or create persistent player
  if (!playerRef.current) {
    playerRef.current = createVideoPlayer('https://example.com/video.mp4');
  }

  const player = playerRef.current;

  useEffect(() => {
    // Set up PIP restoration callbacks
    player.setPipRestoreCallbacks({
      onBeforePipRestore: async (context) => {
        // Check if we're already on the video screen
        if (isFocused) {
          return { allowRestore: true };
        }

        // Navigate back to video screen
        navigation.navigate('VideoScreen', { 
          playerId: context.playerId,
          timestamp: context.currentTime 
        });

        return {
          allowRestore: true,
          delay: 500, // Allow time for navigation
          metadata: { 
            navigationRequired: true,
            originalTime: context.currentTime 
          }
        };
      },

      onAfterPipRestore: (context) => {
        console.log('Video restored to fullscreen:', {
          playerId: context.playerId,
          currentTime: context.currentTime,
          wasPlaying: context.isPlaying
        });
      },

      onPipRestoreFailed: (error) => {
        console.error('Failed to restore video:', error);
        
        // Fallback: Show notification or navigate manually
        navigation.navigate('VideoScreen');
      }
    });

    return () => {
      // Only clear callbacks when component is being destroyed permanently
      // (not just navigating away)
      if (!isFocused) {
        // Keep callbacks active during navigation
      }
    };
  }, [player, navigation, isFocused]);

  // Resume playback if returning from PIP restoration
  useEffect(() => {
    if (route.params?.timestamp && player) {
      player.currentTime = route.params.timestamp;
    }
  }, [route.params?.timestamp, player]);

  return (
    <View style={styles.container}>
      <VideoView
        player={player}
        allowsPictureInPicture={true}
        style={styles.video}
        nativeControls={true}
      />
    </View>
  );
}

export default VideoScreen;
```

## Key Benefits

1. **Persistent Callbacks**: Callbacks survive VideoView component mount/unmount cycles
2. **Navigation-Aware**: Automatically handle navigation back to video screen
3. **Type-Safe**: Full TypeScript support with proper interfaces
4. **Error Handling**: Comprehensive error reporting and fallback options
5. **Platform Compatibility**: Works on iOS (primary), graceful fallbacks on Android/Web

## Technical Details

- **iOS**: Full PIP restoration support with native delegate handling
- **Android**: Graceful no-op (Android PIP works differently)
- **Web**: Graceful no-op (Web PIP API is different)
- **Expo Compatibility**: Works with EAS managed workflow and custom development builds
