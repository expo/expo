import { Column, Host, Text as ExpoUIText } from '@expo/ui';
import { useTheme } from 'ThemeProvider';
import * as AppIntents from 'expo-app-intents';
import { useRoute } from 'expo-router';
import * as React from 'react';
import { StyleSheet, Text as ReactNativeText, View } from 'react-native';

import { BodyText } from '../../components/BodyText';
import Button from '../../components/Button';
import { ScrollPage, Section } from '../../components/Page';
import { AppIntentExitButton } from './AppIntentExitButton';
import {
  addSampleMailDrafts,
  clearMailDrafts,
  getMailDrafts,
  toggleMailDraftFlag,
  type AppIntentMailDraft,
} from './AppIntentsStore';
import { syncMailDraftCatalogAsync } from './syncMailDraftCatalogAsync';
import { useAppIntentState } from './useAppIntentState';

function formatDate(timestamp?: number): string {
  return timestamp ? new Date(timestamp).toLocaleString() : 'Never';
}

function MailDraft({
  draft,
  highlight,
  onToggleFlag,
}: {
  draft: AppIntentMailDraft;
  highlight: boolean;
  onToggleFlag: (flag: 'hideInSpotlight' | 'hideInSuggestions') => void;
}) {
  const { theme } = useTheme();
  const draftStyle = {
    backgroundColor: highlight ? 'rgba(159, 122, 234, 0.16)' : theme.background.default,
    borderColor: highlight ? '#805ad5' : theme.border.default,
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 6,
    padding: 12,
    width: '100%' as const,
  };
  const subjectTextStyle = { color: theme.text.default, fontSize: 18, fontWeight: '700' as const };
  const bodyTextStyle = { color: theme.text.default };
  const secondaryTextStyle = { color: theme.text.secondary, fontSize: 14 };

  return (
    <View style={styles.draftGroup}>
      <View style={styles.integrationGroup}>
        <ReactNativeText style={[styles.integrationLabel, secondaryTextStyle]}>
          ExpoUI modifier
        </ReactNativeText>
        <Host matchContents={{ vertical: true }} seedColor="#805ad5" style={styles.draftHost}>
          <Column
            modifiers={[AppIntents.appEntityIdentifier('mailDraft', draft.id)]}
            spacing={6}
            style={draftStyle}>
            <ExpoUIText textStyle={subjectTextStyle}>{draft.subject}</ExpoUIText>
            <ExpoUIText textStyle={bodyTextStyle}>{draft.body}</ExpoUIText>
            {draft.recipients.length > 0 ? (
              <ExpoUIText textStyle={secondaryTextStyle}>
                {`To: ${draft.recipients.join(', ')}`}
              </ExpoUIText>
            ) : null}
            <ExpoUIText textStyle={secondaryTextStyle}>
              {`Created at: ${formatDate(draft.createdAt)}`}
            </ExpoUIText>
            <ExpoUIText textStyle={secondaryTextStyle}>
              {`Invocation id: ${draft.invocationId}`}
            </ExpoUIText>
          </Column>
        </Host>
      </View>

      <View style={styles.integrationGroup}>
        <ReactNativeText style={[styles.integrationLabel, secondaryTextStyle]}>
          UIKit wrapper
        </ReactNativeText>
        <AppIntents.AppEntityView entity="mailDraft" entityId={draft.id} style={draftStyle}>
          <ReactNativeText style={subjectTextStyle}>{draft.subject}</ReactNativeText>
          <ReactNativeText style={bodyTextStyle}>{draft.body}</ReactNativeText>
          {draft.recipients.length > 0 ? (
            <ReactNativeText style={secondaryTextStyle}>
              {`To: ${draft.recipients.join(', ')}`}
            </ReactNativeText>
          ) : null}
          <ReactNativeText style={secondaryTextStyle}>
            {`Created at: ${formatDate(draft.createdAt)}`}
          </ReactNativeText>
          <ReactNativeText style={secondaryTextStyle}>
            {`Invocation id: ${draft.invocationId}`}
          </ReactNativeText>
        </AppIntents.AppEntityView>
      </View>

      <View style={styles.draftFlags}>
        <Button
          title={draft.hideInSpotlight ? 'Show in Spotlight' : 'Hide from Spotlight'}
          onPress={() => onToggleFlag('hideInSpotlight')}
        />
        <Button
          title={draft.hideInSuggestions ? 'Show in suggestions' : 'Hide from suggestions'}
          onPress={() => onToggleFlag('hideInSuggestions')}
        />
      </View>
    </View>
  );
}

export default function AppIntentMailScreen() {
  const route = useRoute<any>();
  const drafts = useAppIntentState<AppIntentMailDraft[]>(getMailDrafts, []);
  const highlightedInvocationId =
    route.params?.source === 'siri' ? route.params?.intentId : undefined;
  const highlightedDraftId = route.params?.source === 'siri' ? route.params?.draftId : undefined;

  const addSamples = React.useCallback(async () => {
    await addSampleMailDrafts();
    await syncMailDraftCatalogAsync();
  }, []);
  const toggleFlag = React.useCallback(
    async (id: string, flag: 'hideInSpotlight' | 'hideInSuggestions') => {
      // Republishing the catalog is what applies the change: expo-app-intents rebuilds the
      // Spotlight index from it, and the app-target query reads hideInSuggestions out of metadata.
      await toggleMailDraftFlag(id, flag);
      await syncMailDraftCatalogAsync();
    },
    []
  );
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
                onToggleFlag={(flag) => {
                  toggleFlag(draft.id, flag).catch((error) => {
                    console.warn('Could not change the draft visibility.', error);
                  });
                }}
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
                  syncMailDraftCatalogAsync().catch((error: unknown) => {
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
  draftGroup: {
    gap: 6,
  },
  draftFlags: {
    flexDirection: 'row',
    gap: 8,
  },
  draftHost: {
    width: '100%',
  },
  integrationGroup: {
    gap: 4,
  },
  integrationLabel: {
    fontWeight: '600',
  },
  controls: {
    gap: 10,
  },
});
