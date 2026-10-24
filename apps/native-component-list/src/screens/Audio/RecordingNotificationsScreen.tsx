import {
  AudioModule,
  RecordingPresets,
  requestNotificationPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, TextInput, View } from 'react-native';

import { BodyText } from '../../components/BodyText';
import Button from '../../components/Button';
import HeadingText from '../../components/HeadingText';
import AudioPlayer from './AudioPlayer';

export default function RecordingNotificationsScreen() {
  const [title, setTitle] = useState('Voice memo');
  const [body, setBody] = useState('Your voice memo is recording');
  const [color, setColor] = useState('#4f66f6');
  const [showPauseResume, setShowPauseResume] = useState(true);
  const [uri, setUri] = useState<string>();
  const [busy, setBusy] = useState(false);
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY, (status) => {
    if (status.isFinished && !status.hasError && status.url) {
      setUri(status.url);
    }
  });
  const state = useAudioRecorderState(recorder);

  const applyOptions = () => {
    recorder.setNotificationOptions({
      title,
      recordingBody: body,
      pausedBody: 'Your voice memo is paused',
      pauseButtonTitle: 'Pause memo',
      resumeButtonTitle: 'Resume memo',
      stopButtonTitle: 'Finish memo',
      channelName: 'Voice memos',
      channelDescription: 'Voice memo recording controls',
      smallIcon: 'notification_icon',
      color,
      showPauseResume,
      showOnLockScreen: true,
    });
  };

  const start = async () => {
    setBusy(true);
    try {
      const permission = await AudioModule.requestRecordingPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Microphone permission is required');
        return;
      }
      const notifications = await requestNotificationPermissionsAsync();
      if (!notifications.granted) {
        Alert.alert('Allow notifications to see recording controls');
        return;
      }
      await setAudioModeAsync({ allowsBackgroundRecording: true });
      applyOptions();
      setUri(undefined);
      await recorder.prepareToRecordAsync();
      recorder.record();
    } catch (error) {
      Alert.alert('Recording failed', String(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <HeadingText>Recording notification</HeadingText>
      <BodyText>
        Edit the title, body, or accent color, then start a memo and open the notification shade.
        Apply options while recording, or try the native Pause, Resume, and Finish buttons.
      </BodyText>
      <BodyText>Notification title</BodyText>
      <TextInput
        accessibilityLabel="Notification title"
        value={title}
        onChangeText={setTitle}
        style={styles.input}
      />
      <BodyText>Notification body</BodyText>
      <TextInput
        accessibilityLabel="Notification body"
        value={body}
        onChangeText={setBody}
        style={styles.input}
      />
      <BodyText>Accent color</BodyText>
      <TextInput
        accessibilityLabel="Accent color"
        value={color}
        onChangeText={setColor}
        style={styles.input}
      />
      <View style={styles.row}>
        <BodyText>Show native Pause and Resume</BodyText>
        <Switch value={showPauseResume} onValueChange={setShowPauseResume} />
      </View>
      <Button
        title="Apply notification options"
        onPress={() => {
          try {
            applyOptions();
          } catch (error) {
            Alert.alert('Notification options failed', String(error));
          }
        }}
      />
      <Button
        title="Restore default notification"
        onPress={() => recorder.setNotificationOptions({})}
      />
      <Button title="Start memo" onPress={start} disabled={state.canRecord || busy} />
      <Button
        title="Stop memo"
        onPress={() =>
          recorder.stop().catch((error: Error) => Alert.alert('Stop failed', error.message))
        }
        disabled={!state.canRecord || busy}
      />
      <BodyText>
        {state.isRecording ? 'Recording' : state.canRecord ? 'Paused' : 'Stopped'}:{' '}
        {(state.durationMillis / 1000).toFixed(1)}s
      </BodyText>
      {uri ? (
        <>
          <HeadingText>Last recording</HeadingText>
          <AudioPlayer key={uri} source={{ uri }} />
        </>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 12 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  input: { borderWidth: 1, borderColor: '#888', borderRadius: 4, padding: 10, color: '#888' },
});
