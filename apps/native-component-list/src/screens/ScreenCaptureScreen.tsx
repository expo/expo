import * as ScreenCapture from 'expo-screen-capture';
import React from 'react';
import { FlatList, Platform, StyleSheet, Text, View } from 'react-native';

import HeadingText from '../components/HeadingText';
import MonoText from '../components/MonoText';
import TitleSwitch from '../components/TitledSwitch';

function useScreenCapture({
  onScreenshot,
  onScreenRecording,
}: {
  onScreenshot: () => void;
  onScreenRecording: (props: { isCaptured: boolean }) => void;
}) {
  const hasPermissions = async () => {
    const { status } = await ScreenCapture.requestPermissionsAsync();
    return status === 'granted';
  };

  React.useEffect(() => {
    let screenshotListener: ScreenCapture.Subscription;
    let screenRecordingListener: ScreenCapture.Subscription;

    const addListenerAsync = async () => {
      if (await hasPermissions()) {
        screenshotListener = ScreenCapture.addScreenshotListener(onScreenshot);
        screenRecordingListener = ScreenCapture.addScreenRecordingListener(onScreenRecording);
      } else {
        alert('Permissions needed to capture screenshot events are missing!');
      }
    };

    addListenerAsync();

    return () => {
      screenshotListener?.remove();
      screenRecordingListener?.remove();
    };
  }, []);
}

type Timestamp = {
  type: 'screenshot' | 'screen-recording';
  timestamp: Date;
  isCaptured?: boolean;
};

export default function ScreenCaptureScreen() {
  const [isEnabled, setEnabled] = React.useState(true);
  const [timestamps, setTimestamps] = React.useState<Timestamp[]>([]);

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
    onScreenRecording: ({ isCaptured }) => {
      setTimestamps((timestamps) =>
        timestamps.concat([{ type: 'screen-recording', timestamp: new Date(), isCaptured }])
      );
    },
  });

  return (
    <View style={styles.container}>
      <TitleSwitch title="Screen Capture Allowed" value={isEnabled} setValue={setEnabled} />
      <Text style={{ padding: 8 }}>
        Take a screenshot or attempt to record the screen to test that the image is/isn't obscured.
      </Text>
      <HeadingText>Capture Timestamps</HeadingText>
      {Platform.OS === 'ios' ? (
        <Text>Take a screenshot or record the screen to test if the listener works.</Text>
      ) : (
        <Text>Take a screenshot to test if the listener works.</Text>
      )}
      <FlatList
        data={timestamps}
        keyExtractor={(item) => item.timestamp.getTime() + '-' + item.type}
        renderItem={({ item }) => (
          <MonoText>
            {item.timestamp.toLocaleTimeString()} - {item.type}
            {item.type === 'screen-recording'
              ? item.isCaptured
                ? ' - Started'
                : ' - Stopped'
              : ''}
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
