import { CameraView, RecordingProgress } from 'expo-camera';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useRef, useState } from 'react';
import { Button, Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const MAX_DURATION = 10;
const PROGRESS_INTERVAL = 0.25;
const RING_SIZE = 84;
const STROKE_WIDTH = 5;
const RADIUS = (RING_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const { width } = Dimensions.get('window');

export default function CameraScreenRecordingProgress() {
  const camera = useRef<CameraView>(null);
  const player = useVideoPlayer(null);
  const insets = useSafeAreaInsets();

  const [recording, setRecording] = useState(false);
  const [stats, setStats] = useState('');
  const [uri, setUri] = useState('');
  const progress = useSharedValue(0);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: CIRCUMFERENCE * (1 - progress.value),
  }));

  const onRecordingProgress = ({ duration, fileSize, maxDuration }: RecordingProgress) => {
    if (maxDuration) {
      // Animate over one event interval so the arc glides between ticks.
      progress.value = withTiming(Math.min(duration / maxDuration, 1), {
        duration: PROGRESS_INTERVAL * 1000,
      });
    }
    setStats(
      `${duration.toFixed(1)}s of ${MAX_DURATION}s, ${(fileSize / (1024 * 1024)).toFixed(2)} MB`
    );
  };

  const record = async () => {
    if (recording) {
      camera.current?.stopRecording();
      return;
    }
    setRecording(true);
    setStats('');
    progress.value = 0;
    try {
      const result = await camera.current?.recordAsync({
        maxDuration: MAX_DURATION,
        progressUpdateInterval: PROGRESS_INTERVAL,
      });
      setUri(result?.uri ?? '');
      player.replace({ uri: result?.uri });
    } finally {
      setRecording(false);
    }
  };

  if (uri) {
    return (
      <View style={styles.screen}>
        <VideoView player={player} style={{ width, aspectRatio: 1 }} />
        <Button
          title="Go back to camera"
          onPress={() => {
            setUri('');
            setStats('');
            progress.value = 0;
          }}
        />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <CameraView
        ref={camera}
        style={StyleSheet.absoluteFill}
        facing="back"
        active
        mute
        mode="video"
        onRecordingProgress={onRecordingProgress}
      />
      <View style={[styles.controls, { bottom: insets.bottom + 16 }]}>
        {!!stats && <Text style={styles.stats}>{stats}</Text>}
        <Pressable style={styles.shutter} onPress={record}>
          <Svg width={RING_SIZE} height={RING_SIZE}>
            <Circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RADIUS}
              stroke="white"
              strokeWidth={STROKE_WIDTH}
              fill="rgba(0, 0, 0, 0.3)"
            />
            <AnimatedCircle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RADIUS}
              stroke="red"
              strokeWidth={STROKE_WIDTH}
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              fill="transparent"
              animatedProps={animatedProps}
              transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
            />
          </Svg>
          <View style={[styles.shutterInner, recording && styles.shutterInnerRecording]} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  controls: {
    position: 'absolute',
    alignItems: 'center',
    gap: 12,
  },
  stats: {
    color: 'white',
    fontVariant: ['tabular-nums'],
  },
  shutter: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterInner: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'red',
  },
  shutterInnerRecording: {
    borderRadius: 8,
  },
});
