import { Stack, useLocalSearchParams } from 'expo-router';
import { PlatformColor, ScrollView, StyleSheet, Text } from 'react-native';

export default function Message() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const photoMessage = id === '1';

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
      <Stack.Title>{photoMessage ? 'Google Photos' : 'Google'}</Stack.Title>
      <Stack.Toolbar placement="left">
        <Stack.Toolbar.Button icon="arrow.up.left.and.arrow.down.right" />
      </Stack.Toolbar>
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button icon="arrowshape.turn.up.left" />
        <Stack.Toolbar.Button icon="arrowshape.turn.up.left.2" />
        <Stack.Toolbar.Button icon="arrowshape.turn.up.right" />
        <Stack.Toolbar.Button icon="archivebox" />
        <Stack.Toolbar.Button icon="folder" />
        <Stack.Toolbar.Button icon="magnifyingglass" />
      </Stack.Toolbar>
      <Text style={styles.sender}>{photoMessage ? 'Google Photos' : 'Google'}</Text>
      <Text style={styles.date}>October 26, 2026</Text>
      <Text style={styles.title}>
        {photoMessage ? 'The home for your memories' : 'Security alert'}
      </Text>
      <Text style={styles.body}>
        {photoMessage
          ? 'Keep your photos and videos safe, organized, and available from every device.'
          : 'A new sign-in was detected on your account. Review the activity to make sure it was you.'}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 32, gap: 18 },
  sender: { fontSize: 18, fontWeight: '600' },
  date: { color: PlatformColor('secondaryLabel') },
  title: { fontSize: 34, fontWeight: '700', marginTop: 36 },
  body: { color: PlatformColor('secondaryLabel'), fontSize: 19, lineHeight: 28 },
});
