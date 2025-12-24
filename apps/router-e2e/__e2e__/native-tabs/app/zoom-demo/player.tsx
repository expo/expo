import FontAwesomeIcons from '@expo/vector-icons/FontAwesome5';
import { Stack, router } from 'expo-router';
import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  ColorValue,
  DynamicColorIOS,
  ScrollView,
} from 'react-native';

const DISMISS_GESTURE_TOP_ZONE_HEIGHT = 150;

export default function PlayerScreen() {
  const [isPlaying, setIsPlaying] = useState(false);
  const textColor = Platform.select<ColorValue>({
    ios: DynamicColorIOS({ light: 'black', dark: 'white' }),
    default: 'black',
  });

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
          // presentation: 'transparentModal',
          // @ts-expect-error
          zoomDismissGestureTopZoneHeight: DISMISS_GESTURE_TOP_ZONE_HEIGHT,
        }}
      />
      <View style={styles.container}>
        <View style={[styles.dismissZone, { height: DISMISS_GESTURE_TOP_ZONE_HEIGHT }]}>
          <View style={styles.handle} />
          <Text style={styles.dismissZoneText}>
            Dismiss Gesture Zone ({DISMISS_GESTURE_TOP_ZONE_HEIGHT}px)
          </Text>
          <Text style={styles.dismissZoneSubtext}>Swipe down here to dismiss</Text>
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <View style={styles.albumArt}>
              <FontAwesomeIcons name="music" size={80} color="white" />
            </View>
            <Text style={[styles.nowPlaying, { color: textColor }]}>NOW PLAYING</Text>
            <Text style={[styles.songTitle, { color: textColor }]}>Zoom Demo Song</Text>
            <Text style={[styles.artistName, { color: textColor }]}>Test Artist</Text>
          </View>

          <View style={styles.controls}>
            <Pressable style={styles.controlButton}>
              <FontAwesomeIcons name="step-backward" size={32} color={textColor} />
            </Pressable>
            <Pressable style={styles.playButton} onPress={() => setIsPlaying(!isPlaying)}>
              <FontAwesomeIcons name={isPlaying ? 'pause' : 'play'} size={32} color="white" />
            </Pressable>
            <Pressable style={styles.controlButton}>
              <FontAwesomeIcons name="step-forward" size={32} color={textColor} />
            </Pressable>
          </View>

          <View style={styles.infoSection}>
            <View style={styles.infoBox}>
              <FontAwesomeIcons name="check-circle" size={20} color="#4CAF50" />
              <View style={styles.infoContent}>
                <Text style={[styles.infoTitle, { color: textColor }]}>Zoom Transition</Text>
                <Text style={styles.infoDescription}>
                  Opened with Apple zoom animation
                </Text>
              </View>
            </View>

            <View style={styles.infoBox}>
              <FontAwesomeIcons name="hand-pointer" size={20} color="#2196F3" />
              <View style={styles.infoContent}>
                <Text style={[styles.infoTitle, { color: textColor }]}>Restricted Dismiss</Text>
                <Text style={styles.infoDescription}>
                  Only top {DISMISS_GESTURE_TOP_ZONE_HEIGHT}px allows dismiss
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.trySection}>
            <Text style={[styles.tryTitle, { color: textColor }]}>Try it:</Text>
            <Text style={styles.tryText}>
              1. Swipe down from green zone → dismisses{'\n'}
              2. Swipe down below green → blocked
            </Text>
          </View>

          <Pressable style={styles.closeButton} onPress={() => router.back()}>
            <Text style={styles.closeButtonText}>Close</Text>
          </Pressable>
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  dismissZone: {
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
  },
  handle: {
    width: 40,
    height: 5,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 3,
    marginBottom: 8,
  },
  dismissZoneText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  dismissZoneSubtext: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    marginTop: 4,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  albumArt: {
    width: 200,
    height: 200,
    backgroundColor: 'blue',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  nowPlaying: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 2,
    marginBottom: 8,
  },
  songTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  artistName: {
    fontSize: 18,
    opacity: 0.7,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 40,
    marginBottom: 40,
  },
  controlButton: {
    padding: 10,
  },
  playButton: {
    width: 80,
    height: 80,
    backgroundColor: 'blue',
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoSection: {
    gap: 12,
    marginBottom: 24,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  infoDescription: {
    fontSize: 13,
    color: '#666',
  },
  trySection: {
    backgroundColor: '#e3f2fd',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  tryTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  tryText: {
    fontSize: 14,
    color: '#1565c0',
    lineHeight: 22,
  },
  closeButton: {
    backgroundColor: '#FF3B30',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
