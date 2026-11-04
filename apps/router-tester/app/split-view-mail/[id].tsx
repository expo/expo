import { useLocalSearchParams } from 'expo-router';
import { use } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';

import { MESSAGES, ToolbarPressContext } from '@/components/split-view-mail';

export default function MessageScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const message = MESSAGES.find((m) => m.id === id);
  if (!message) {
    return <Text>Message not found</Text>;
  }
  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
      <Text style={styles.sender}>{message.sender}</Text>
      <Text style={styles.date}>{message.date}</Text>
      <Text style={styles.subject}>{message.subject}</Text>
      <Text style={styles.body}>{message.body}</Text>
      <Text testID="split-view-mail-message-press">
        Last toolbar press: {use(ToolbarPressContext)}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 8 },
  sender: { fontSize: 17, fontWeight: '600' },
  date: { color: 'gray' },
  subject: { fontSize: 28, fontWeight: '700', marginTop: 12 },
  body: { fontSize: 17, lineHeight: 24 },
});
