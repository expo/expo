import * as ScreenCapture from 'expo-screen-capture';
import React from 'react';
import { FlatList, Platform, StyleSheet, Text, View } from 'react-native';

import HeadingText from '../components/HeadingText';
import MonoText from '../components/MonoText';
import TitleSwitch from '../components/TitledSwitch';

function useScreenCapture(onCapture: () => void) {
  const hasPermissions = async () => {
    const { status } = await ScreenCapture.requestPermissionsAsync();
    return status === 'granted';
  };

  React.useEffect(() => {
    let listener: ScreenCapture.Subscription;

    const addListenerAsync = async () => {
      if (await hasPermissions()) {
        listener = ScreenCapture.addScreenshotListener(onCapture);
      } else {
        alert('Permissions needed to capture screenshot events are missing!');
      }
    };

    addListenerAsync();

    return () => {
      listener?.remove();
    };
  }, []);
}

export default function ScreenCaptureScreen() {
  const [isEnabled, setEnabled] = React.useState(true);
  const [isAppSwitcherProtectionEnabled, setAppSwitcherProtectionEnabled] = React.useState(false);
  const [timestamps, setTimestamps] = React.useState<Date[]>([]);

  React.useEffect(() => {
    if (isEnabled) {
      ScreenCapture.allowScreenCaptureAsync();
    } else {
      ScreenCapture.preventScreenCaptureAsync();
    }
  }, [isEnabled]);

  React.useEffect(() => {
    if (Platform.OS === 'ios') {
      if (isAppSwitcherProtectionEnabled) {
        ScreenCapture.enableAppSwitcherProtectionAsync();
      } else {
        ScreenCapture.disableAppSwitcherProtectionAsync();
      }
    }
  }, [isAppSwitcherProtectionEnabled]);

  // Clean up on unmount: allow screen capture on all platforms, disable app switcher protection on iOS
  React.useEffect(() => {
    return () => {
      ScreenCapture.allowScreenCaptureAsync();
      if (Platform.OS === 'ios') {
        ScreenCapture.disableAppSwitcherProtectionAsync();
      }
    };
  }, []);

  useScreenCapture(() => setTimestamps((timestamps) => timestamps.concat([new Date()])));

  return (
    <View style={styles.container}>
      <TitleSwitch title="Screen Capture Allowed" value={isEnabled} setValue={setEnabled} />
      <Text style={styles.description}>
        Take a screenshot or attempt to record the screen to test that the image is/isn't obscured.
      </Text>

      {Platform.OS === 'ios' && (
        <>
          <TitleSwitch
            title="App Switcher Protection"
            value={isAppSwitcherProtectionEnabled}
            setValue={setAppSwitcherProtectionEnabled}
            style={styles.switchSpacing}
          />
          <Text style={styles.description}>
            When enabled, shows blur overlay when app is not in focus.{'\n'}
            Test by opening app switcher or going to background.
          </Text>
        </>
      )}

      <HeadingText style={styles.heading}>Screenshot Timestamps</HeadingText>
      <Text style={styles.timestampDescription}>
        Take a screenshot to test if the listener works.
      </Text>
      <FlatList
        data={timestamps}
        keyExtractor={(item) => item.getTime() + '-'}
        renderItem={({ item }) => <MonoText>{item.toLocaleTimeString()}</MonoText>}
        style={styles.timestampList}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
  },
  description: {
    padding: 8,
    textAlign: 'center',
    marginBottom: 16,
  },
  switchSpacing: {
    marginTop: 16,
  },
  heading: {
    marginTop: 24,
    marginBottom: 8,
  },
  timestampDescription: {
    textAlign: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  timestampList: {
    maxHeight: 200,
    width: '100%',
  },
});
