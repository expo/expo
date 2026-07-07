import { Column, Host, Text } from '@expo/ui';
import { useRoute } from '@react-navigation/native';
import { useTheme } from 'ThemeProvider';
import * as React from 'react';
import * as AppIntents from 'expo-app-intents';
import { StyleSheet, View } from 'react-native';

import { AppIntentExitButton } from './AppIntentExitButton';
import {
  addSampleJournalEntries,
  clearJournalEntries,
  getJournalEntries,
  type AppIntentJournalEntry,
} from './AppIntentsStore';
import { useAppIntentState } from './useAppIntentState';
import { syncJournalEntryCatalogAsync } from './syncJournalEntryCatalogAsync';
import { BodyText } from '../../components/BodyText';
import Button from '../../components/Button';
import { ScrollPage, Section } from '../../components/Page';

function JournalEntry({ entry, highlight }: { entry: AppIntentJournalEntry; highlight: boolean }) {
  const { theme } = useTheme();
  const entryStyle = {
    backgroundColor: highlight ? 'rgba(159, 122, 234, 0.16)' : theme.background.default,
    borderColor: highlight ? '#805ad5' : theme.border.default,
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 12,
    width: '100%' as const,
  };
  const titleTextStyle = {
    color: theme.text.default,
    fontSize: 18,
    fontWeight: '700' as const,
  };
  const bodyTextStyle = {
    color: theme.text.default,
  };
  const secondaryTextStyle = {
    color: theme.text.secondary,
    fontSize: 14,
  };

  return (
    <Host matchContents={{ vertical: true }} seedColor="#805ad5" style={styles.entryHost}>
      <Column
        modifiers={[AppIntents.appEntityIdentifier('journalEntry', entry.id)]}
        spacing={6}
        style={entryStyle}>
        <Text textStyle={titleTextStyle}>{entry.title}</Text>
        <Text textStyle={bodyTextStyle}>{entry.message}</Text>
        <Text textStyle={secondaryTextStyle}>{`Created at: 01.01.1979 at 11:50:01`}</Text>
        <Text textStyle={secondaryTextStyle}>{`Invocation id: ${entry.invocationId}`}</Text>
      </Column>
    </Host>
  );
}

export default function AppIntentJournalScreen() {
  const route = useRoute<any>();
  const entries = useAppIntentState<AppIntentJournalEntry[]>(getJournalEntries, []);
  const highlightedInvocationId =
    route.params?.source === 'siri' ? route.params?.intentId : undefined;
  const highlightedEntryId = route.params?.source === 'siri' ? route.params?.entryId : undefined;
  const addSamples = React.useCallback(async () => {
    const entries = await addSampleJournalEntries();
    await syncJournalEntryCatalogAsync(entries);
  }, []);
  const clearEntries = React.useCallback(async () => {
    await clearJournalEntries();
    await syncJournalEntryCatalogAsync([]);
  }, []);

  return (
    <ScrollPage>
      <Section title="Journal Entries">
        {entries.length > 0 ? (
          <View style={styles.entries}>
            {entries.map((entry) => (
              <JournalEntry
                key={entry.id}
                entry={entry}
                highlight={
                  entry.invocationId === highlightedInvocationId ||
                  entry.id === highlightedEntryId
                }
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
          <Button
            title="Add 5 sample entries"
            onPress={() => {
              addSamples().catch((error: unknown) => {
                console.warn('Could not add sample journal entries.', error);
              });
            }}
          />
          <Button
            title="Clear journal entries"
            onPress={() => {
              clearEntries().catch((error: unknown) => {
                console.warn('Could not clear journal entries.', error);
              });
            }}
          />
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
  entryHost: {
    width: '100%',
  },
  controls: {
    gap: 10,
  },
});
