import { Link } from 'expo-router';
import { SplitView } from 'expo-router/unstable-split-view';
import { PlatformColor, Pressable, ScrollView, StyleSheet, Text } from 'react-native';

const mailboxes = ['Inbox', 'VIP', 'Drafts', 'Sent', 'Junk', 'Bin', 'All Mail'];
const messages = [
  ['Security alert', 'Google', 'You allowed iOS access to your Google Account data'],
  ['Welcome to Google Photos', 'Google Photos', 'The home for your memories'],
  ['See more from your friends', 'Instagram', 'New people to discover'],
];

export default function Layout() {
  return (
    <SplitView implementation="expo-ui" preferredSplitBehavior="tile">
      <SplitView.Column title="Mailboxes" headerLargeTitle={false}>
        <ScrollView contentInsetAdjustmentBehavior="automatic" style={styles.sidebar}>
          {mailboxes.map((mailbox) => (
            <Pressable key={mailbox} style={styles.row}>
              <Text style={styles.icon}>☆</Text>
              <Text style={styles.rowTitle}>{mailbox}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </SplitView.Column>
      <SplitView.Column title="Inbox Gmail" headerLargeTitle={false}>
        <ScrollView contentInsetAdjustmentBehavior="automatic" style={styles.list}>
          {messages.map(([subject, sender, preview], index) => (
            <Link key={subject} href={`/split-view-mail/${index}`} asChild>
              <Pressable style={styles.message}>
                <Text style={styles.sender}>{sender}</Text>
                <Text style={styles.subject}>{subject}</Text>
                <Text numberOfLines={2} style={styles.preview}>
                  {preview}
                </Text>
              </Pressable>
            </Link>
          ))}
        </ScrollView>
      </SplitView.Column>
      <SplitView.Screen name="index" options={{ title: 'Mail' }} />
      <SplitView.Screen name="[id]" options={{ title: 'Message' }} />
    </SplitView>
  );
}

const styles = StyleSheet.create({
  sidebar: { flex: 1, backgroundColor: PlatformColor('secondarySystemBackground') },
  list: { flex: 1, backgroundColor: PlatformColor('systemBackground') },
  row: { flexDirection: 'row', gap: 12, paddingHorizontal: 18, paddingVertical: 12 },
  icon: { color: PlatformColor('systemBlue'), fontSize: 22 },
  rowTitle: { fontSize: 18 },
  message: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sender: { fontSize: 17, fontWeight: '600' },
  subject: { fontSize: 16 },
  preview: { color: PlatformColor('secondaryLabel'), fontSize: 15 },
});
