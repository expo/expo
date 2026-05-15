import Ionicons from '@expo/vector-icons/build/Ionicons';
import { useAudioStream, AudioModule, AudioStreamBuffer, AudioStreamEncoding } from 'expo-audio';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import Button from '../../components/Button';
import HeadingText from '../../components/HeadingText';
import Colors from '../../constants/Colors';

const MAX_BARS = 60;
const BAR_WIDTH = 3;
const BAR_GAP = 2;
const WAVEFORM_HEIGHT = 120;

function computeRMS(buffer: AudioStreamBuffer): number {
  if (buffer.data.byteLength === 0) {
    return 0;
  }
  const float32 = new Float32Array(buffer.data);

  let sum = 0;
  const step = Math.max(1, Math.floor(float32.length / 512));
  let count = 0;
  for (let i = 0; i < float32.length; i += step) {
    sum += float32[i] * float32[i];
    count++;
  }
  return Math.sqrt(sum / count);
}

function computeRMSInt16(buffer: AudioStreamBuffer): number {
  const int16 = new Int16Array(buffer.data);
  if (int16.length === 0) return 0;

  let sum = 0;
  const step = Math.max(1, Math.floor(int16.length / 512));
  let count = 0;
  for (let i = 0; i < int16.length; i += step) {
    const normalized = int16[i] / 32768;
    sum += normalized * normalized;
    count++;
  }
  return Math.sqrt(sum / count);
}

function WaveformBar({ amplitude }: { amplitude: number }) {
  const height = useSharedValue(4);

  useEffect(() => {
    const mapped = Math.min(1, amplitude * 20);
    const targetHeight = Math.max(4, mapped * WAVEFORM_HEIGHT);
    height.value = withTiming(targetHeight, { duration: 80 });
  }, [amplitude]);

  const animatedStyle = useAnimatedStyle(() => ({
    height: height.value,
  }));

  return <Animated.View style={[styles.bar, animatedStyle]} />;
}

function Waveform({ amplitude }: { amplitude: number }) {
  const bars = Array.from({ length: MAX_BARS }, (_, i) => {
    const center = (MAX_BARS - 1) / 2;
    const dist = Math.abs(i - center) / center; // 0 at center, 1 at edges
    const falloff = Math.pow(1 - dist, 1.5);
    const jitter = 0.85 + 0.3 * Math.sin(i * 2.7 + amplitude * 50);
    return amplitude * falloff * jitter;
  });

  return (
    <View style={styles.waveformContainer}>
      {bars.map((amp, i) => (
        <WaveformBar key={i} amplitude={amp} />
      ))}
    </View>
  );
}

export default function RecordingStreamScreen() {
  const [encoding, setEncoding] = useState<AudioStreamEncoding>('float32');
  const [amplitude, setAmplitude] = useState(0);
  const [bufferCount, setBufferCount] = useState(0);
  const [streamInfo, setStreamInfo] = useState<{
    sampleRate: number;
    channels: number;
    byteLength: number;
  } | null>(null);

  useEffect(() => {
    (async () => {
      const status = await AudioModule.requestRecordingPermissionsAsync();
      if (!status.granted) {
        Alert.alert('Permission to access microphone was denied');
      }
    })();
  }, []);

  const onBuffer = useCallback(
    (buffer: AudioStreamBuffer) => {
      const rms = encoding === 'int16' ? computeRMSInt16(buffer) : computeRMS(buffer);
      setAmplitude(rms);

      setBufferCount((c) => c + 1);
      setStreamInfo({
        sampleRate: buffer.sampleRate,
        channels: buffer.channels,
        byteLength: buffer.data.byteLength,
      });
    },
    [encoding]
  );

  const { stream, isStreaming } = useAudioStream({
    sampleRate: 16000,
    channels: 1,
    encoding,
    onBuffer,
  });

  const handleStart = async () => {
    try {
      setAmplitude(0);
      setBufferCount(0);
      setStreamInfo(null);
      await stream.start();
    } catch (error: any) {
      Alert.alert('Error starting stream', error.message);
    }
  };

  const handleStop = () => {
    stream.stop();
    setAmplitude(0);
  };

  return (
    <ScrollView contentContainerStyle={styles.contentContainer}>
      <HeadingText>Recording Stream</HeadingText>

      <View style={styles.encodingRow}>
        <Button
          onPress={() => setEncoding('float32')}
          title={`${encoding === 'float32' ? '✓ ' : ''}Float32`}
        />
        <Button
          onPress={() => setEncoding('int16')}
          title={`${encoding === 'int16' ? '✓ ' : ''}Int16`}
        />
      </View>

      <View style={styles.waveformOuter}>
        <Waveform amplitude={amplitude} />
      </View>

      <View style={styles.centerer}>
        {!isStreaming ? (
          <TouchableOpacity
            onPress={handleStart}
            style={[styles.bigRoundButton, { backgroundColor: Colors.tintColor }]}>
            <Ionicons name="mic" style={[styles.bigIcon, { color: 'white' }]} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={handleStop}
            style={[styles.bigRoundButton, { backgroundColor: 'red' }]}>
            <Ionicons name="square" style={[styles.bigIcon, { color: 'white' }]} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.infoLabel}>Status: {isStreaming ? 'Streaming' : 'Stopped'}</Text>
        <Text style={styles.infoLabel}>Buffers received: {bufferCount}</Text>
        {streamInfo && (
          <>
            <Text style={styles.infoLabel}>Sample rate: {streamInfo.sampleRate} Hz</Text>
            <Text style={styles.infoLabel}>Channels: {streamInfo.channels}</Text>
            <Text style={styles.infoLabel}>Buffer size: {streamInfo.byteLength} bytes</Text>
            <Text style={styles.infoLabel}>Encoding: {encoding}</Text>
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    padding: 16,
  },
  encodingRow: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
    marginVertical: 10,
  },
  waveformOuter: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 12,
    marginVertical: 16,
    height: WAVEFORM_HEIGHT + 24,
    justifyContent: 'center',
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: WAVEFORM_HEIGHT,
    gap: BAR_GAP,
  },
  bar: {
    width: BAR_WIDTH,
    backgroundColor: '#4cc9f0',
    borderRadius: BAR_WIDTH / 2,
    minHeight: 4,
  },
  centerer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
  },
  bigRoundButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bigIcon: {
    fontSize: 40,
  },
  infoContainer: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    gap: 4,
  },
  infoLabel: {
    fontSize: 14,
    color: '#333',
  },
});
