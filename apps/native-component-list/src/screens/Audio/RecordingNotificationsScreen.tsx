import {
  AudioModule,
  RecordingPresets,
  requestNotificationPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, TextInput, View } from 'react-native';

import { BodyText } from '../../components/BodyText';
import Button from '../../components/Button';
import HeadingText from '../../components/HeadingText';
import AudioPlayer from './AudioPlayer';

export default function RecordingNotificationsScreen() {
  const [title, setTitle] = useState('Voice memo');
  const [handleActionsInJS, setHandleActionsInJS] = useState(false);
  const [events, setEvents] = useState<string[]>([]);
  const [uri, setUri] = useState<string>();
  const [busy, setBusy] = useState(false);
  const stopping = useRef(false);
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY, (status) => {
    if (status.isFinished && !status.hasError && status.url) {
      setUri(status.url);
    }
  });
  const state = useAudioRecorderState(recorder);

  const stop = useCallback(async () => {
    if (stopping.current) {
      return;
    }
    stopping.current = true;
    try {
      // Read the final duration before stop resets the recorder.
      const duration = recorder.currentTime;
      await recorder.stop();
      setEvents((events) => [`Saved ${duration.toFixed(1)}s recording`, ...events].slice(0, 10));
    } finally {
      stopping.current = false;
    }
  }, [recorder]);

  useEffect(() => {
    const subscription = recorder.addListener('recordingNotificationAction', (event) => {
      setEvents((events) =>
        [`${event.action} at ${recorder.currentTime.toFixed(1)}s`, ...events].slice(0, 10)
      );
      try {
        if (event.action === 'pause' && recorder.isRecording) {
          recorder.pause();
        } else if (event.action === 'resume' && !recorder.isRecording) {
          recorder.record();
        } else if (event.action === 'stop') {
          stop().catch((error: Error) => Alert.alert('Stop failed', error.message));
        }
      } catch (error) {
        Alert.alert('Notification action failed', String(error));
      }
    });
    return () => subscription.remove();
  }, [recorder, stop]);

  const applyOptions = () => {
    recorder.setNotificationOptions({
      title,
      recordingBody: 'Your voice memo is recording',
      pausedBody: 'Your voice memo is paused',
      pauseButtonTitle: 'Pause memo',
      resumeButtonTitle: 'Resume memo',
      stopButtonTitle: 'Finish memo',
      channelName: 'Voice memos',
      channelDescription: 'Voice memo recording controls',
      smallIcon: 'notification_icon',
      color: 0x4f66f6,
      showPauseResume: true,
      showOnLockScreen: true,
      handleActionsInJS,
      actions: [{ id: 'bookmark', title: 'Bookmark' }],
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
      setEvents([]);
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
        Start a memo, then open the notification shade or lock the screen. Try Pause, Resume,
        Bookmark, and Finish. Bookmark reports the current recording time without stopping.
      </BodyText>
      <BodyText>Notification title</BodyText>
      <TextInput
        accessibilityLabel="Notification title"
        value={title}
        onChangeText={setTitle}
        style={styles.input}
      />
      <View style={styles.row}>
        <BodyText>Handle built-in actions in JavaScript</BodyText>
        <Switch value={handleActionsInJS} onValueChange={setHandleActionsInJS} />
      </View>
      <BodyText>
        JavaScript mode reads the duration before stopping. It requires a running JavaScript
        runtime. Native mode handles Pause, Resume, and Finish without a JavaScript listener.
      </BodyText>
      <Button title="Apply notification options" onPress={applyOptions} />
      <Button
        title="Restore default notification"
        onPress={() => recorder.setNotificationOptions({})}
      />
      <Button title="Start memo" onPress={start} disabled={state.canRecord || busy} />
      <Button
        title="Stop memo"
        onPress={() => stop().catch((error: Error) => Alert.alert('Stop failed', error.message))}
        disabled={!state.canRecord || stopping.current}
      />
      <BodyText>
        {state.isRecording ? 'Recording' : state.canRecord ? 'Paused' : 'Stopped'}:{' '}
        {(state.durationMillis / 1000).toFixed(1)}s
      </BodyText>
      <HeadingText>Notification actions</HeadingText>
      {events.map((event, index) => (
        <BodyText key={index}>{event}</BodyText>
      ))}
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
