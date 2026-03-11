import * as Clipboard from 'expo-clipboard';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';

import { isCurrentPlatformSupported } from '../../components/FunctionDemo/utils';
import HeadingText from '../../components/HeadingText';
import MonoTextWithCountdown from '../../components/MonoTextWithCountdown';

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
    clipboardListener.current = Clipboard.addClipboardListener((event) => {
      setValue(JSON.stringify(event, null, 2));
    });

    return () => {
      if (clipboardListener.current) {
        Clipboard.removeClipboardListener(clipboardListener.current);
      }
    };
  }, []);

  return value !== undefined ? (
    <MonoTextWithCountdown timeout={30 * 1000} onCountdownEnded={() => setValue(undefined)}>
      {value}
    </MonoTextWithCountdown>
  ) : (
    <Text>No recent changes. Copy something to trigger event</Text>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 20,
  },
});
