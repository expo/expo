import * as ExpoBrownfield from 'expo-brownfield';
import { useEffect, useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ActionButton, Header } from '@/components';

type MessageType = Record<string, any>;
const MESSAGE: MessageType = {};

const Communication = () => {
  const [message, setMessage] = useState<MessageType>({});

  useEffect(() => {
    const subscription = ExpoBrownfield.addMessageListener((event) => {
      setMessage(event);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  return (
    <SafeAreaView>
      <Header title="Communication" />
      <ActionButton
        title="Send message"
        description="Send a message to the native app"
        icon="send"
        onPress={() => ExpoBrownfield.sendMessage(MESSAGE)}
      />
      <View style={styles.container}>
        <Text style={styles.title}>Received message (latest):</Text>
        <Text style={styles.message}>{JSON.stringify(message, null, 2)}</Text>
      </View>
    </SafeAreaView>
  );
};

export default Communication;

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  message: {
    borderRadius: 8,
    padding: 16,
    backgroundColor: '#121212',
    fontSize: 14,
    fontWeight: '400',
    color: 'lightgreen',
    fontFamily: 'monospace',
    lineHeight: 20,
  },
});
