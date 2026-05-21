import {
  AudioModule,
  AudioQuality,
  createAudioPlayer,
  useAudioRecorder,
  useAudioRecorderState,
  type AudioPlayer,
  type RecordingOptions,
} from 'expo-audio';
import React, { useEffect, useState } from 'react';
import { Alert, Button, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

const adtsRecording: RecordingOptions = {
  extension: '.aac',
  sampleRate: 44100,
  numberOfChannels: 1,
  bitRate: 128000,
  android: { outputFormat: 'aac_adts', audioEncoder: 'aac' },
  ios: { audioQuality: AudioQuality.HIGH },
  web: {},
};

export default function AdtsSeekTestScreen() {
  const recorder = useAudioRecorder(adtsRecording);
  const recorderState = useAudioRecorderState(recorder);
  const [uri, setUri] = useState<string | null>(null);
  const [cbrSeek, setCbrSeek] = useState(true);
  const [player, setPlayer] = useState<AudioPlayer | null>(null);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    (async () => {
      const status = await AudioModule.requestRecordingPermissionsAsync();
      if (!status.granted) {
        Alert.alert('Permission to access microphone was denied');
      }
    })();
  }, []);

  // Rebuild the player whenever uri or the flag changes, so the constructor
  // option is actually re-applied.
  useEffect(() => {
    if (!uri) return;
    const p = createAudioPlayer({ uri }, { enableConstantBitrateSeeking: cbrSeek });
    setPlayer(p);
    const interval = setInterval(() => setCurrentTime(p.currentTime), 200);
    return () => {
      clearInterval(interval);
      p.release();
    };
  }, [uri, cbrSeek]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>1. Record ≥15s of audio in ADTS</Text>
      <Button
        title={recorderState.isRecording ? 'Stop recording' : 'Record (ADTS)'}
        onPress={async () => {
          if (recorderState.isRecording) {
            await recorder.stop();
            setUri(recorder.uri);
            return;
          }
          await recorder.prepareToRecordAsync();
          recorder.record();
        }}
      />
      <Text>Recorded URI: {uri ?? '(none yet)'}</Text>

      <Text style={styles.heading}>2. Toggle the flag and seek</Text>
      <View style={styles.row}>
        <Text>enableConstantBitrateSeeking</Text>
        <Switch value={cbrSeek} onValueChange={setCbrSeek} />
      </View>
      <Text>currentTime: {currentTime.toFixed(2)}s</Text>
      <Button title="Play" onPress={() => player?.play()} disabled={!player} />
      <Button title="Pause" onPress={() => player?.pause()} disabled={!player} />
      <Button title="Seek to 10s" onPress={() => player?.seekTo(10)} disabled={!player} />
      <Button title="Seek to 0" onPress={() => player?.seekTo(0)} disabled={!player} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12 },
  heading: { fontWeight: '600', marginTop: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
