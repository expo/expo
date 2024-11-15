import * as ScreenCapture from 'expo-screen-capture';
import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import HeadingText from '../components/HeadingText';
import MonoText from '../components/MonoText';
import TitleSwitch from '../components/TitledSwitch';

function useScreenCapture({
  onScreenshot,
  onRecording,
}: {
  onScreenshot: () => void;
  onRecording: () => void;
}) {
  const hasPermissions = async () => {
    const { status } = await ScreenCapture.requestPermissionsAsync();
    return status === 'granted';
  };

  React.useEffect(() => {
    let screenshotListener: ScreenCapture.Subscription;
    let recordingListener: ScreenCapture.Subscription;

    const addListenerAsync = async () => {
      if (await hasPermissions()) {
        screenshotListener = ScreenCapture.addScreenshotListener(onScreenshot);
        recordingListener = ScreenCapture.addRecordingListener(onRecording);
      } else {
        alert('Permissions needed to capture screenshot events are missing!');
      }
    };

    addListenerAsync();

    return () => {
      screenshotListener?.remove();
      recordingListener?.remove();
    };
  }, []);
}

export default function ScreenCaptureScreen() {
  const [isEnabled, setEnabled] = React.useState(true);
  const [timestamps, setTimestamps] = React.useState<
    { type: 'screenshot' | 'recording'; timestamp: Date }[]
  >([]);

  React.useEffect(() => {
    if (isEnabled) {
      ScreenCapture.allowScreenCaptureAsync();
    } else {
      ScreenCapture.preventScreenCaptureAsync();
    }
  }, [isEnabled]);

  useScreenCapture({
    onScreenshot: () =>
      setTimestamps((timestamps) =>
        timestamps.concat([{ type: 'screenshot', timestamp: new Date() }])
      ),
    onRecording: () =>
      setTimestamps((timestamps) =>
        timestamps.concat([{ type: 'recording', timestamp: new Date() }])
      ),
  });

  return (
    <View style={styles.container}>
      <TitleSwitch title="Screen Capture Allowed" value={isEnabled} setValue={setEnabled} />
      <Text style={{ padding: 8 }}>
        Take a screenshot or attempt to record the screen to test that the image is/isn't obscured.
      </Text>
      <HeadingText>Capture Timestamps</HeadingText>
      <Text>Take a screenshot or record the screen to test if the listener works.</Text>
      <FlatList
        data={timestamps}
        keyExtractor={(item) => item.timestamp.getTime() + '-' + item.type}
        renderItem={({ item }) => (
          <MonoText>
            {item.timestamp.toLocaleTimeString()} - {item.type}
          </MonoText>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
