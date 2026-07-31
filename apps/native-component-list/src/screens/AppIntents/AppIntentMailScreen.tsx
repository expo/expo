import { useRoute } from '@react-navigation/native';
import { useTheme } from 'ThemeProvider';
import * as React from 'react';
import { StyleSheet, View } from 'react-native';

import { BodyText } from '../../components/BodyText';
import Button from '../../components/Button';
import { ScrollPage, Section } from '../../components/Page';
import { AppIntentExitButton } from './AppIntentExitButton';
import { clearMailDrafts, getMailDrafts, type AppIntentMailDraft } from './AppIntentsStore';
import { syncMailDraftCatalogAsync } from './syncMailDraftCatalogAsync';
import { useAppIntentState } from './useAppIntentState';

function formatDate(timestamp?: number): string {
  return timestamp ? new Date(timestamp).toLocaleString() : 'Never';
}

function MailDraft({ draft, highlight }: { draft: AppIntentMailDraft; highlight: boolean }) {
  const { theme } = useTheme();
  return (
    <View
      style={[
        styles.draft,
        {
          backgroundColor: highlight ? 'rgba(159, 122, 234, 0.16)' : theme.background.default,
          borderColor: highlight ? '#805ad5' : theme.border.default,
        },
      ]}>
      <BodyText style={styles.draftSubject}>{draft.subject}</BodyText>
      <BodyText>{draft.body}</BodyText>
      {draft.recipients.length > 0 ? (
        <BodyText color="secondary">To: {draft.recipients.join(', ')}</BodyText>
      ) : null}
      <BodyText color="secondary">Created at: {formatDate(draft.createdAt)}</BodyText>
      <BodyText color="secondary">Invocation id: {draft.invocationId}</BodyText>
    </View>
  );
}

export default function AppIntentMailScreen() {
  const route = useRoute<any>();
  const drafts = useAppIntentState<AppIntentMailDraft[]>(getMailDrafts, []);
  const highlightedInvocationId =
    route.params?.source === 'siri' ? route.params?.intentId : undefined;

  return (
    <ScrollPage>
      <Section title="Mail Drafts">
        {drafts.length > 0 ? (
          <View style={styles.drafts}>
            {drafts.map((draft) => (
              <MailDraft
                key={draft.id}
                draft={draft}
                highlight={draft.invocationId === highlightedInvocationId}
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
            title="Clear mail drafts"
            onPress={() => {
              // The entity catalog has to be emptied along with the stored drafts. It lives in
              // UserDefaults and outlives the app, so a catalog left behind keeps offering drafts
              // that no longer exist: Siri resolves one, `DeleteDraftIntent` reports success, and
              // nothing changes.
              clearMailDrafts()
                .then(() => syncMailDraftCatalogAsync([]))
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
  draft: {
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 6,
    padding: 12,
  },
  draftSubject: {
    fontSize: 18,
    fontWeight: '700',
  },
  controls: {
    gap: 10,
  },
});
