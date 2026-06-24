import { useRoute } from '@react-navigation/native';
import { useTheme } from 'ThemeProvider';
import * as React from 'react';
import { StyleSheet, View } from 'react-native';

import { AppIntentExitButton } from './AppIntentExitButton';
import {
  clearJournalEntries,
  getJournalEntries,
  type AppIntentJournalEntry,
} from './AppIntentsStore';
import { useAppIntentState } from './useAppIntentState';
import { BodyText } from '../../components/BodyText';
import Button from '../../components/Button';
import { ScrollPage, Section } from '../../components/Page';

function formatDate(timestamp?: number): string {
  return timestamp ? new Date(timestamp).toLocaleString() : 'Never';
}

function JournalEntry({ entry, highlight }: { entry: AppIntentJournalEntry; highlight: boolean }) {
  const { theme } = useTheme();
  return (
    <View
      style={[
        styles.entry,
        {
          backgroundColor: highlight ? 'rgba(159, 122, 234, 0.16)' : theme.background.default,
          borderColor: highlight ? '#805ad5' : theme.border.default,
        },
      ]}>
      <BodyText style={styles.entryTitle}>{entry.title}</BodyText>
      <BodyText>{entry.message}</BodyText>
      <BodyText color="secondary">Created at: {formatDate(entry.createdAt)}</BodyText>
      <BodyText color="secondary">Invocation id: {entry.invocationId}</BodyText>
    </View>
  );
}

export default function AppIntentJournalScreen() {
  const route = useRoute<any>();
  const entries = useAppIntentState<AppIntentJournalEntry[]>(getJournalEntries, []);
  const highlightedInvocationId =
    route.params?.source === 'siri' ? route.params?.intentId : undefined;

  return (
    <ScrollPage>
      <Section title="Journal Entries">
        {entries.length > 0 ? (
          <View style={styles.entries}>
            {entries.map((entry) => (
              <JournalEntry
                key={entry.id}
                entry={entry}
                highlight={entry.invocationId === highlightedInvocationId}
              />
            ))}
          </View>
        ) : (
          <BodyText>No journal entries have been created yet.</BodyText>
        )}
      </Section>

      <Section title="Controls">
        <View style={styles.controls}>
          <AppIntentExitButton />
          <Button title="Clear journal entries" onPress={() => clearJournalEntries()} />
        </View>
      </Section>
    </ScrollPage>
  );
}

AppIntentJournalScreen.navigationOptions = {
  title: 'App Intent Journal',
};

const styles = StyleSheet.create({
  entries: {
    gap: 10,
  },
  entry: {
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 6,
    padding: 12,
  },
  entryTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  controls: {
    gap: 10,
  },
});
