import Ionicons from '@expo/vector-icons/build/Ionicons';
import {
  useAudioStream,
  useAudioPlayer,
  useAudioPlayerStatus,
  AudioModule,
  AudioStreamBuffer,
  AudioStreamEncoding,
  AudioStreamFileRecordingResult,
} from 'expo-audio';
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

type RecordedFile = AudioStreamFileRecordingResult;

function PlaybackControls({ uri, onClose }: { uri: string; onClose: () => void }) {
  const player = useAudioPlayer(uri);
  const status = useAudioPlayerStatus(player);

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.playbackContainer}>
      <Text style={styles.playbackUri} numberOfLines={2}>
        {uri}
      </Text>
      <View style={styles.playbackRow}>
        {status.playing ? (
          <TouchableOpacity
            style={[styles.playbackButton, { backgroundColor: Colors.tintColor }]}
            onPress={() => player.pause()}>
            <Ionicons name="pause" style={styles.playbackIcon} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.playbackButton, { backgroundColor: Colors.tintColor }]}
            onPress={() => player.play()}>
            <Ionicons name="play" style={styles.playbackIcon} />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.playbackButton, { backgroundColor: '#888' }]}
          onPress={() => {
            player.pause();
            player.seekTo(0);
          }}>
          <Ionicons name="stop" style={styles.playbackIcon} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.playbackButton, { backgroundColor: '#c00' }]}
          onPress={onClose}>
          <Ionicons name="close" style={styles.playbackIcon} />
        </TouchableOpacity>
      </View>
      <Text style={styles.playbackTime}>
        {formatDuration(status.currentTime)} / {formatDuration(status.duration)}
        {status.playing ? '  ▶ playing' : '  ⏸ paused'}
      </Text>
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

  // File recording state
  const [fileFormat, setFileFormat] = useState<'wav' | 'pcm'>('wav');
  const [isFileRecording, setIsFileRecording] = useState(false);
  const [recordedFiles, setRecordedFiles] = useState<RecordedFile[]>([]);
  const [selectedUri, setSelectedUri] = useState<string | null>(null);
  const [continuationUri, setContinuationUri] = useState<string | null>(null);

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

      console.log(`${bufferCount}`);
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

  const handleStartFileRecording = async () => {
    try {
      await stream.startFileRecordingAsync({
        format: fileFormat,
        ...(continuationUri ? { uri: continuationUri } : {}),
      });
      setIsFileRecording(true);
    } catch (error: any) {
      Alert.alert('Error starting file recording', error.message);
    }
  };

  const handleStopFileRecording = async () => {
    try {
      const result = await stream.stopFileRecordingAsync();
      setIsFileRecording(false);
      setContinuationUri(null);
      setRecordedFiles((prev) => {
        // Replace the existing entry if we were continuing into it, otherwise append
        const idx = prev.findIndex((f) => f.uri === result.uri);
        if (idx !== -1) {
          const next = [...prev];
          next[idx] = result;
          return next;
        }
        return [...prev, result];
      });
    } catch (error: any) {
      Alert.alert('Error stopping file recording', error.message);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const formatDuration = (seconds: number) => `${seconds.toFixed(1)}s`;

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

      {/* ── File Recording ─────────────────────────────────────── */}
      <HeadingText>File Recording</HeadingText>

      {continuationUri && (
        <View style={styles.continuationBanner}>
          <Ionicons name="arrow-redo-circle" style={styles.continuationIcon} />
          <Text style={styles.continuationText} numberOfLines={2}>
            Appending to:{'\n'}
            {continuationUri.split('/').pop()}
          </Text>
          <TouchableOpacity onPress={() => setContinuationUri(null)} hitSlop={8}>
            <Ionicons name="close-circle" style={styles.continuationClear} />
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.encodingRow}>
        <Button
          onPress={() => setFileFormat('wav')}
          title={`${fileFormat === 'wav' ? '✓ ' : ''}WAV`}
          disabled={isFileRecording}
        />
        <Button
          onPress={() => setFileFormat('pcm')}
          title={`${fileFormat === 'pcm' ? '✓ ' : ''}PCM`}
          disabled={isFileRecording}
        />
      </View>

      <View style={styles.fileRecordRow}>
        <Button
          title="Start File Recording"
          onPress={handleStartFileRecording}
          disabled={isFileRecording}
        />
        <Button
          title="Stop File Recording"
          onPress={handleStopFileRecording}
          disabled={!isFileRecording}
        />
      </View>

      <View style={styles.fileRecordStatus}>
        <View
          style={[styles.statusDot, { backgroundColor: isFileRecording ? '#e63946' : '#aaa' }]}
        />
        <Text style={styles.infoLabel}>
          {isFileRecording ? 'Recording to file…' : 'File recording stopped'}
        </Text>
      </View>

      {/* ── Recorded Files ─────────────────────────────────────── */}
      {recordedFiles.length > 0 && (
        <>
          <HeadingText>Recorded Files</HeadingText>
          <Text style={styles.hint}>
            Tap to play · tap <Ionicons name="arrow-redo-circle" size={12} /> to continue recording
            into it.
          </Text>
          <View style={styles.codeBox}>
            {recordedFiles.map((file, index) => {
              const isSelected = selectedUri === file.uri;
              const isContinuation = continuationUri === file.uri;
              return (
                <TouchableOpacity
                  key={file.uri + index}
                  onPress={() => setSelectedUri(isSelected ? null : file.uri)}
                  style={[styles.fileRow, isSelected && styles.fileRowSelected]}>
                  <Text style={styles.fileIndex}>#{index + 1}</Text>
                  <View style={styles.fileDetails}>
                    <Text style={styles.fileUri} numberOfLines={3}>
                      {file.uri}
                    </Text>
                    <Text style={styles.fileMeta}>
                      {formatDuration(file.duration)} · {formatBytes(file.size)} · {file.sampleRate}{' '}
                      Hz · {file.channels}ch · {file.encoding}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setContinuationUri(isContinuation ? null : file.uri)}
                    hitSlop={8}>
                    <Ionicons
                      name="arrow-redo-circle"
                      style={[styles.fileChevron, isContinuation && styles.fileChevronContinuation]}
                    />
                  </TouchableOpacity>
                  <Ionicons
                    name={isSelected ? 'checkmark-circle' : 'chevron-forward'}
                    style={[styles.fileChevron, isSelected && { color: Colors.tintColor }]}
                  />
                </TouchableOpacity>
              );
            })}
          </View>
        </>
      )}

      {/* ── Playback ───────────────────────────────────────────── */}
      {selectedUri && (
        <>
          <HeadingText>Playback</HeadingText>
          <PlaybackControls
            key={selectedUri}
            uri={selectedUri}
            onClose={() => setSelectedUri(null)}
          />
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
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
  // File recording
  fileRecordRow: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
    marginVertical: 10,
  },
  fileRecordStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  hint: {
    fontSize: 12,
    color: '#666',
    marginBottom: 6,
  },
  // Code box / file list
  codeBox: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 12,
  },
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    gap: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#333',
  },
  fileRowSelected: {
    backgroundColor: '#1e2d3d',
  },
  fileIndex: {
    color: '#888',
    fontSize: 12,
    fontFamily: 'monospace',
    minWidth: 24,
  },
  fileDetails: {
    flex: 1,
    gap: 2,
  },
  fileUri: {
    color: '#4cc9f0',
    fontSize: 11,
    fontFamily: 'monospace',
  },
  fileMeta: {
    color: '#aaa',
    fontSize: 11,
  },
  fileChevron: {
    fontSize: 16,
    color: '#555',
  },
  fileChevronContinuation: {
    color: '#e63946',
  },
  // Continuation banner
  continuationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2d1f1f',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#e63946',
    borderRadius: 8,
    padding: 10,
    gap: 8,
    marginBottom: 10,
  },
  continuationIcon: {
    fontSize: 18,
    color: '#e63946',
  },
  continuationText: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#f4a0a8',
  },
  continuationClear: {
    fontSize: 18,
    color: '#888',
  },
  // Playback
  playbackContainer: {
    backgroundColor: '#f0f4f8',
    borderRadius: 8,
    padding: 12,
    gap: 8,
    marginBottom: 16,
  },
  playbackUri: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: '#555',
  },
  playbackRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  playbackButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playbackIcon: {
    fontSize: 20,
    color: 'white',
  },
  playbackTime: {
    fontSize: 13,
    color: '#555',
  },
});
