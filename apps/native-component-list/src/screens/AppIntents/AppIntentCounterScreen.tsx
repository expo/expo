import { useTheme } from 'ThemeProvider';
import { useRoute } from 'expo-router';
import * as React from 'react';
import { StyleSheet, View } from 'react-native';

import { BodyText } from '../../components/BodyText';
import Button from '../../components/Button';
import { ScrollPage, Section } from '../../components/Page';
import { AppIntentDonationButtons } from './AppIntentDonationButtons';
import { AppIntentExitButton } from './AppIntentExitButton';
import { getCounterState, resetCounterState, type AppIntentCounterState } from './AppIntentsStore';
import { useAppIntentState } from './useAppIntentState';

const initialCounterState: AppIntentCounterState = {
  count: 0,
  countedInvocationIds: [],
};

function formatDate(timestamp?: number): string {
  return timestamp ? new Date(timestamp).toLocaleString() : 'Never';
}

export default function AppIntentCounterScreen() {
  const route = useRoute<any>();
  const { theme } = useTheme();
  const counterState = useAppIntentState(getCounterState, initialCounterState);
  const openedBySiri = route.params?.source === 'siri';

  return (
    <ScrollPage>
      <Section title="Counter">
        <View
          style={[
            styles.hero,
            {
              backgroundColor: openedBySiri ? 'rgba(72, 187, 120, 0.18)' : theme.background.default,
              borderColor: openedBySiri ? '#38a169' : theme.border.default,
            },
          ]}>
          <BodyText style={styles.count}>{counterState.count}</BodyText>
          <BodyText>
            {openedBySiri
              ? 'Opened after a counter intent ran.'
              : 'Opened manually from the API list.'}
          </BodyText>
        </View>
      </Section>

      <Section title="Last Siri Invocation">
        <BodyText>Last increment: {formatDate(counterState.lastIncrementedAt)}</BodyText>
        <BodyText>Invocation id: {counterState.lastInvocationId ?? 'None'}</BodyText>
      </Section>

      <Section title="Controls">
        <View style={styles.controls}>
          <AppIntentExitButton />
          <Button
            title="Reset counter"
            onPress={() => {
              resetCounterState().catch((error: unknown) => {
                console.warn(
                  'Could not reset the counter. The previous count stays on screen; check that AsyncStorage is writable.',
                  error
                );
              });
            }}
          />
        </View>
      </Section>

      <Section title="Donations">
        <View style={styles.controls}>
          <BodyText>
            Donation Probe has no params and is not an App Shortcut, so the system suggests it only
            after a donation. Add to Counter takes an amount, which the donation passes as its
            DonationParams record.
          </BodyText>
          <AppIntentDonationButtons title="Donation Probe" intent="donationProbe" />
          <AppIntentDonationButtons title="Add 5" intent="addToCounter" params={{ amount: 5 }} />
        </View>
      </Section>
    </ScrollPage>
  );
}

AppIntentCounterScreen.navigationOptions = {
  title: 'App Intent Counter',
};

const styles = StyleSheet.create({
  hero: {
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
    gap: 8,
  },
  count: {
    fontSize: 44,
    fontWeight: '700',
  },
  controls: {
    gap: 10,
  },
});
