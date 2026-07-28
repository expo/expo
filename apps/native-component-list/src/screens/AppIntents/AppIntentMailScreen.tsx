import { Column, Host, Text } from '@expo/ui';
import { useTheme } from 'ThemeProvider';
import * as AppIntents from 'expo-app-intents';
import { useRoute } from 'expo-router';
import * as React from 'react';
import { StyleSheet, View } from 'react-native';

import { BodyText } from '../../components/BodyText';
import Button from '../../components/Button';
import { ScrollPage, Section } from '../../components/Page';
import { AppIntentExitButton } from './AppIntentExitButton';
import {
  addSampleMailDrafts,
  clearMailDrafts,
  getMailDrafts,
  type AppIntentMailDraft,
} from './AppIntentsStore';
import { syncMailDraftCatalogAsync } from './syncMailDraftCatalogAsync';
import { useAppIntentState } from './useAppIntentState';

function formatDate(timestamp?: number): string {
  return timestamp ? new Date(timestamp).toLocaleString() : 'Never';
}

/**
 * The card is rendered with `@expo/ui` so it can carry an `appEntityIdentifier` modifier, which
 * tells the system which `MailDraftEntity` the visible view represents.
 */
function MailDraft({ draft, highlight }: { draft: AppIntentMailDraft; highlight: boolean }) {
  const { theme } = useTheme();
  const draftStyle = {
    backgroundColor: highlight ? 'rgba(159, 122, 234, 0.16)' : theme.background.default,
    borderColor: highlight ? '#805ad5' : theme.border.default,
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 12,
    width: '100%' as const,
  };
  const subjectTextStyle = { color: theme.text.default, fontSize: 18, fontWeight: '700' as const };
  const bodyTextStyle = { color: theme.text.default };
  const secondaryTextStyle = { color: theme.text.secondary, fontSize: 14 };

  return (
    <Host matchContents={{ vertical: true }} seedColor="#805ad5" style={styles.draftHost}>
      <Column
        modifiers={[AppIntents.appEntityIdentifier('mailDraft', draft.id)]}
        spacing={6}
        style={draftStyle}>
        <Text textStyle={subjectTextStyle}>{draft.subject}</Text>
        <Text textStyle={bodyTextStyle}>{draft.body}</Text>
        {draft.recipients.length > 0 ? (
          <Text textStyle={secondaryTextStyle}>{`To: ${draft.recipients.join(', ')}`}</Text>
        ) : null}
        <Text textStyle={secondaryTextStyle}>{`Created at: ${formatDate(draft.createdAt)}`}</Text>
        <Text textStyle={secondaryTextStyle}>{`Invocation id: ${draft.invocationId}`}</Text>
      </Column>
    </Host>
  );
}

export default function AppIntentMailScreen() {
  const route = useRoute<any>();
  const drafts = useAppIntentState<AppIntentMailDraft[]>(getMailDrafts, []);
  const highlightedInvocationId =
    route.params?.source === 'siri' ? route.params?.intentId : undefined;
  const highlightedDraftId = route.params?.source === 'siri' ? route.params?.draftId : undefined;

  const addSamples = React.useCallback(async () => {
    const drafts = await addSampleMailDrafts();
    await syncMailDraftCatalogAsync(drafts);
  }, []);
  return (
    <ScrollPage>
      <Section title="Mail Drafts">
        {drafts.length > 0 ? (
          <View style={styles.drafts}>
            {drafts.map((draft) => (
              <MailDraft
                key={draft.id}
                draft={draft}
                highlight={
                  draft.invocationId === highlightedInvocationId || draft.id === highlightedDraftId
                }
              />
            ))}
          </View>
        ) : (
          <BodyText>No mail drafts have been created yet.</BodyText>
        )}
      </Section>

      <Section title="Controls">
        <View style={styles.controls}>
          <AppIntentExitButton />
          <Button
            title="Add 5 sample drafts"
            onPress={() => {
              addSamples().catch((error: unknown) => {
                console.warn(
                  'Could not add the sample mail drafts. Check that AsyncStorage is writable.',
                  error
                );
              });
            }}
          />
          <Button
            title="Clear mail drafts"
            onPress={() => {
              // The entity catalog has to be emptied along with the stored drafts. It lives in
              // UserDefaults and outlives the app, so a catalog left behind keeps offering drafts
              // that no longer exist: Siri resolves one, `DeleteDraftIntent` reports success, and
              // nothing changes.
              clearMailDrafts()
                .then(() => {
                  syncMailDraftCatalogAsync([]).catch((error: unknown) => {
                    console.warn(
                      'The mail drafts were cleared, but their App Intents catalog could not be emptied. Siri may continue offering stale drafts until the catalog is published again.',
                      error
                    );
                  });
                })
                .catch((error: unknown) => {
                  console.warn(
                    'Could not clear the stored mail drafts. They stay on screen; check that AsyncStorage is writable.',
                    error
                  );
                });
            }}
          />
        </View>
      </Section>
    </ScrollPage>
  );
}

AppIntentMailScreen.navigationOptions = {
  title: 'App Intent Mail',
};

const styles = StyleSheet.create({
  drafts: {
    gap: 10,
  },
  draftHost: {
    width: '100%',
  },
  controls: {
    gap: 10,
  },
});
