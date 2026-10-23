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
  const [body, setBody] = useState('Your voice memo is recording');
  const [color, setColor] = useState('#4f66f6');
  const [showPauseResume, setShowPauseResume] = useState(true);
  const [handleStopInJS, setHandleStopInJS] = useState(true);
  const [events, setEvents] = useState<string[]>([]);
  const stopping = useRef(false);
  const [uri, setUri] = useState<string>();
  const [busy, setBusy] = useState(false);
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY, (status) => {
    if (status.isFinished && !status.hasError && status.url) {
      setUri(status.url);
    }
  });
  const state = useAudioRecorderState(recorder);

  const stop = useCallback(async () => {
    if (stopping.current) return;
    stopping.current = true;
    try {
      // Stop resets the duration, so save it before stopping.
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
        [
          `${event.action} (${event.action === 'bookmark' ? 'custom' : event.defaultPrevented ? 'JavaScript' : 'native'})`,
          ...events,
        ].slice(0, 10)
      );
      if (event.action === 'stop' && event.defaultPrevented) {
        stop().catch((error: Error) => Alert.alert('Stop failed', error.message));
      }
    });
    return () => subscription.remove();
  }, [recorder, stop]);

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
      buttons: [
        ...(showPauseResume ? [{ id: 'pause' }] : []),
        { id: 'bookmark', title: 'Bookmark' },
        { id: 'stop', title: 'Finish memo', preventDefault: handleStopInJS },
      ],
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
        Start a memo and open the notification shade. Pause and Resume stay native. Bookmark sends
        an event without stopping. JavaScript Finish saves the duration before stopping.
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
      <View style={styles.row}>
        <BodyText>Handle Finish in JavaScript</BodyText>
        <Switch
          accessibilityLabel="Handle Finish in JavaScript"
          value={handleStopInJS}
          onValueChange={setHandleStopInJS}
        />
      </View>
      <BodyText>
        JavaScript buttons require a running JavaScript runtime and an event listener.
      </BodyText>
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
        onPress={() => stop().catch((error: Error) => Alert.alert('Stop failed', error.message))}
        disabled={!state.canRecord || busy}
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
