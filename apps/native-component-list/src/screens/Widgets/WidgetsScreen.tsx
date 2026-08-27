import { Button, Column, Host, ScrollView, Text } from '@expo/ui';
import { addUserInteractionListener, type UserInteractionEvent } from 'expo-widgets';
import * as React from 'react';

import CounterWidget from './CounterWidget';
import { COUNTER_WIDGET_INCREMENT_TARGET, COUNTER_WIDGET_NAME } from './WidgetConstants';

export default function WidgetsScreen() {
  const [count, setCount] = React.useState(0);
  const [lastInteraction, setLastInteraction] = React.useState<UserInteractionEvent | null>(null);
  const [status, setStatus] = React.useState('Waiting for an update or widget interaction.');

  React.useEffect(() => {
    const subscription = addUserInteractionListener((event) => {
      if (event.source !== COUNTER_WIDGET_NAME) {
        return;
      }

      setLastInteraction(event);
      setStatus(`Received widget interaction: ${event.target}`);
      if (event.target === COUNTER_WIDGET_INCREMENT_TARGET) {
        setCount((current) => current + 1);
      }
    });

    return () => subscription.remove();
  }, []);

  const updateCount = (nextCount: number) => {
    CounterWidget.updateSnapshot({ count: nextCount });
    setCount(nextCount);
    setStatus(`Updated widget snapshot to ${nextCount}.`);
  };

  const reload = () => {
    CounterWidget.reload();
    setStatus('Requested a widget reload.');
  };

  return (
    <Host style={{ flex: 1 }}>
      <ScrollView>
        <Column spacing={20} style={{ padding: 20 }}>
          <Column spacing={8}>
            <Text textStyle={{ fontSize: 22, fontWeight: 'bold' }}>Interactive counter</Text>
            <Text>
              Add “Bare Expo Counter” from the home-screen widget picker. The widget button
              increments without the app, and this screen mirrors taps while the app process is
              alive.
            </Text>
          </Column>

          <Column spacing={8}>
            <Text textStyle={{ fontSize: 18, fontWeight: 'bold' }}>Snapshot controls</Text>
            <Text>{`Screen count: ${count}`}</Text>
            <Button label={`Set widget to ${count + 1}`} onPress={() => updateCount(count + 1)} />
            <Button label="Reset widget to 0" variant="outlined" onPress={() => updateCount(0)} />
            <Button label="Reload widget" variant="text" onPress={reload} />
          </Column>

          <Column spacing={8}>
            <Text textStyle={{ fontSize: 18, fontWeight: 'bold' }}>Interaction listener</Text>
            <Text>{status}</Text>
            <Text>
              {lastInteraction
                ? `Source: ${lastInteraction.source}\nTarget: ${lastInteraction.target}\nTime: ${new Date(lastInteraction.timestamp).toLocaleTimeString()}`
                : 'No widget interaction received during this screen session.'}
            </Text>
          </Column>
        </Column>
      </ScrollView>
    </Host>
  );
}
