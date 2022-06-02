import * as Clipboard from 'expo-clipboard';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, LogBox } from 'react-native';

import { isCurrentPlatformSupported } from '../../components/FunctionDemo/utils';
import HeadingText from '../../components/HeadingText';
import MonoTextWithCountdown from '../../components/MonoTextWithCountdown';

const STRING_TRIM_THRESHOLD = 100;

// TODO: (barthap): Remove this once we removed the listener wrapper from `Clipboard.ts`
LogBox.ignoreLogs([/The 'content' property of the clipboard event is deprecated/]);

export default function ClipboardListenerDemo() {
  const isSupported = useMemo(() => isCurrentPlatformSupported(['ios', 'android']), []);

  return (
    <View style={styles.container}>
      <HeadingText>Clipboard Listener</HeadingText>
      {isSupported ? (
        <ClipboardListenerContent />
      ) : (
        <Text>Clipboard listener is not supported on web</Text>
      )}
    </View>
  );
}

function ClipboardListenerContent() {
  const clipboardListener = useRef<Clipboard.Subscription | null>(null);
  const [value, setValue] = useState<string | undefined>(undefined);

  useEffect(() => {
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

  return value !== undefined ? (
    <>
      <MonoTextWithCountdown timeout={30 * 1000} onCountdownEnded={() => setValue(undefined)}>
        {value}
      </MonoTextWithCountdown>
      <Text>The 'content' property should be empty</Text>
    </>
  ) : (
    <Text>No recent changes. Copy something to trigger event</Text>
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
