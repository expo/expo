import { NavigationLink } from '@/components/navigation-link';
import { ThemedText } from '@/components/themed-text';
import { RootLayout } from '@/layouts';
import ExpoBrownfieldModule from 'expo-brownfield';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

const message = () => ({
  sender: 'React Native app',
  receiver: 'Native app',
  type: 'example_message',
  data: {
    array: [1, 2, 3.5, true, 'hello', false, { key: 'value' }],
    object: {
      nested: {
        key: 'value',
      },
    },
    number: 123.456,
    boolean: false,
    string: 'hello',
  },
  metadata: {
    timestamp: new Date().toUTCString(),
    platform: `${Platform.OS} (React Native)`,
  },
});

const CommunicationScreen = () => {
  const [messageFromNative, setMessageFromNative] = useState<object | null>(
    null,
  );

  useEffect(() => {
    const listener = ExpoBrownfieldModule.addListener(setMessageFromNative);
    return () => listener.remove();
  }, []);

  return (
    <RootLayout
      headerOptions={{
        headerBackgroundColor: { light: '#BBF7D0', dark: '#166534' },
        headerImage: {
          color: '#4ADE80',
          name: 'arrow.left.arrow.right',
        },
        title: 'Communication',
      }}
    >
      <NavigationLink
        onPress={() => ExpoBrownfieldModule.popToNative()}
        title="Pop to native"
        subtitle="Return to native app"
      />
      <NavigationLink
        onPress={() => ExpoBrownfieldModule.popToNative(true)}
        title="Pop to native (animated)"
        subtitle="Return to native app with animation enabled (iOS UIKit only)"
      />
      <NavigationLink
        onPress={() => ExpoBrownfieldModule.sendMessage(message())}
        title="Send message"
        subtitle="Send example message to native app"
      />
      <ThemedText type="defaultSemiBold">Message from native app:</ThemedText>
      <ThemedText type="code">
        {messageFromNative ? JSON.stringify(messageFromNative, null, 2) : '-'}
      </ThemedText>
    </RootLayout>
  );
};

export default CommunicationScreen;
