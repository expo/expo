import { useRoute } from '@react-navigation/native';
import { useTheme } from 'ThemeProvider';
import * as React from 'react';
import { StyleSheet, View } from 'react-native';

import { AppIntentExitButton } from './AppIntentExitButton';
import { clearLatestOrder, getLatestOrder, type AppIntentOrder } from './AppIntentsStore';
import { useAppIntentState } from './useAppIntentState';
import { BodyText } from '../../components/BodyText';
import Button from '../../components/Button';
import { ScrollPage, Section } from '../../components/Page';

function formatDate(timestamp?: number): string {
  return timestamp ? new Date(timestamp).toLocaleString() : 'Never';
}

export default function AppIntentOrderScreen() {
  const route = useRoute<any>();
  const { theme } = useTheme();
  const latestOrder = useAppIntentState<AppIntentOrder | null>(getLatestOrder, null);
  const openedBySiri = route.params?.source === 'siri';

  return (
    <ScrollPage>
      <Section title="Current Order">
        {latestOrder ? (
          <View
            style={[
              styles.orderCard,
              {
                backgroundColor: openedBySiri
                  ? 'rgba(66, 153, 225, 0.16)'
                  : theme.background.default,
                borderColor: openedBySiri ? '#3182ce' : theme.border.default,
              },
            ]}>
            <BodyText style={styles.dishName}>{latestOrder.dishName}</BodyText>
            <BodyText>Dish id: {latestOrder.dishId}</BodyText>
            <BodyText>Ordered at: {formatDate(latestOrder.createdAt)}</BodyText>
            <BodyText>Invocation id: {latestOrder.invocationId}</BodyText>
          </View>
        ) : (
          <BodyText>No order has been received yet.</BodyText>
        )}
      </Section>

      <Section title="Intent Handling">
        <BodyText>
          When several unhandled order intents are pending, BareExpo keeps the latest order and
          removes the rest from the pending queue.
        </BodyText>
      </Section>

      <Section title="Controls">
        <View style={styles.controls}>
          <AppIntentExitButton />
          <Button title="Clear latest order" onPress={() => clearLatestOrder()} />
        </View>
      </Section>
    </ScrollPage>
  );
}

AppIntentOrderScreen.navigationOptions = {
  title: 'App Intent Order',
};

const styles = StyleSheet.create({
  orderCard: {
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 8,
    padding: 16,
  },
  dishName: {
    fontSize: 26,
    fontWeight: '700',
  },
  controls: {
    gap: 10,
  },
});
