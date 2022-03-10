import * as Clipboard from 'expo-clipboard';
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

import HeadingText from '../../components/HeadingText';
import MonoTextWithCountdown from '../../components/MonoTextWithCountdown';

const STRING_TRIM_THRESHOLD = 100;

export default function ClipboardListenerDemo() {
  const clipboardListener = React.useRef<Clipboard.Subscription | null>(null);
  const [value, setValue] = React.useState<string | undefined>(undefined);

  React.useEffect(() => {
    clipboardListener.current = Clipboard.addClipboardListener(
      (event: Clipboard.ClipboardEvent) => {
        setValue(stringifyEvent(event));
      }
    );

    return () => {
      if (clipboardListener.current) {
        Clipboard.removeClipboardListener(clipboardListener.current);
      }
    };
  }, []);

  return (
    <View style={styles.container}>
      <HeadingText>Clipboard Listener</HeadingText>
      {value !== undefined ? (
        <MonoTextWithCountdown timeout={30 * 1000} onCountdownEnded={() => setValue(undefined)}>
          {value}
        </MonoTextWithCountdown>
      ) : (
        <Text>No recent changes. Copy something to trigger event</Text>
      )}
    </View>
  );
}

function stringifyEvent(event: Clipboard.ClipboardEvent): string {
  const trimmedResult = Object.fromEntries(
    Object.entries(event).map(([key, value]) => [
      key,
      typeof value === 'string' && value.length > STRING_TRIM_THRESHOLD
        ? `${value.substring(0, STRING_TRIM_THRESHOLD)}...`
        : value,
    ])
  );

  return JSON.stringify(trimmedResult, null, 2);
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 20,
  },
});
